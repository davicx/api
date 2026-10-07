"""
Legacy entry point for scans. Prefer:

- ``api.logic.scan_logic.post_ec2_scan`` / ``scan_resources`` (HTTP / product layer)
- ``core.logic.ec2_logic.run_ec2_scan`` / ``run_ec2_scan_with_clients`` (core)

Kept so existing imports and docs keep working.
"""

from __future__ import annotations

from core.ORIGINAL.logic.ec2_logic import run_ec2_scan, run_ec2_scan_with_clients


def run_scan(service: str, scope: dict | None = None):
    """
    Create AWS session and run the requested service scan.

    ``service``: ``\"ec2\"`` only in this MVP.
    ``scope``: optional; defaults to ``{\"type\": \"full\"}``.
    """
    if service == "ec2":
        return run_ec2_scan(scope=scope)
    raise ValueError(f"Unsupported scan service: {service!r}")


__all__ = ["run_scan", "run_ec2_scan", "run_ec2_scan_with_clients"]
