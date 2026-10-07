"""
EC2 scan orchestration: scope → AWS data (scanner) → rules → cost roll-up.

Scope interpretation lives here only (not in routes, scan_logic, or scanners).
"""

from __future__ import annotations

from config.config import PROFILE, REGION
from config.aws.sessions import create_session
from core.ORIGINAL.rules.rule_engine import run as run_rules
from core.ORIGINAL.scanners.ec2_scanner import (
    collect_ec2_scan_context,
    expected_cost_for_instances,
)


def _validate_ec2_scope(scope: dict) -> dict:
    stype = scope.get("type") or "full"
    if stype not in ("full", "instance", "tag", "region"):
        raise ValueError(
            f"Unsupported EC2 scope type {stype!r}; use full, instance, tag, or region"
        )
    if stype == "instance" and not scope.get("value"):
        raise ValueError('scope.type "instance" requires scope.value (instance id)')
    if stype == "tag":
        if not scope.get("key"):
            raise ValueError('scope.type "tag" requires scope.key')
        if scope.get("value") is None:
            raise ValueError('scope.type "tag" requires scope.value')
    if stype == "region" and not scope.get("value"):
        raise ValueError(
            'scope.type "region" requires scope.value (region name), or pass top-level region'
        )
    out = {"type": stype}
    if "value" in scope:
        out["value"] = scope["value"]
    if "key" in scope:
        out["key"] = scope["key"]
    return out


def _effective_region(scope: dict, region_override: str | None) -> str:
    if region_override:
        return region_override
    if scope.get("type") == "region" and scope.get("value"):
        return scope["value"]
    return REGION


def run_ec2_scan_with_clients(
    ec2_client,
    cloudwatch_client,
    scope: dict | None = None,
    rule_ids: list[str] | None = None,
):
    """
    Run EC2 scan with existing boto clients. ``scope`` defaults to full account (running) in client region.
    """
    scope = _validate_ec2_scope(scope or {"type": "full"})
    ctx = collect_ec2_scan_context(ec2_client, cloudwatch_client, scope=scope)
    findings = run_rules("ec2", ctx["pairs"], rule_ids=rule_ids)
    expected = expected_cost_for_instances(ctx["instances"], findings)
    return {
        "findings": findings,
        "current_cost": round(ctx["current_cost"], 2),
        "expected_cost": expected,
    }


def run_ec2_scan(
    scope: dict | None = None,
    region: str | None = None,
    rule_ids: list[str] | None = None,
):
    """
    Create AWS session and run EC2 scan for the given scope.

    ``region``: optional override for boto session region (also implied when scope.type == "region").
    ``rule_ids``: optional filter — only these rule ids run (see ``rule_engine.run``).
    """
    scope = scope or {"type": "full"}
    scope = _validate_ec2_scope(scope)
    eff = _effective_region(scope, region)
    clients = create_session(PROFILE, eff)
    return run_ec2_scan_with_clients(
        clients["ec2"], clients["cloudwatch"], scope=scope, rule_ids=rule_ids
    )
