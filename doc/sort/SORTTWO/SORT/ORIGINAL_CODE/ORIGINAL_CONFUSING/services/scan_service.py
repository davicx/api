from __future__ import annotations
from typing import Any, Dict, List, Optional

from config.config import REGION
from core.ec2.ec2_logic import run_ec2_scan

from api.functions.scan_helpers import format_ec2_scan_result_for_api, validate_ec2_scope
from api.models_added.scan_models import Ec2ScanRequest

"""
api/services/scan_service.py

Same idea as Node ``application/logic/posts.js`` (or messages.js):
imports at the top, then numbered "FUNCTIONS" blocks, then STEP 1 / STEP 2 inside the big flows.

This file only builds the **data** dict for the route. The route wraps it in ``json_response``.
"""


"""
FUNCTIONS A: Helpers (small utilities used by the scan flow)
    A1) check_api_request        — echo raw JSON for debugging
    A2) normalize_scope          — default missing scope.type
    A3) scan_coverage_note       — honest note about current scan coverage

FUNCTIONS B: EC2 scan (main product flow)
    B1) post_ec2_scan            — validate → core AWS scan → format response data
"""


# ---------------------------------------------------------------------------
# FUNCTIONS A: Helpers
# ---------------------------------------------------------------------------

'''
def check_api_request(body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    FUNCTION A1: Return the parsed JSON body as-is (debug / OpenAPI checks).

    No validation, no AWS.
    """
    print("FUNCTION A1: check_api_request — returning body copy")
    if body is None:
        return {}
    return dict(body)


def normalize_scope(scope: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    FUNCTION A2: Make sure we always have a dict and a default scope type.
    """
    out = dict(scope or {})
    if "type" not in out:
        out["type"] = "full"
    return out


def scan_coverage_note(scope: Dict[str, Any]) -> Optional[str]:
    """FUNCTION A3: Optional UX note about what "full" means today."""
    st = scope.get("type") or "full"
    if st in {"full", "region"}:
        return (
            "Atlas currently scans EC2 in one region per request. "
            "Use separate requests for additional AWS regions."
        )
    return None

'''

# ---------------------------------------------------------------------------
# FUNCTIONS B: EC2 scan
# ---------------------------------------------------------------------------

'''
def post_ec2_scan(request: Ec2ScanRequest, echo: bool = False) -> Dict[str, Any]:
    """
    FUNCTION B1: POST /scan/ec2 — main orchestration (Node-style: read top to bottom).

    Input: Ec2ScanRequest (scope + region + rules). Output: dict that becomes response["data"].
    """
    print("____________________________________________________________")
    print("FUNCTION B1: post_ec2_scan — start")

    # STEP 1: Turn the Pydantic model into a plain scope dict (what core will read)
    print("STEP 1: Build scope dict from request body")
    scope = normalize_scope(request.scope.model_dump(exclude_none=True))
    print(f"        scope={scope!r}")

    # STEP 2: Validate scope shape (wrong/missing fields → ValueError → route returns 422)
    print("STEP 2: Validate scope")
    validate_ec2_scope(scope)

    # STEP 3: Decide which AWS region the session uses (scope type "region" wins over request.region)
    print("STEP 3: Pick region (scope region override, then request region, then config default)")
    st = scope.get("type") or "full"
    if st == "region" and scope.get("value"):
        region_to_use = str(scope["value"]).strip()
    elif request.region is not None and str(request.region).strip() != "":
        region_to_use = request.region
    else:
        region_to_use = REGION
    print(f"        region_to_use={region_to_use!r}")

    rules = request.rules
    print(f"        rules={rules!r}")
    print(f"        echo={echo!r}")

    # STEP 4: Echo mode — no boto, just show what we would have used
    if echo:
        print("STEP 4: Echo mode — skipping AWS, returning scope + region + rules only")
        print("FUNCTION B1: post_ec2_scan — end (echo)")
        print("____________________________________________________________")
        return {
            "echo": True,
            "scope": dict(scope),
            "region": region_to_use,
            "rules": rules,
        }

    # STEP 4 (real scan): Run core (scanner + rules)
    print("STEP 4: Call core — run_ec2_scan (AWS + rules)")
    note = scan_coverage_note(scope)
    core_result = run_ec2_scan(
        region=region_to_use,
        scope=scope,
        selected_rules=rules,
    )
    print(f"STEP 5: Core returned {core_result.get('finding_count', 0)} finding(s)")

    # STEP 6: Shape the payload for the API (camelCase keys, optional note)
    print("STEP 6: Format result for API response data")
    out = format_ec2_scan_result_for_api(
        core_result=core_result,
        scope=scope,
        region=region_to_use,
        rules=rules,
        scope_filter_note=note,
    )

    print("FUNCTION B1: post_ec2_scan — end")
    print("____________________________________________________________")
    return out
'''