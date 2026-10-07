import boto3
from core.models.remediation_result import RemediationResult
from core.models.remediation import Remediation

ec2 = boto3.client("ec2")

PRIMARY_TAG = "primary"
SECONDARY_TAG = "secondary"
TAG_KEY = "cloudpilot-role"

def _get_instances():
    response = ec2.describe_instances(
        Filters=[
            {
                "Name": f"tag:{TAG_KEY}",
                "Values": [PRIMARY_TAG, SECONDARY_TAG],
            }
        ]
    )

    primary = None
    secondary = None

    for reservation in response["Reservations"]:
        for instance in reservation["Instances"]:

            instance_id = instance["InstanceId"]
            state = instance["State"]["Name"]

            tags = {tag["Key"]: tag["Value"] for tag in instance.get("Tags", [])}
            role = tags.get(TAG_KEY)

            if role == PRIMARY_TAG:
                primary = {"id": instance_id, "state": state}

            if role == SECONDARY_TAG:
                secondary = {"id": instance_id, "state": state}

    return primary, secondary


def remediate():

    primary, secondary = _get_instances()

    if not primary or not secondary:
        return RemediationResult(
            success=False,
            message="Could not locate both primary and secondary instances",
            warnings=[]
        )

    ec2.stop_instances(InstanceIds=[primary["id"]])
    ec2.start_instances(InstanceIds=[secondary["id"]])

    return RemediationResult(
        success=True,
        message="Remediation triggered: primary stopped, secondary started",
        warnings=[]
    )


def undo_remediation():

    primary, secondary = _get_instances()

    ec2.stop_instances(InstanceIds=[secondary["id"]])
    ec2.start_instances(InstanceIds=[primary["id"]])

    return RemediationResult(
        success=True,
        message="Rollback triggered: secondary stopped, primary started",
        warnings=[]
    )


def check_remediation_success():

    primary, secondary = _get_instances()

    warnings = []

    if primary["state"] != "stopped":
        return RemediationResult(
            success=False,
            message="Primary instance is not stopped",
            warnings=[]
        )

    if secondary["state"] != "running":
        return RemediationResult(
            success=False,
            message="Secondary instance is not running",
            warnings=[]
        )

    return RemediationResult(
        success=True,
        message="Remediation verified successfully",
        warnings=warnings
    )


# 🔹 This is the "registration" step
ec2_toggle_remediation = Remediation(
    name="EC2 Toggle",
    description="Switch between primary and secondary EC2 instances",
    execute=remediate,
    undo=undo_remediation,
    verify=check_remediation_success
)


'''

import boto3
from core.models.remediation_result import RemediationResult

ec2 = boto3.client("ec2")

PRIMARY_TAG = "primary"
SECONDARY_TAG = "secondary"
TAG_KEY = "cloudpilot-role"


def _get_instances():
    response = ec2.describe_instances(
        Filters=[
            {
                "Name": f"tag:{TAG_KEY}",
                "Values": [PRIMARY_TAG, SECONDARY_TAG],
            }
        ]
    )

    primary = None
    secondary = None

    for reservation in response["Reservations"]:
        for instance in reservation["Instances"]:

            instance_id = instance["InstanceId"]
            state = instance["State"]["Name"]

            tags = {tag["Key"]: tag["Value"] for tag in instance.get("Tags", [])}

            role = tags.get(TAG_KEY)

            if role == PRIMARY_TAG:
                primary = {"id": instance_id, "state": state}

            if role == SECONDARY_TAG:
                secondary = {"id": instance_id, "state": state}

    return primary, secondary

def remediate():

    primary, secondary = _get_instances()

    if not primary or not secondary:
        return RemediationResult(
            success=False,
            message="Could not locate both primary and secondary instances",
            warnings=[]
        )

    ec2.stop_instances(InstanceIds=[primary["id"]])
    ec2.start_instances(InstanceIds=[secondary["id"]])

    return RemediationResult(
        success=True,
        message="Remediation triggered: primary stopped, secondary started",
        warnings=[]
    )


def check_remediation_success():

    primary, secondary = _get_instances()

    warnings = []

    if primary["state"] != "stopped":
        return RemediationResult(
            success=False,
            message="Primary instance is not stopped",
            warnings=[]
        )

    if secondary["state"] != "running":
        return RemediationResult(
            success=False,
            message="Secondary instance is not running",
            warnings=[]
        )

    return RemediationResult(
        success=True,
        message="Remediation verified successfully",
        warnings=warnings
    )
'''
