
'''
from openai import OpenAI
from core.models.finding import Finding
from core.functions.AI.prompts import build_explanation_prompt

"""
FUNCTIONS A: All Functions Related API interaction
    1) Function A1: Explain Finding (real API)
    2) Function A2: Mock Explain Finding (no API call)
    3) Function A3: Explain Finding With Cache
"""

# simple in-memory cache
_EXPLANATION_CACHE = {}

client = OpenAI()


def _build_cache_key(finding: Finding) -> str:
    """Create a simplified key representing this issue."""
    return f"{finding.service}:{finding.issue}:{finding.instance_type}"


def mock_explain_finding(finding: Finding) -> str:
    """
    Return a mock AI explanation for development/testing.
    No API calls are made.
    """

    explanation = (
        f"This EC2 instance ({finding.name}) is currently running as a "
        f"{finding.instance_type} and has averaged only {finding.avg_cpu}% CPU "
        f"usage over the past monitoring period. This indicates the instance "
        f"may be significantly underutilized.\n\n"
        f"{finding.recommendation}. If the workload is consistently light, "
        f"downsizing could reduce unnecessary compute costs while maintaining "
        f"adequate performance."
    )

    if finding.estimated_savings > 0:
        explanation += (
            f" This change could save approximately "
            f"${finding.estimated_savings} per month."
        )
    else:
        explanation += (
            " However, additional downsizing options may be limited for "
            "this instance type."
        )

    return explanation


def explain_finding(finding: Finding) -> str:
    """
    Generate a short AI explanation for a CloudPilot finding (calls OpenAI API).
    Requires OPENAI_API_KEY.
    """

    prompt = build_explanation_prompt(finding)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful cloud infrastructure expert."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=120,
            temperature=0.2,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        return f"[AI explanation unavailable: {e}]"


def explain_finding_cached(finding: Finding) -> str:
    """
    Explain a finding but reuse explanations when possible
    to reduce API calls.
    """

    key = _build_cache_key(finding)

    if key in _EXPLANATION_CACHE:
        return _EXPLANATION_CACHE[key]

    explanation = explain_finding(finding)
    _EXPLANATION_CACHE[key] = explanation

    return explanation
'''
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
