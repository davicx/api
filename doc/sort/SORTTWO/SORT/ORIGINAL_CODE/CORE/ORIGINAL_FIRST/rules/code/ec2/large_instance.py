from core.models.finding import Finding

# ---
# NEXT STEP: Add rule metadata
# Rule metadata describes what a rule is and how the system should treat it (UI, filtering, severity, toggles).
# Add module-level constants, e.g. RULE_NAME, SEVERITY, CATEGORY, DESCRIPTION; the loader can read these later.
# ---

LARGE_INSTANCE_TYPES = [
    "m5.4xlarge",
    "m5.8xlarge",
    "m5.12xlarge",
    "c5.4xlarge",
    "c5.9xlarge",
]


def run(instance, avg_cpu=None, rule_config=None):
    instance_type = instance["InstanceType"]
    if instance_type not in LARGE_INSTANCE_TYPES:
        return None
    name = next(
        (t["Value"] for t in instance.get("Tags", []) if t["Key"] == "Name"),
        "Unnamed",
    )
    return Finding(
        service="EC2",
        resource_id=instance["InstanceId"],
        name=name,
        instance_type=instance_type,
        issue="Large EC2 instance detected",
        recommendation="Review instance size to ensure it is required",
        estimated_savings=0,
        remediation=None,
    )