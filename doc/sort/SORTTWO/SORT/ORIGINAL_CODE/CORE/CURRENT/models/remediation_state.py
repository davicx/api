from __future__ import annotations

import uuid
from dataclasses import asdict, dataclass
from typing import Any, Dict


@dataclass
class RemediationState:
    """Persistable snapshot for undo (Option B — before/after)."""

    remediation_id: str
    remediation_name: str
    before: Dict[str, Any]
    after: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> RemediationState:
        return cls(
            remediation_id=d["remediation_id"],
            remediation_name=d["remediation_name"],
            before=d["before"],
            after=d["after"],
        )

    @staticmethod
    def create(
        remediation_name: str,
        before: Dict[str, Any],
        after: Dict[str, Any],
    ) -> RemediationState:
        return RemediationState(
            remediation_id=str(uuid.uuid4()),
            remediation_name=remediation_name,
            before=before,
            after=after,
        )
