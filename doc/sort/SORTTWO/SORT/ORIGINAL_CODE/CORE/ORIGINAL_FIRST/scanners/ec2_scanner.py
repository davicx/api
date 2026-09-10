from collections import defaultdict
from datetime import datetime, timedelta, timezone

from config.config import LOOKBACK_DAYS, METRIC_PERIOD, estimate_monthly_cost


def _get_cpu_avg(cloudwatch, instance):
    """Return average CPU utilization over LOOKBACK_DAYS, or None if no data."""
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=LOOKBACK_DAYS)
    instance_id = instance["InstanceId"]
    metrics = cloudwatch.get_metric_statistics(
        Namespace="AWS/EC2",
        MetricName="CPUUtilization",
        Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
        StartTime=start,
        EndTime=end,
        Period=METRIC_PERIOD,
        Statistics=["Average"],
    )
    datapoints = metrics["Datapoints"]
    if not datapoints:
        return None
    return sum(dp["Average"] for dp in datapoints) / len(datapoints)


def _iter_instances_from_reservations(response):
    for reservation in response["Reservations"]:
        for instance in reservation["Instances"]:
            yield instance


def _list_instances_for_scope(ec2_client, scope: dict):
    """
    Return list of running instance dicts for the given scope (same region as client).
    """
    stype = scope.get("type", "full")

    if stype in ("full", "region"):
        response = ec2_client.describe_instances(
            Filters=[{"Name": "instance-state-name", "Values": ["running"]}]
        )
        return list(_iter_instances_from_reservations(response))

    if stype == "instance":
        iid = scope["value"]
        response = ec2_client.describe_instances(InstanceIds=[iid])
        out = []
        for inst in _iter_instances_from_reservations(response):
            if inst.get("State", {}).get("Name") == "running":
                out.append(inst)
        return out

    if stype == "tag":
        filters = [
            {"Name": "instance-state-name", "Values": ["running"]},
            {"Name": f"tag:{scope['key']}", "Values": [scope["value"]]},
        ]
        response = ec2_client.describe_instances(Filters=filters)
        return list(_iter_instances_from_reservations(response))

    raise ValueError(f"Unknown scope type for EC2 scanner: {stype!r}")


def collect_ec2_scan_context(ec2_client, cloudwatch_client, scope=None):
    """
    AWS-only: list instances per scope, fetch avg CPU, sum current (on-demand) cost estimate.
    Does not run rules — use ``core.logic.ec2_logic`` + ``rule_engine.run`` for that.

    ``scope`` keys:
      - type ``full`` | ``region``: all running instances in the client's region
      - type ``instance``: ``value`` = instance id (running only)
      - type ``tag``: ``key`` / ``value`` = tag filter
    """
    if scope is None:
        scope = {"type": "full"}

    instances_ordered = _list_instances_for_scope(ec2_client, scope)
    pairs = []
    current_cost = 0.0
    for instance in instances_ordered:
        instance_type = instance["InstanceType"]
        monthly = estimate_monthly_cost(instance_type)
        if monthly is not None:
            current_cost += monthly
        avg_cpu = _get_cpu_avg(cloudwatch_client, instance)
        pairs.append((instance, avg_cpu))

    return {
        "pairs": pairs,
        "instances": instances_ordered,
        "current_cost": current_cost,
    }


def expected_cost_for_instances(instances, findings):
    """Recompute expected monthly cost using recommended_instance_type from findings per instance."""
    by_resource = defaultdict(list)
    for f in findings:
        by_resource[f.resource_id].append(f)
    expected_cost = 0.0
    for instance in instances:
        iid = instance["InstanceId"]
        instance_type = instance["InstanceType"]
        recommended_type = None
        for finding in by_resource.get(iid, []):
            if getattr(finding, "recommended_instance_type", None):
                recommended_type = finding.recommended_instance_type
        expected_type = recommended_type if recommended_type else instance_type
        em = estimate_monthly_cost(expected_type)
        if em is not None:
            expected_cost += em
    return round(expected_cost, 2)


def scan(ec2_client, cloudwatch_client, scope=None):
    """Backward-compatible EC2 scan. Prefer ``core.logic.ec2_logic.run_ec2_scan``."""
    from core.logic.ec2_logic import run_ec2_scan_with_clients

    return run_ec2_scan_with_clients(ec2_client, cloudwatch_client, scope=scope)
