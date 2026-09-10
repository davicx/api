"""
Load declarative rule JSON (thresholds, actions, required_metrics).
Code under rules/code reads this config — single source of truth for tunables.
"""

import json
from pathlib import Path

_JSON_ROOT = Path(__file__).resolve().parent / "json"


def load_rule_json(rule_id: str, service: str = "ec2") -> dict:
    """
    Load rules/json/{service}/rule_{rule_id}.json.
    Returns {} if the file is missing (rules without JSON yet).

    Walkthrough: for ``ec2_low_cpu`` this loads ``rules/json/ec2/rule_ec2_low_cpu.json``.
    """
    path = _JSON_ROOT / service / f"rule_{rule_id}.json"
    if not path.is_file():
        return {}
    with path.open(encoding="utf-8") as f:
        return json.load(f)
