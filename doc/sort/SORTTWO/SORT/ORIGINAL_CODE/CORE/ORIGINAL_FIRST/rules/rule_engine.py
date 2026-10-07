"""
Single entry point for running EC2 rules.

Scanners fetch AWS data only; they must call ``evaluate_ec2_instance`` or ``run`` here —
never import or call rule modules (e.g. ``ec2_low_cpu``) directly.
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Tuple

from core.ORIGINAL.rules.registry import EC2_RULE_REGISTRY
from core.ORIGINAL.rules.rule_config_loader import load_rule_json

# Cached (rule_fn, config) pairs — refreshed on first use after import
_EC2_RULES: Optional[List[Tuple[Any, dict]]] = None


def iter_ec2_rules():
    """Yield (run_fn, rule_config dict) for each registered EC2 rule."""
    # STEP 7: Registry → JSON file per rule_id (thresholds, required_metrics).
    for rule_id, run_fn in EC2_RULE_REGISTRY:
        config = dict(load_rule_json(rule_id, "ec2"))
        config.setdefault("rule_id", rule_id)
        yield run_fn, config


def _ec2_rules_cached() -> List[Tuple[Any, dict]]:
    global _EC2_RULES
    if _EC2_RULES is None:
        _EC2_RULES = list(iter_ec2_rules())
    return _EC2_RULES


def _rule_needs_avg_cpu(rule_config: dict) -> bool:
    return "avg_cpu" in (rule_config.get("required_metrics") or [])


def _invoke_rule(rule_fn, rule_config: dict, instance: dict, avg_cpu: Optional[float]):
    # STEP 8: Rule module ``run()`` — learning mode: ``ec2_low_cpu.run`` → ``ec2_low_cpu()`` logic.
    return rule_fn(instance, avg_cpu=avg_cpu, rule_config=rule_config)


def evaluate_ec2_instance(
    instance: Dict[str, Any],
    avg_cpu: Optional[float],
    rule_ids: Optional[List[str]] = None,
) -> List[Any]:
    """
    Run every registered EC2 rule against one instance and its optional avg CPU metric.
    Returns a list of Finding objects (may be empty).

    If ``rule_ids`` is ``None``, all registered EC2 rules run.
    If it is a list (including empty), only those ``rule_id`` values run (case-insensitive); an empty list runs no rules.
    """
    # STEP 6: One instance at a time; skip rules that need avg_cpu when CloudWatch returned None.
    allowed: Optional[set] = None
    if rule_ids is not None:
        allowed = {r.strip().lower() for r in rule_ids if r and str(r).strip()}

    findings: List[Any] = []
    for rule_fn, rule_config in _ec2_rules_cached():
        rid = (rule_config.get("rule_id") or "").lower()
        if allowed is not None and rid not in allowed:
            continue
        if _rule_needs_avg_cpu(rule_config):
            if avg_cpu is None:
                continue
            finding = _invoke_rule(rule_fn, rule_config, instance, avg_cpu)
        else:
            finding = _invoke_rule(rule_fn, rule_config, instance, None)
        if finding:
            findings.append(finding)
    return findings


def run(
    service: str,
    instances: Iterable[Tuple[Dict[str, Any], Optional[float]]],
    rule_ids: Optional[List[str]] = None,
) -> List[Any]:
    """
    Run all rules for a service.

    ``service`` must be ``\"ec2\"`` for now.

    ``instances`` is an iterable of ``(instance_dict, avg_cpu_or_None)`` — the scanner
    builds these after calling EC2 / CloudWatch.

    ``rule_ids``: optional filter — only these rule ids run (see ``evaluate_ec2_instance``).

    Returns a flat list of Finding objects.
    """
    if service != "ec2":
        raise ValueError(f"Unsupported service for rule_engine.run: {service!r}")

    # STEP 5: Flatten (instance, avg_cpu) pairs from the scanner into a list of Findings.
    out: List[Any] = []
    for instance, avg_cpu in instances:
        out.extend(evaluate_ec2_instance(instance, avg_cpu, rule_ids=rule_ids))
    return out
