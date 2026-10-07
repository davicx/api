from dataclasses import dataclass


from dataclasses import dataclass
from typing import Optional

@dataclass
class Finding:
    service: str
    resource_id: str
    name: str
    instance_type: str
    issue: str
    recommendation: str
    estimated_savings: float
    remediation: Optional[object] = None
    avg_cpu: Optional[float] = None  # optional until CloudWatch/CloudFormation setup
    recommended_instance_type: Optional[str] = None  # e.g. suggested downsize type for cost calc
    
'''
@dataclass
class Finding:
    service: str
    resource_id: str
    name: str
    instance_type: str
    avg_cpu: float
    issue: str
    recommendation: str
    estimated_savings: float
'''
