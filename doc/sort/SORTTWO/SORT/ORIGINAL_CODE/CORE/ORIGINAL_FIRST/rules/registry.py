"""
Maps rule_id → Python run() implementation.
Add new EC2 rules here and (optionally) rules/json/ec2/rule_<rule_id>.json.

Learning mode: only ``ec2_low_cpu`` is active. Uncomment other rules when you add them back.
"""

from core.ORIGINAL.rules.code.ec2 import ec2_low_cpu

# from core.ORIGINAL.rules.code.ec2 import large_instance
# from core.ORIGINAL.rules.code.ec2 import missing_name_tag
# from core.ORIGINAL.rules.code.ec2 import old_instance

# (rule_id, run_callable) — order is scan order
EC2_RULE_REGISTRY = [
    ("ec2_low_cpu", ec2_low_cpu.run),
    # ("large_instance", large_instance.run),
    # ("missing_name_tag", missing_name_tag.run),
    # ("old_instance", old_instance.run),
]
