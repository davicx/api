"""
Long-running instance → review finding.

Scanner supplies ``launch_time`` (from DescribeInstances); this file only evaluates one instance dict.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from core.models.finding import Finding

OLD_INSTANCE_DAYS = 90


def _as_utc_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def old_instance_rule(instance: dict) -> Finding | None:
    launch_time = instance.get("launch_time")
    if launch_time is None:
        return None
    if not isinstance(launch_time, datetime):
        return None

    started = _as_utc_aware(launch_time)
    now = datetime.now(timezone.utc)
    if now - started <= timedelta(days=OLD_INSTANCE_DAYS):
        return None

    age_days = (now - started).days
    instance_id = instance["instance_id"]
    region = instance.get("region") or "us-west-2"

    return Finding(
        id=f"ec2-oldinstance-{instance_id}",
        provider="aws",
        service="ec2",
        region=region,
        status="active",
        priority=3,

        resource={
            "id": instance_id,
            "name": instance.get("name"),
            "region": region,
            "instance_type": instance.get("instance_type"),
            "tags": instance.get("tags") or {},
        },

        issue={
            "code": "LONG_RUNNING_INSTANCE",
            "title": "Instance running long time",
            "description": (
                f"Launch time is more than {OLD_INSTANCE_DAYS} days ago; "
                "confirm whether this workload is still needed."
            ),
            "severity": "low",
            "confidence": 1.0,
            "category": "operations",
        },

        metrics={
            "launch_time": started.isoformat(),
            "age_days": age_days,
            "old_instance_threshold_days": OLD_INSTANCE_DAYS,
        },

        recommendation={
            "action": "REVIEW",
            "description": "Review whether this instance is still required",
            "risk": "low",
        },

        remediation={
            "available": False,
            "actions": [],
        },

        cost={
            "estimated_monthly_savings": 0.0,
            "currency": "USD",
        },

        summary=(
            f"{instance.get('name') or instance_id} has been running "
            f"for {age_days} days (older than {OLD_INSTANCE_DAYS} days)."
        ),

        metadata={
            "rule_id": "ec2_old_instance",
        },
    )
