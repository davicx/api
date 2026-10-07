from typing import List, Optional

from core.rules.ec2.low_cpu import low_cpu_rule
from core.rules.ec2.old_instance import old_instance_rule


RULES = {
    "ec2": {
        "low_cpu": low_cpu_rule,
        "ec2_low_cpu": low_cpu_rule,
        "old_instance": old_instance_rule,
        "ec2_old_instance": old_instance_rule,
    }
}

# Backwards-compatible name used elsewhere
RULE_REGISTRY = RULES


def _unique_rule_functions(rule_fns):
    """Preserve order; drop duplicates (same callable registered under multiple ids)."""
    seen: set[int] = set()
    out = []
    for fn in rule_fns:
        key = id(fn)
        if key not in seen:
            out.append(fn)
            seen.add(key)
    return out


def get_rules_for_service(service: str, selected_rules: Optional[List[str]] = None):
    service_rules = RULES.get(service, {})

    if not selected_rules:
        return _unique_rule_functions(service_rules.values())

    resolved = []
    unknown: List[str] = []
    seen: set[int] = set()
    for rule_name in selected_rules:
        rule_fn = service_rules.get(rule_name)
        if rule_fn is None:
            unknown.append(rule_name)
            continue
        key = id(rule_fn)
        if key not in seen:
            resolved.append(rule_fn)
            seen.add(key)

    if unknown:
        valid_rule_ids = ", ".join(sorted(service_rules.keys()))
        raise ValueError(
            f'Unknown rule id(s) for service "{service}": {", ".join(unknown)}. '
            f"Valid ids: {valid_rule_ids}."
        )

    return resolved
