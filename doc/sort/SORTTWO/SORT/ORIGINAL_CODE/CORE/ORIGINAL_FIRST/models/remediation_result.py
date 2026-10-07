from dataclasses import dataclass
from typing import List


@dataclass
class RemediationResult:
    success: bool
    message: str
    warnings: List[str]


'''
RemediationResult(
    success=True,
    message="Secondary instance is running and primary is stopped",
    warnings=[]
)

RemediationResult(
    success=False,
    message="Secondary instance failed to start",
    warnings=["Instance type appears unusually large"]
)

'''
