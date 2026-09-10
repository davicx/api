from datetime import datetime, timezone
from core.models.finding import Finding

# ---
# NEXT STEP: Add rule metadata
# Rule metadata describes what a rule is and how the system should treat it (UI, filtering, severity, toggles).
# Add module-level constants, e.g. RULE_NAME, SEVERITY, CATEGORY, DESCRIPTION; the loader can read these later.
# ---

MAX_AGE_DAYS = 180


def run(instance, avg_cpu=None, rule_config=None):
    launch_time = instance["LaunchTime"]
    now = datetime.now(timezone.utc)
    age_days = (now - launch_time).days
    if age_days < MAX_AGE_DAYS:
        return None
    name = next(
        (t["Value"] for t in instance.get("Tags", []) if t["Key"] == "Name"),
        "Unnamed",
    )
    return Finding(
        service="EC2",
        resource_id=instance["InstanceId"],
        name=name,
        instance_type=instance["InstanceType"],
        issue=f"Instance running for {age_days} days",
        recommendation="Review whether this instance is still required",
        estimated_savings=0,
        remediation=None,
    )