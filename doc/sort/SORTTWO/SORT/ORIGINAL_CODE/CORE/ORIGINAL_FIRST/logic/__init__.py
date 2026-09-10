"""Core cloud logic: interpret scope, orchestrate scanners + rules (no HTTP)."""

from .ec2_logic import run_ec2_scan, run_ec2_scan_with_clients

__all__ = ["run_ec2_scan", "run_ec2_scan_with_clients"]
