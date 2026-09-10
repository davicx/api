from dataclasses import dataclass, asdict
from typing import Any, Dict


@dataclass
class Finding:
    id: str
    provider: str
    service: str
    region: str
    status: str
    priority: int

    resource: Dict[str, Any]
    issue: Dict[str, Any]
    metrics: Dict[str, Any]
    recommendation: Dict[str, Any]
    remediation: Dict[str, Any]
    cost: Dict[str, Any]

    summary: str
    metadata: Dict[str, Any]

    def to_dict(self) -> dict:
        return asdict(self)