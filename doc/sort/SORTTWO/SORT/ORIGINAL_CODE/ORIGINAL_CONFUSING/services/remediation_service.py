"""
api/services/remediation_service.py

Same idea as ``application/logic/posts.js``: routes delegate here; this file holds the real flow.

**Scan vs remediation**
  - EC2 scan (``scan_service``) = read AWS + rules → findings.
  - This file = run a remediation **by name** from ``core/shared/remediation_registry.py``.
    The JSON body is ``{ "remediation": "ec2_toggle" }`` — not an instance id. Each name points to
    one implementation. Example: ``ec2_toggle`` runs code in ``core/remediations/ec2/toggle.py`` that
    calls EC2 (describe instances, stop, start) using tags ``cloudpilot-role``.

FUNCTIONS A: Mock resize (SIMULATED) — ``/remediations/mock/ec2/*``, no real AWS
    A1) run_auto_resize
    A2) run_undo_resize

FUNCTIONS B: Remediation engine (registry + in-memory state for undo)
    B1) run_remediation
    B2) undo_remediation
    B3) verify_remediation
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from core.models.remediation_result import RemediationResult
from core.models.remediation_state import RemediationState
from core.shared.remediation_registry import REMEDIATIONS, get_remediation

# In-memory state (replace with DB / durable store for production).
STATE_STORE: Dict[str, Dict[str, Any]] = {}


# FIX
# ---------------------------------------------------------------------------
# FUNCTIONS B: Engine
# ---------------------------------------------------------------------------


def _envelope_from_result(result: RemediationResult) -> Dict[str, Any]:
    data = dict(result.data or {})
    if result.warnings:
        data["warnings"] = result.warnings
    return {
        "success": result.success,
        "message": result.message,
        "data": data,
    }


#Function B1: POST /remediations/ec2/run — find remediation by name, run it (e.g. ec2_toggle → toggle.py), remember state for undo, return the dict the route passes to json_response (success, message, data).
def run_remediation(name: str) -> Dict[str, Any]:
    remediation = get_remediation(name)
    if remediation is None:
        return {
            "success": False,
            "message": f'Unknown remediation "{name}".',
            "data": {"valid": sorted(REMEDIATIONS.keys())},
        }

    # For ec2_toggle this runs EC2 stop/start in core/remediations/ec2/toggle.py.
    outcome = remediation.execute()

    if outcome.success and outcome.data and "remediation_id" in outcome.data:
        saved_state = outcome.data.get("state")
        if isinstance(saved_state, dict):
            STATE_STORE[outcome.data["remediation_id"]] = saved_state

    # Same shape json_response expects: success, message, data (no separate "envelope" step).
    details_for_client = dict(outcome.data or {})
    if outcome.warnings:
        details_for_client["warnings"] = outcome.warnings

    return {
        "success": outcome.success,
        "message": outcome.message,
        "data": details_for_client,
    }


def undo_remediation(remediation_id: str) -> Dict[str, Any]:
    """FUNCTION B2: POST /remediations/ec2/undo — reverse a previous run using stored state."""
    # STEP 1: Load the saved state from the last successful run.
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

    # STEP 2: Run undo on that same remediation (AWS calls are inside that module, not here).
    result = remediation.undo(state)
    if result.success:
        STATE_STORE.pop(remediation_id, None)

    return _envelope_from_result(result)


def verify_remediation(name: str) -> Dict[str, Any]:
    """FUNCTION B3: POST /remediations/ec2/verify — check outcome for a named remediation."""
    remediation = get_remediation(name)
    if remediation is None:
        return {
            "success": False,
            "message": f'Unknown remediation "{name}".',
            "data": {"valid": sorted(REMEDIATIONS.keys())},
        }

    result = remediation.verify()
    return _envelope_from_result(result)


# ---------------------------------------------------------------------------
# FUNCTIONS A: Mock resize (paths under /remediations/mock/ec2/*)
# ---------------------------------------------------------------------------


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
