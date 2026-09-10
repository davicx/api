"""
API request shapes for EC2 scan (Pydantic).

Aligned with ``ProjectDesign.md``: one flexible body — ``scope``, optional ``region``, optional ``rules``.
"""

from typing import List, Literal, Optional

from pydantic import AliasChoices, BaseModel, Field


class Ec2ScanScopeModel(BaseModel):
    """
    What to scan: full account, one instance, tag filter, or region-wide.

    ``value`` in JSON may be sent as ``match`` (same field via alias).
    """

    type: Literal["full", "instance", "tag", "region"] = "full"
    key: Optional[str] = None
    value: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("value", "match"),
        description="Instance id, tag value, or region name (JSON key: value or match)",
    )

    def to_dict(self) -> dict:
        return self.model_dump(exclude_none=True)


class Ec2ScanRequest(BaseModel):
    scope: Ec2ScanScopeModel = Field(default_factory=Ec2ScanScopeModel)
    region: Optional[str] = None
    rules: Optional[List[str]] = None
