from typing import Any, Dict

from fastapi import APIRouter, Body, HTTPException, Query

from api.functions.response_helpers import json_response
from api.models_added.scan_models import Ec2ScanRequest
from api.services.scan_service import check_api_request, post_ec2_scan
from core.ec2.ec2_scanner import ScanExecutionError

router = APIRouter()


@router.post("/check_api_request")
def check_api_request_route(body: Dict[str, Any] = Body(default_factory=dict)):
    """Echo the JSON body under ``data`` (no validation, no AWS)."""
    data = check_api_request(body)
    return json_response(data=data, message="Echo of request body")


@router.post("/scan/ec2")
def scan_ec2(
    body: Ec2ScanRequest,
    echo: bool = Query(
        False,
        description="If true, skip AWS and return an echo payload only.",
    ),
):
    try:
        ec2_scan_result = post_ec2_scan(request=body, echo=echo)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except ScanExecutionError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    msg = "Echo only — no AWS call" if echo else "EC2 scan completed"
    return json_response(data=ec2_scan_result, message=msg)

