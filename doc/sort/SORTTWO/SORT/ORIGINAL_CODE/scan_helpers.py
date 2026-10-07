"""
EC2 scan helpers (used by ``scan_service``).

1. **Validate** — Required fields per ``scope.type`` (shape only; no AWS calls).
2. **Format** — Turn core scan results into the API ``data`` shape.

``response_helpers.json_response`` wraps ``data`` in the standard HTTP envelope.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional


def validate_ec2_scope(scope: dict) -> None:
    """
    Ensure ``scope`` has the right fields for its ``type``.

    Raises ``ValueError`` for the route to map to HTTP 422.
    """
    scope_type = scope.get("type") or "full"

    if scope_type not in ("full", "instance", "tag", "region"):
        raise ValueError(
            f'Invalid scope type "{scope_type}". Use one of: full, instance, tag, region.'
        )

    value = scope.get("value")

    if scope_type == "instance":
        if not value:
            raise ValueError(
                'For scope type "instance", send scope.value or scope.match with the instance id.'
            )

    if scope_type == "tag":
        if not scope.get("key"):
            raise ValueError('For scope type "tag", send scope.key (e.g. "team").')
        if value is None or value == "":
            raise ValueError('For scope type "tag", send scope.value or scope.match (e.g. "payments").')

    if scope_type == "region":
        if not value:
            raise ValueError(
                'For scope type "region", send scope.value or scope.match with the region name, '
                'or use type "full" with a top-level "region" field.'
            )


def format_ec2_scan_result_for_api(
    core_result: Dict[str, Any],
    scope: Dict[str, Any],
    region: str,
    rules: Optional[List[str]],
    scope_filter_note: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Build the ``data`` object for the client from ``core.ec2.ec2_logic.run_ec2_scan`` output.
    """
    out: Dict[str, Any] = {
        "resourcesScanned": core_result["resources_scanned"],
        "findingCount": core_result["finding_count"],
        "findings": core_result["findings"],
        "scope": dict(scope),
        "region": region,
        "rules": rules,
    }
    if scope_filter_note:
        out["scopeFilterNote"] = scope_filter_note
    return out


