from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class RemediationResult:
    success: bool
    message: str
    warnings: List[str] = field(default_factory=list)
    data: Optional[Dict[str, Any]] = None
