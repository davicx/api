from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from core.models.remediation_result import RemediationResult
from core.models.remediation_state import RemediationState


@dataclass
class Remediation:
    """Registered remediation: metadata + execute / undo / verify callables."""

    name: str
    description: str
    service: str
    execute: Callable[[], RemediationResult]
    undo: Callable[[RemediationState], RemediationResult]
    verify: Callable[[], RemediationResult]
