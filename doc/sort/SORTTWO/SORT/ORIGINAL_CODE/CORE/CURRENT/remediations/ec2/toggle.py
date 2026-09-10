"""
EC2 primary ↔ secondary toggle (tag: ``cloudpilot-role``).

Uses ``create_session`` + EC2 waiters. Fails closed if zero or multiple instances per role.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from botocore.exceptions import BotoCoreError, ClientError

from config.aws.sessions import create_session
from config.config import PROFILE, REGION
from core.models.remediation import Remediation
from core.models.remediation_result import RemediationResult
from core.models.remediation_state import RemediationState

TAG_KEY = "cloudpilot-role"
PRIMARY = "primary"
SECONDARY = "secondary"


def _tags_to_map(tags: Any) -> Dict[str, str]:
    """EC2 ``Tags`` from boto3 is a list of ``{Key, Value}`` dicts; stubs vary, so we take ``Any``."""
    if not tags or not isinstance(tags, list):
        return {}
    out: Dict[str, str] = {}
    for t in tags:
        if not isinstance(t, dict):
            continue
        k, v = t.get("Key"), t.get("Value")
        if k is not None and v is not None:
            out[str(k)] = str(v)
    return out


def _discover_primary_secondary(ec2) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]], Optional[str]]:
    """
    Return (primary, secondary, error_message).

    Each of primary/secondary is ``{"id": str, "state": str}`` or None if missing.
    """
    primaries: List[Dict[str, Any]] = []
    secondaries: List[Dict[str, Any]] = []

    try:
        paginator = ec2.get_paginator("describe_instances")
        pages = paginator.paginate(
            Filters=[
                {"Name": f"tag:{TAG_KEY}", "Values": [PRIMARY, SECONDARY]},
            ]
        )
        for page in pages:
            for reservation in page.get("Reservations", []):
                for instance in reservation.get("Instances", []):
                    iid = instance["InstanceId"]
                    state = (instance.get("State") or {}).get("Name", "")
                    tags = _tags_to_map(instance.get("Tags"))  # boto3 Instance.Tags
                    role = tags.get(TAG_KEY)
                    row = {"id": iid, "state": state}
                    if role == PRIMARY:
                        primaries.append(row)
                    elif role == SECONDARY:
                        secondaries.append(row)
    except (BotoCoreError, ClientError) as exc:
        return None, None, f"AWS error listing instances: {exc}"

    if len(primaries) == 0 or len(secondaries) == 0:
        return None, None, "Need exactly one instance tagged cloudpilot-role=primary and one with secondary."
    if len(primaries) > 1:
        return None, None, f"Ambiguous: {len(primaries)} instances tagged {TAG_KEY}={PRIMARY} (expected 1)."
    if len(secondaries) > 1:
        return None, None, f"Ambiguous: {len(secondaries)} instances tagged {TAG_KEY}={SECONDARY} (expected 1)."

    return primaries[0], secondaries[0], None


def _refresh_pair(ec2) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]], Optional[str]]:
    return _discover_primary_secondary(ec2)


def execute_toggle() -> RemediationResult:
    clients = create_session(PROFILE, REGION)
    ec2 = clients["ec2"]

    primary, secondary, err = _discover_primary_secondary(ec2)
    if err:
        return RemediationResult(success=False, message=err, warnings=[])

    # When err is unset, discovery always found two rows (types stay Optional for the checker).
    assert primary is not None and secondary is not None
    before = {"primary": dict(primary), "secondary": dict(secondary)}

    try:
        if primary["state"] == "running":
            ec2.stop_instances(InstanceIds=[primary["id"]])
            ec2.get_waiter("instance_stopped").wait(InstanceIds=[primary["id"]])
        if secondary["state"] != "running":
            ec2.start_instances(InstanceIds=[secondary["id"]])
            ec2.get_waiter("instance_running").wait(InstanceIds=[secondary["id"]])
    except (BotoCoreError, ClientError) as exc:
        return RemediationResult(
            success=False,
            message=str(exc),
            warnings=[],
            data={"before": before, "partial": True},
        )

    p2, s2, err2 = _refresh_pair(ec2)
    if err2:
        return RemediationResult(
            success=False,
            message=f"Toggle ran but could not refresh state: {err2}",
            warnings=[],
            data={"before": before, "partial": True},
        )

    assert p2 is not None and s2 is not None
    after = {"primary": dict(p2), "secondary": dict(s2)}
    state = RemediationState.create("ec2_toggle", before=before, after=after)

    return RemediationResult(
        success=True,
        message="EC2 toggle executed",
        warnings=[],
        data={
            "remediation_id": state.remediation_id,
            "state": state.to_dict(),
        },
    )


def undo_toggle(state: RemediationState) -> RemediationResult:
    """Restore lab: primary running, secondary stopped (uses ids from ``before``)."""
    clients = create_session(PROFILE, REGION)
    ec2 = clients["ec2"]

    before = state.before
    try:
        pid = before["primary"]["id"]
        sid = before["secondary"]["id"]
    except (KeyError, TypeError):
        return RemediationResult(success=False, message="Invalid stored state: missing primary/secondary ids.", warnings=[])

    try:
        ec2.start_instances(InstanceIds=[pid])
        ec2.get_waiter("instance_running").wait(InstanceIds=[pid])
        ec2.stop_instances(InstanceIds=[sid])
        ec2.get_waiter("instance_stopped").wait(InstanceIds=[sid])
    except (BotoCoreError, ClientError) as exc:
        return RemediationResult(success=False, message=str(exc), warnings=[])

    return RemediationResult(success=True, message="Undo completed (primary running, secondary stopped).", warnings=[])


def verify_toggle() -> RemediationResult:
    """After execute: expect primary stopped, secondary running."""
    clients = create_session(PROFILE, REGION)
    ec2 = clients["ec2"]

    primary, secondary, err = _discover_primary_secondary(ec2)
    if err:
        return RemediationResult(success=False, message=err, warnings=[])

    assert primary is not None and secondary is not None
    if primary["state"] != "stopped":
        return RemediationResult(
            success=False,
            message=f"Verify failed: primary state is {primary['state']!r}, expected stopped.",
            warnings=[],
        )
    if secondary["state"] != "running":
        return RemediationResult(
            success=False,
            message=f"Verify failed: secondary state is {secondary['state']!r}, expected running.",
            warnings=[],
        )

    return RemediationResult(success=True, message="Verification successful.", warnings=[])


ec2_toggle_remediation = Remediation(
    name="ec2_toggle",
    description="Stop primary, start secondary (tag cloudpilot-role).",
    service="ec2",
    execute=execute_toggle,
    undo=undo_toggle,
    verify=verify_toggle,
)
