'''
def scan(ec2, cloudwatch):

    findings = []

    end = datetime.now(timezone.utc)
    start = end - timedelta(days=LOOKBACK_DAYS)

    instances = ec2.describe_instances(
        Filters=[{"Name": "instance-state-name", "Values": ["running"]}]
    )

    for reservation in instances["Reservations"]:
        for inst in reservation["Instances"]:

            instance_id = inst["InstanceId"]

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
                continue

            avg_cpu = sum(dp["Average"] for dp in datapoints) / len(datapoints)

            finding = evaluate(inst, avg_cpu)

            if finding:
                findings.append(finding)

    return findings

'''



#ORIGINAL
'''


def scan(ec2, cloudwatch):
    findings = []

    end = datetime.now(timezone.utc)
    start = end - timedelta(days=14)

    instances = ec2.describe_instances(
        Filters=[{"Name": "instance-state-name", "Values": ["running"]}]
    )

    for reservation in instances["Reservations"]:
        for inst in reservation["Instances"]:

            instance_id = inst["InstanceId"]
            instance_type = inst["InstanceType"]

            name = next(
                (t["Value"] for t in inst.get("Tags", []) if t["Key"] == "Name"),
                "Unnamed",
            )

            metrics = cloudwatch.get_metric_statistics(
                Namespace="AWS/EC2",
                MetricName="CPUUtilization",
                Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
                StartTime=start,
                EndTime=end,
                Period=86400,
                Statistics=["Average"],
            )

            datapoints = metrics["Datapoints"]

            if not datapoints:
                continue

            avg_cpu = sum(dp["Average"] for dp in datapoints) / len(datapoints)

            if avg_cpu < 10:

                suggestion, savings = SAVINGS_MAP.get(
                    instance_type,
                    ("Review manually", 0),
                )

                findings.append(
                    Finding(
                        service="EC2",
                        resource_id=instance_id,
                        name=name,
                        instance_type=instance_type,
                        avg_cpu=round(avg_cpu, 2),
                        issue="Low CPU utilization",
                        recommendation=f"Consider downsizing to {suggestion}",
                        estimated_savings=savings,
                    )
                )
           

    return findings

'''

'''

SAVINGS_MAP = {
    "t3.large": ("t3.medium", 15),
    "t3.medium": ("t3.small", 10),
}


def scan(ec2, cloudwatch):
    findings = []

    end = datetime.now(timezone.utc)
    start = end - timedelta(days=14)

    instances = ec2.describe_instances(
        Filters=[{"Name": "instance-state-name", "Values": ["running"]}]
    )

    for reservation in instances["Reservations"]:
        for inst in reservation["Instances"]:
            instance_id = inst["InstanceId"]
            instance_type = inst["InstanceType"]

            name = next(
                (t["Value"] for t in inst.get("Tags", []) if t["Key"] == "Name"),
                "Unnamed",
            )

            metrics = cloudwatch.get_metric_statistics(
                Namespace="AWS/EC2",
                MetricName="CPUUtilization",
                Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
                StartTime=start,
                EndTime=end,
                Period=86400,
                Statistics=["Average"],
            )

            datapoints = metrics["Datapoints"]
            if not datapoints:
                continue

            avg_cpu = sum(dp["Average"] for dp in datapoints) / len(datapoints)

            if avg_cpu < 10:
                suggestion, savings = SAVINGS_MAP.get(
                    instance_type, ("Review manually", 0)
                )

                findings.append(
                    Finding(
                        service="EC2",
                        resource_id=instance_id,
                        name=name,
                        issue="Low CPU utilization",
                        recommendation=f"Consider downsizing to {suggestion}",
                        estimated_savings=savings,
                    )
                )

    return findings

'''
