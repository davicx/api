from core.models.finding import Finding

# ---
# NEXT STEP: Add rule metadata
# Rule metadata describes what a rule is and how the system should treat it (UI, filtering, severity, toggles).
# Add module-level constants, e.g. RULE_NAME, SEVERITY, CATEGORY, DESCRIPTION; the loader can read these later.
# ---

def run(instance, avg_cpu=None, rule_config=None):
    tags = instance.get("Tags", [])
    name_tag = next(
        (t["Value"] for t in tags if t["Key"] == "Name"),
        None,
    )
    if name_tag:
        return None
    return Finding(
        service="EC2",
        resource_id=instance["InstanceId"],
        name="Unnamed",
        instance_type=instance["InstanceType"],
        issue="Instance missing Name tag",
        recommendation="Add a Name tag to improve resource identification",
        estimated_savings=0,
        remediation=None,
    )