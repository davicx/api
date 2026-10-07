"""
api/services/remediation_service.py

Remediation is **disabled** at the app level (see ``main.py``). Stubs below keep imports safe if routes are wired again.

To restore: uncomment remediation routers in ``main.py``, replace stubs with the implementation inside the
``if False`` block (move it back to module level and delete the stubs / dead block).
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from core.models.remediation_result import RemediationResult
from core.models.remediation_state import RemediationState
from core.shared.remediation_registry import REMEDIATIONS, get_remediation

STATE_STORE: Dict[str, Dict[str, Any]] = {}


def _remediation_disabled() -> Dict[str, Any]:
    return {
        "success": False,
        "message": "Remediation is temporarily disabled.",
        "data": {},
    }


def _mock_remediation_disabled() -> dict:
    return {
        "success": False,
        "message": "Remediation is temporarily disabled.",
        "data": {},
    }


def run_remediation(name: str) -> Dict[str, Any]:
    return _remediation_disabled()


def undo_remediation(remediation_id: str) -> Dict[str, Any]:
    return _remediation_disabled()


def verify_remediation(name: str) -> Dict[str, Any]:
    return _remediation_disabled()


def run_auto_resize(
    instance_id: str,
    current_type: str,
    target_type: str,
    *,
    tags: Optional[Dict[str, str]] = None,
) -> dict:
    return _mock_remediation_disabled()


def run_undo_resize(
    instance_id: str,
    current_type: str,
    target_type: str,
    *,
    tags: Optional[Dict[str, str]] = None,
) -> dict:
    return _mock_remediation_disabled()


# ---------------------------------------------------------------------------
# Original implementation (not executed — preserved for restore). Indentation
# keeps it valid Python; the block is skipped at runtime.
# ---------------------------------------------------------------------------
if False:

    def _envelope_from_result(result: RemediationResult) -> Dict[str, Any]:
        data = dict(result.data or {})
        if result.warnings:
            data["warnings"] = result.warnings
        return {
            "success": result.success,
            "message": result.message,
            "data": data,
        }

    def run_remediation(name: str) -> Dict[str, Any]:
        remediation = get_remediation(name)
        if remediation is None:
            return {
                "success": False,
                "message": f'Unknown remediation "{name}".',
                "data": {"valid": sorted(REMEDIATIONS.keys())},
            }

        outcome = remediation.execute()

        if outcome.success and outcome.data and "remediation_id" in outcome.data:
            saved_state = outcome.data.get("state")
            if isinstance(saved_state, dict):
                STATE_STORE[outcome.data["remediation_id"]] = saved_state

        details_for_client = dict(outcome.data or {})
        if outcome.warnings:
            details_for_client["warnings"] = outcome.warnings

        return {
            "success": outcome.success,
            "message": outcome.message,
            "data": details_for_client,
        }

    def undo_remediation(remediation_id: str) -> Dict[str, Any]:
        raw = STATE_STORE.get(remediation_id)
        if raw is None:
            return {
                "success": False,
                "message": "No stored state for that remediation_id (unknown or already undone).",
                "data": {},
            }

        try:
            state = RemediationState.from_dict(raw)
        except (KeyError, TypeError, ValueError) as exc:
            return {
                "success": False,
                "message": f"Invalid stored state: {exc}",
                "data": {},
            }

        remediation = get_remediation(state.remediation_name)
        if remediation is None:
            return {
                "success": False,
                "message": f'Unknown remediation "{state.remediation_name}" for stored state.',
                "data": {},
            }

        result = remediation.undo(state)
        if result.success:
            STATE_STORE.pop(remediation_id, None)

        return _envelope_from_result(result)

    def verify_remediation(name: str) -> Dict[str, Any]:
        remediation = get_remediation(name)
        if remediation is None:
            return {
                "success": False,
                "message": f'Unknown remediation "{name}".',
                "data": {"valid": sorted(REMEDIATIONS.keys())},
            }

        result = remediation.verify()
        return _envelope_from_result(result)

    def run_auto_resize(
        instance_id: str,
        current_type: str,
        target_type: str,
        *,
        tags: Optional[Dict[str, str]] = None,
    ) -> dict:
        return {
            "success": True,
            "message": "Mock auto remediation executed",
            "data": {
                "instance_id": instance_id,
                "from": current_type,
                "to": target_type,
                "action": "resize",
                "status": "SIMULATED",
                "tags": tags or {},
            },
        }

    def run_undo_resize(
        instance_id: str,
        current_type: str,
        target_type: str,
        *,
        tags: Optional[Dict[str, str]] = None,
    ) -> dict:
        return {
            "success": True,
            "message": "Mock undo remediation executed",
            "data": {
                "instance_id": instance_id,
                "from": target_type,
                "to": current_type,
                "action": "rollback",
                "status": "SIMULATED",
                "tags": tags or {},
            },
        }
