"""
api/routes/remediation_routes.py

Same idea as ``application/routes/postRoutes.js``: list routes up here, keep handlers thin — one call into ``api/services/remediation_service``.

**This is not the EC2 scan.** Scan = read-only (``/scan/ec2``). **Remediation = can change AWS** (stop/start, etc.) depending on the registered name.

Full paths (no trailing slash):
  - ``POST /remediations/ec2/run``   — run a named remediation (see ``RunRemediationBody``)
  - ``POST /remediations/ec2/undo`` — undo using ``remediation_id`` from a prior run
  - ``POST /remediations/ec2/verify`` — verify a named remediation

FUNCTIONS A: Registry engine (real remediations — ``run_remediation`` may call AWS)
    A1) POST /run   — ``ec2_run_remediation`` → ``run_remediation``
    A2) POST /undo  — ``ec2_undo_engine`` → ``undo_remediation``
    A3) POST /verify — ``ec2_verify_remediation`` → ``verify_remediation``

FUNCTIONS B: Mock router (``/remediations/mock/ec2/*``) — simulated resize, no real AWS
    B1) POST /auto — ``ec2_mock_auto_remediation``
    B2) POST /undo — ``ec2_mock_undo_remediation``

FUNCTIONS C: Instruction-only (no AWS from this file)
    C1) POST /manual — console steps
    C2) POST /cli — example CLI strings
    C3) POST /pr — example Terraform diff text
"""

from fastapi import APIRouter

from api.functions.response_helpers import json_response
from api.models_added.remediation_models import (
    CliRemediationBody,
    RemediationBody,
    RunRemediationBody,
    UndoRemediationBody,
    VerifyRemediationBody,
)
from api.ORIGINAL_CONFUSING.remediation_service import (
    run_auto_resize,
    run_remediation,
    run_undo_resize,
    undo_remediation,
    verify_remediation,
)

router = APIRouter(prefix="/remediations/ec2", tags=["EC2 Remediations"])
mock_router = APIRouter(prefix="/remediations/mock/ec2", tags=["EC2 Remediations (mock)"])


# ---------------------------------------------------------------------------
# FUNCTIONS A: Registry engine (``run_remediation`` — see service for STEPs / AWS)
# ---------------------------------------------------------------------------


# Route A1: POST /remediations/ec2/run — body: { "remediation": "<registry key>" } e.g. "ec2_toggle"
@router.post("/run")
def ec2_run_remediation(body: RunRemediationBody):
    out = run_remediation(body.remediation)
    return json_response(
        data=out["data"],
        success=out["success"],
        message=out["message"],
    )


# Route A2: POST /remediations/ec2/undo
@router.post("/undo")
def ec2_undo_engine(body: UndoRemediationBody):
    out = undo_remediation(body.remediation_id)
    return json_response(
        data=out["data"],
        success=out["success"],
        message=out["message"],
    )


# Route A3: POST /remediations/ec2/verify
@router.post("/verify")
def ec2_verify_remediation(body: VerifyRemediationBody):
    out = verify_remediation(body.remediation)
    return json_response(
        data=out["data"],
        success=out["success"],
        message=out["message"],
    )


# ---------------------------------------------------------------------------
# FUNCTIONS B: Mock auto / undo (resize simulation — NOT real AWS)
# ---------------------------------------------------------------------------


# Route B1: POST /remediations/mock/ec2/auto
@mock_router.post("/auto")
def ec2_mock_auto_remediation(body: RemediationBody):
    result = run_auto_resize(
        body.instance_id,
        body.current_type,
        body.target_type,
        tags=body.tags,
    )

    return json_response(
        data=result["data"],
        success=result["success"],
        message=result["message"],
    )


# Route B2: POST /remediations/mock/ec2/undo
@mock_router.post("/undo")
def ec2_mock_undo_remediation(body: RemediationBody):
    result = run_undo_resize(
        body.instance_id,
        body.current_type,
        body.target_type,
        tags=body.tags,
    )
    return json_response(
        data=result["data"],
        success=result["success"],
        message=result["message"],
    )


# ---------------------------------------------------------------------------
# FUNCTIONS C: Instruction-only (strings for humans — no boto3 here)
# ---------------------------------------------------------------------------


# Route C1: POST /remediations/ec2/manual
@router.post("/manual")
def ec2_manual_remediation(body: RemediationBody):
    data = {
        "type": "manual",
        "description": "Step-by-step instructions to resize an EC2 instance",
        "steps": [
            f"Go to AWS Console → EC2 → Instances",
            f"Select instance {body.instance_id}",
            "Click 'Actions' → 'Instance Settings' → 'Change Instance Type'",
            f"Select {body.target_type}",
            "Apply and restart instance if needed",
        ],
        "current_instance_type": body.current_type,
        "target_instance_type": body.target_type,
    }
    return json_response(data=data, message="OK")


# Route C2: POST /remediations/ec2/cli
@router.post("/cli")
def ec2_cli_remediation(body: CliRemediationBody):
    data = {
        "type": "cli",
        "description": "AWS CLI command to resize EC2 instance",
        "commands": [
            f"aws ec2 stop-instances --instance-ids {body.instance_id}",
            f"aws ec2 modify-instance-attribute --instance-id {body.instance_id} --instance-type '{{\"Value\":\"{body.target_type}\"}}'",
            f"aws ec2 start-instances --instance-ids {body.instance_id}",
        ],
    }
    return json_response(data=data, message="OK")


# Route C3: POST /remediations/ec2/pr
@router.post("/pr")
def ec2_pr_remediation(body: RemediationBody):
    data = {
        "type": "pr",
        "description": "Proposed infrastructure change via pull request",
        "summary": f"Update EC2 instance {body.instance_id} from {body.current_type} to {body.target_type}",
        "example_terraform_change": {
            "before": f'instance_type = "{body.current_type}"',
            "after": f'instance_type = "{body.target_type}"',
        },
        "next_step": "Create pull request in user's infrastructure repository",
    }
    return json_response(data=data, message="OK")
