"""
EC2 low CPU rule — thresholds come from rules/json/ec2/rule_ec2_low_cpu.json (conditions.avg_cpu_less_than).
"""

from core.ORIGINAL.models.finding import Finding
from core.ORIGINAL.models.remediation import Remediation
from core.ORIGINAL.remediations.resize_instance import resize_instance_remediation

SAVINGS_MAP = {
    "t3.large": ("t3.medium", 15),
    "t3.medium": ("t3.small", 10),
}

DEFAULT_AVG_CPU_LESS_THAN = 10


def run(instance, avg_cpu=None, rule_config=None):
    """When avg_cpu is None (no CloudWatch data), returns None."""
    if avg_cpu is None:
        return None
    return ec2_low_cpu(instance, avg_cpu, rule_config)


def ec2_low_cpu(instance, avg_cpu, rule_config):
    # STEP 8 (detail): Threshold from JSON ``conditions.avg_cpu_less_than`` (see rule_config_loader).
    cond = (rule_config or {}).get("conditions") or {}
    threshold = cond.get("avg_cpu_less_than", DEFAULT_AVG_CPU_LESS_THAN)
    # Finding when average CPU is below threshold (underutilized)
    if avg_cpu >= threshold:
        return None

    instance_id = instance["InstanceId"]
    instance_type = instance["InstanceType"]

    name = next(
        (t["Value"] for t in instance.get("Tags", []) if t["Key"] == "Name"),
        "Unnamed",
    )

    suggestion, savings = SAVINGS_MAP.get(
        instance_type,
        ("Review manually", 0),
    )

    remediation = Remediation(
        name="Resize EC2 Instance",
        description=f"Resize {instance_type} → {suggestion}",
        execute=lambda: resize_instance_remediation(instance),
    )

    return Finding(
        service="EC2",
        resource_id=instance_id,
        name=name,
        instance_type=instance_type,
        avg_cpu=round(avg_cpu, 2),
        issue="Low CPU utilization",
        recommendation=f"Consider downsizing to {suggestion}",
        estimated_savings=savings,
        remediation=remediation,
        recommended_instance_type=suggestion if suggestion != "Review manually" else None,
    )
