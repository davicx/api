"""
core/ec2/ec2_scanner.py

**AWS only** — DescribeInstances + CloudWatch CPU. No rules here; output is plain dicts for ``core.rules``.
``ec2_logic.run_ec2_scan`` calls ``scan_ec2_instances`` — filters and region follow ``scope`` (see **STEP**s in that function).

Each instance is normalized by ``_normalize_ec2_instance`` (single place: boto ``Instances[]`` element → canonical dict).
Resource id is always ``instance_id`` (not ``id``) for consistency with rules.
"""

from __future__ import annotations

# --- imports ---

from typing import Any, Dict, List, Optional

from botocore.exceptions import BotoCoreError, ClientError

from config.aws.sessions import create_session
from config.config import LOOKBACK_DAYS, PROFILE


"""
FUNCTIONS A: Small helpers (tags, CPU, filters, region)
    A1) _get_name_tag          — Name tag from EC2 tag list
    A2) _get_avg_cpu           — CloudWatch avg CPU over lookback window
    A3) _effective_region      — ``scope.type == region`` → session region from ``scope.value``
    A4) _describe_filters      — optional instance-id / tag filters

FUNCTIONS B: Normalization + public scan
    B0) _normalize_ec2_instance — boto instance dict → canonical rule-engine dict
    B1) scan_ec2_instances      — paginate DescribeInstances, normalize each row
"""

# Stable contract for ``core.rules`` / EC2 (see ``_normalize_ec2_instance``).
CANONICAL_EC2_INSTANCE_KEYS = (
    "instance_id",
    "name",
    "instance_type",
    "avg_cpu",
    "region",
    "launch_time",
    "state",
    "tags",
)

# Only these tag keys are copied onto ``instance["tags"]`` (sandbox / toggle testing).
TAG_KEYS_TO_INCLUDE = frozenset({"Name", "cloudpilot-role"})


# ---------------------------------------------------------------------------
# FUNCTIONS A: Private helpers
# ---------------------------------------------------------------------------


class ScanExecutionError(RuntimeError):
    """Raised when the EC2 scan cannot complete against AWS."""


def _get_name_tag(tags: Optional[list]) -> Optional[str]:
    """FUNCTION A1: Convenience for the Name tag (used in instance dicts)."""
    if not tags:
        return None

    for tag in tags:
        if tag.get("Key") == "Name":
            return tag.get("Value")
    return None


def _tags_for_rules(boto_tags: Optional[list]) -> Dict[str, str]:
    """Map EC2 tag list → dict, keeping only ``TAG_KEYS_TO_INCLUDE`` when present."""
    if not boto_tags:
        return {}
    out: Dict[str, str] = {}
    for tag in boto_tags:
        key = tag.get("Key")
        if key in TAG_KEYS_TO_INCLUDE:
            val = tag.get("Value")
            if val is not None:
                out[key] = val
    return out


def _get_avg_cpu(
    cloudwatch_client,
    instance_id: str,
    lookback_days: int = LOOKBACK_DAYS,
) -> Optional[float]:
    """FUNCTION A2: Average CPUUtilization (daily points) — rules need ``avg_cpu`` or skip."""
    from datetime import datetime, timedelta, timezone

    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(days=lookback_days)

    response = cloudwatch_client.get_metric_statistics(
        Namespace="AWS/EC2",
        MetricName="CPUUtilization",
        Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
        StartTime=start_time,
        EndTime=end_time,
        Period=86400,
        Statistics=["Average"],
    )

    datapoints = response.get("Datapoints", [])
    if not datapoints:
        return None

    averages = [point["Average"] for point in datapoints if "Average" in point]
    if not averages:
        return None

    return round(sum(averages) / len(averages), 2)


def _effective_region(region: Optional[str], scope: Dict[str, Any]) -> Optional[str]:
    """
    FUNCTION A3: When ``scope.type == region``, boto3 uses ``scope.value`` as the region (override ``region`` arg).
    """
    st = scope.get("type") or "full"
    if st == "region":
        v = scope.get("value")
        if v:
            return v
    return region


def _describe_filters(scope: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    FUNCTION A4: Narrow by instance id or tag when ``scope`` says so.

    ``full`` / ``region`` — no extra EC2 filters (region is the session endpoint).
    This makes "full EC2" scan all non-terminated instances that DescribeInstances returns.
    """
    filters: List[Dict[str, Any]] = []
    st = scope.get("type") or "full"

    if st == "instance":
        val = scope.get("value")
        if val:
            filters.append({"Name": "instance-id", "Values": [val]})
    elif st == "tag":
        key = scope.get("key")
        val = scope.get("value")
        if key and val is not None:
            filters.append({"Name": f"tag:{key}", "Values": [val]})

    return filters


def _normalize_ec2_instance(
    boto_instance: Dict[str, Any],
    cloudwatch_client,
    effective_region: str,
) -> Dict[str, Any]:
    """
    Map one ``DescribeInstances`` ``Instances[]`` element to the canonical dict rules expect.

    Always uses ``instance_id`` for the EC2 id. Keys match ``CANONICAL_EC2_INSTANCE_KEYS``.
    ``tags`` holds a subset of instance tags (see ``TAG_KEYS_TO_INCLUDE``).
    """
    raw_tags = boto_instance.get("Tags")
    instance_id = boto_instance["InstanceId"]
    instance_type = boto_instance.get("InstanceType")
    name = _get_name_tag(raw_tags)
    launch_time = boto_instance.get("LaunchTime")
    state = (boto_instance.get("State") or {}).get("Name")
    avg_cpu = _get_avg_cpu(cloudwatch_client, instance_id)

    return {
        "instance_id": instance_id,
        "name": name,
        "instance_type": instance_type,
        "avg_cpu": avg_cpu,
        "region": effective_region,
        "launch_time": launch_time,
        "state": state,
        "tags": _tags_for_rules(raw_tags),
    }


# ---------------------------------------------------------------------------
# FUNCTIONS B: Public scan
# ---------------------------------------------------------------------------


def scan_ec2_instances(
    region: Optional[str] = None,
    scope: Optional[Dict[str, Any]] = None,
) -> List[dict]:
    """
    FUNCTION B1: Paginated DescribeInstances → one dict per instance for ``run_rules``.

    Each item is normalized by ``_normalize_ec2_instance``; keys are ``CANONICAL_EC2_INSTANCE_KEYS``.
    """
    # STEP 1: Align with API — default scope type ``full``
    scope = scope or {"type": "full"}

    # STEP 2: Session region (``region`` scope type wins inside ``_effective_region``)
    effective_region = _effective_region(region, scope)

    clients = create_session(PROFILE, effective_region)
    ec2_client = clients["ec2"]
    cloudwatch_client = clients["cloudwatch"]

    instances: List[dict] = []

    # STEP 3: Paginate — filters from ``_describe_filters`` (optional id/tag)
    paginator = ec2_client.get_paginator("describe_instances")
    pages = paginator.paginate(Filters=_describe_filters(scope))

    try:
        for page in pages:
            for reservation in page.get("Reservations", []):
                for instance in reservation.get("Instances", []):
                    instances.append(
                        _normalize_ec2_instance(
                            instance,
                            cloudwatch_client,
                            effective_region,
                        )
                    )
    except (BotoCoreError, ClientError) as exc:
        raise ScanExecutionError(
            f"Failed EC2 scan in region {effective_region}: {exc}"
        ) from exc

    return instances
