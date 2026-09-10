from dataclasses import dataclass


@dataclass
class Finding:
    service: str
    resource_id: str
    name: str
    issue: str
    recommendation: str
    estimated_savings: float
