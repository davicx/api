"""
Low average CPU → rightsizing finding.

Scanner collects data; this file only evaluates one instance dict.
"""

from __future__ import annotations

from core.config.constants import CPU_THRESHOLD, RIGHTSIZE_MAP
from core.models.finding import Finding

_SAVINGS_UNKNOWN_NOTE = (
    "Could not calculate savings; we're working on this feature!"
)


def low_cpu_rule(instance: dict) -> Finding | None:
    avg_cpu = instance.get("avg_cpu")
    if avg_cpu is None:
        return None

    if avg_cpu >= CPU_THRESHOLD:
        return None

    current_type = instance.get("instance_type")
    pair = RIGHTSIZE_MAP.get(current_type)
    if pair is None:
        recommended_type, estimated_savings = None, None
    else:
        recommended_type, estimated_savings = pair

    if recommended_type:
        recommendation = f"Consider downsizing to {recommended_type}"
    else:
        recommendation = "Consider reviewing this instance for rightsizing"

    if recommended_type is not None and estimated_savings is not None:
        cost: dict = {
            "estimated_monthly_savings": estimated_savings,
            "currency": "USD",
        }
    else:
        cost = {
            "estimated_monthly_savings": None,
            "currency": "USD",
            "savings_note": _SAVINGS_UNKNOWN_NOTE,
        }

    return Finding(
        id=f"ec2-lowcpu-{instance['instance_id']}",
        provider="aws",
        service="ec2",
        region=instance.get("region", "us-west-2"),
        status="active",
        priority=2,

        resource={
            "id": instance["instance_id"],
            "name": instance.get("name"),
            "region": instance.get("region"),
            "instance_type": current_type,
            "tags": instance.get("tags") or {},
        },

        issue={
            "code": "LOW_CPU_UTILIZATION",
            "title": "Low CPU utilization",
            "description": "Average CPU is below the configured threshold; instance may be oversized.",
            "severity": "low",
            "confidence": 0.9,
            "category": "cost",
        },

        metrics={
            "avg_cpu": avg_cpu
        },

        recommendation={
            "action": "RIGHTSIZE",
            "description": recommendation,
            "risk": "low"
        },

        remediation={
            "available": True,
            "actions": []
        },

        cost=cost,

        summary=f"{instance.get('name') or instance['instance_id']} is underutilized (low CPU).",

        metadata={
            "rule_id": "ec2_low_cpu",
        },
    )