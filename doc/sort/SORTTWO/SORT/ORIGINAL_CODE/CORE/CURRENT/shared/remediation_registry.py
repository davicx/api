"""
Resolve remediation id string → registered :class:`core.models.remediation.Remediation`.
"""

from __future__ import annotations

from typing import Dict, Optional

from core.models.remediation import Remediation
from core.remediations.ec2.toggle import ec2_toggle_remediation

REMEDIATIONS: Dict[str, Remediation] = {
    "ec2_toggle": ec2_toggle_remediation,
}


def get_remediation(name: str) -> Optional[Remediation]:
    return REMEDIATIONS.get(name)
