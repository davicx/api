"""
core/ec2/ec2_logic.py

Glue between ``api/services/scan_service`` and AWS: **no HTTP**, just orchestration.
``post_ec2_scan`` (API) calls ``run_ec2_scan`` here — read **STEP 1** … **STEP 4** top to bottom.
"""

from __future__ import annotations

# --- imports (same idea as api/services: deps at top) ---

from typing import Any, Dict, List, Optional

from core.ec2.ec2_scanner import scan_ec2_instances
from core.shared.registry import get_rules_for_service
from core.shared.rule_engine import run_rules


"""
FUNCTIONS C: Core EC2 scan (called from ``api.services.scan_service.post_ec2_scan``)
    C1) run_ec2_scan — instances from scanner → rule callables → Finding list → result dict
"""


# ---------------------------------------------------------------------------
# FUNCTIONS C: Core EC2 scan
# ---------------------------------------------------------------------------


def run_ec2_scan(
    region: Optional[str] = None,
    scope: Optional[Dict[str, Any]] = None,
    selected_rules: Optional[List[str]] = None,
):
    """
    FUNCTION C1: One EC2 run — ``scope`` = *what*, ``region`` = *where*, ``selected_rules`` = *which checks*.

    Output shape matches what ``format_ec2_scan_result_for_api`` expects (counts + finding dicts).
    """
    # STEP 1: Default scope so the scanner always sees a dict (same idea as API ``normalize_scope``)
    scope = scope or {"type": "full"}

    # STEP 2: AWS + filters — plain instance dicts (``avg_cpu``, ``launch_time``, …)
    instances = scan_ec2_instances(region=region, scope=scope)

    # STEP 3: Registry — which rule functions to run (all EC2 rules if ``selected_rules`` is None)
    rules = get_rules_for_service("ec2", selected_rules)

    # STEP 4: Rule engine — one pass per instance × rule; collect non-None findings
    findings = run_rules(instances, rules)

    return {
        "resources_scanned": len(instances),
        "finding_count": len(findings),
        "findings": [finding.to_dict() for finding in findings],
    }
