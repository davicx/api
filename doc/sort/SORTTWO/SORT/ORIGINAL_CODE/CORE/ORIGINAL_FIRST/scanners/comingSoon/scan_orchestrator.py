# Alternate EC2 entry point — superseded by ``core.logic.ec2_logic`` and ``api.logic.scan_logic``.

from core.ORIGINAL.engine import run_scan


def run_ec2_scan():
    """Run EC2 cost/rule scan (creates AWS session inside ``core.engine``)."""
    return run_scan("ec2")


def run_full_scan():
    """EC2-only today; add other services in ``engine.run_scan`` when ready."""
    return run_ec2_scan()
