"""
API request bodies for EC2 remediation routes (Pydantic).

Same idea as ``scan_models.py``: route handlers import models from here; routes stay HTTP-only.
"""

from typing import Dict, Optional

from pydantic import BaseModel


class RemediationBody(BaseModel):
    """Manual / PR / mock auto|undo — instance + types + optional tag echo."""

    instance_id: str
    current_type: str
    target_type: str
    tags: Optional[Dict[str, str]] = None


class CliRemediationBody(BaseModel):
    """CLI remediation — instance id + target type."""

    instance_id: str
    target_type: str


class RunRemediationBody(BaseModel):
    """POST /remediations/ec2/run — registry key (e.g. ``ec2_toggle``)."""

    remediation: str


class UndoRemediationBody(BaseModel):
    """POST /remediations/ec2/undo — id returned from a successful run."""

    remediation_id: str


class VerifyRemediationBody(BaseModel):
    """POST /remediations/ec2/verify — same registry key as run."""

    remediation: str
