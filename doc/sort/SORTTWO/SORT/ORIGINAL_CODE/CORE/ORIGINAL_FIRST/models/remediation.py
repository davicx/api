from dataclasses import dataclass
from typing import Callable, Optional


@dataclass
class Remediation:
    name: str
    description: str
    execute: Callable
    undo: Optional[Callable] = None
    verify: Optional[Callable] = None



'''
ec2_toggle_remediation = Remediation(
    name="EC2 Toggle",
    description="Switch between primary and secondary instances",
    execute=remediate,
    undo=undo_remediation,
    verify=check_remediation_success
)
'''
