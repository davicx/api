"""
EC2 deploy logic: create (launch → wait → return info) and terminate (terminate → wait).
Used by POST /deploy/ec2/create and POST /deploy/ec2/terminate.
MVP: simple, no VPC/subnet complexity.
"""
from config.config import PROFILE, REGION
from config.aws.sessions import create_session


def _get_latest_amazon_linux_2_ami(ec2_client) -> str:
    """Return the latest Amazon Linux 2 AMI ID in the current region."""
    response = ec2_client.describe_images(
        Owners=["amazon"],
        Filters=[{"Name": "name", "Values": ["amzn2-ami-hvm-*-x86_64-gp2"]}],
    )
    images = sorted(response["Images"], key=lambda x: x["CreationDate"], reverse=True)
    if not images:
        raise ValueError("No Amazon Linux 2 AMI found in this region.")
    return images[0]["ImageId"]


def run_create_ec2(name: str, instance_type: str) -> dict:
    """
    Launch a single EC2 instance, tag it, wait until running.
    Returns dict with success, message, instance_id, instance_type, public_ip, state, tags, log.
    """
    log = []
    try:
        clients = create_session(PROFILE, REGION)
        ec2 = clients["ec2"]

        ami_id = _get_latest_amazon_linux_2_ami(ec2)

        step = "Launching instance..."
        print(step)
        log.append(step)
        run = ec2.run_instances(
            ImageId=ami_id,
            InstanceType=instance_type,
            MinCount=1,
            MaxCount=1,
            TagSpecifications=[
                {
                    "ResourceType": "instance",
                    "Tags": [
                        {"Key": "Name", "Value": name},
                        {"Key": "cloudpilot-managed", "Value": "true"},
                    ],
                }
            ],
        )
        instance_id = run["Instances"][0]["InstanceId"]
        step = f"Instance launched: {instance_id}"
        print(step)
        log.append(step)

        step = "Waiting for instance to run..."
        print(step)
        log.append(step)
        waiter = ec2.get_waiter("instance_running")
        waiter.wait(InstanceIds=[instance_id])
        step = "Instance running."
        print(step)
        log.append(step)

        step = "Fetching public IP..."
        print(step)
        log.append(step)
        desc = ec2.describe_instances(InstanceIds=[instance_id])
        instance = desc["Reservations"][0]["Instances"][0]
        state = instance["State"]["Name"]
        public_ip = instance.get("PublicIpAddress") or ""
        tags = {t["Key"]: t["Value"] for t in instance.get("Tags", [])}

        return {
            "success": True,
            "message": "EC2 instance created successfully",
            "instance_id": instance_id,
            "instance_type": instance_type,
            "public_ip": public_ip,
            "state": state,
            "tags": tags,
            "log": log,
        }
    except Exception as e:
        msg = str(e)
        print(f"Error creating instance: {msg}")
        log.append(f"Error: {msg}")
        return {
            "success": False,
            "message": msg,
            "instance_id": "",
            "instance_type": instance_type,
            "public_ip": "",
            "state": "",
            "tags": {},
            "log": log,
        }


def list_running_ec2() -> dict:
    """
    List all EC2 instances in 'running' state in the configured region.
    Returns dict with success, message, instances (list), count, log.
    """
    log = []
    try:
        clients = create_session(PROFILE, REGION)
        ec2 = clients["ec2"]

        step = "Listing running instances..."
        print(step)
        log.append(step)
        response = ec2.describe_instances(
            Filters=[{"Name": "instance-state-name", "Values": ["running"]}],
        )
        instances = []
        for reservation in response.get("Reservations", []):
            for inst in reservation.get("Instances", []):
                tags = {t["Key"]: t["Value"] for t in inst.get("Tags", [])}
                instances.append({
                    "instance_id": inst["InstanceId"],
                    "instance_type": inst["InstanceType"],
                    "state": inst["State"]["Name"],
                    "name": tags.get("Name", ""),
                    "public_ip": inst.get("PublicIpAddress") or "",
                    "tags": tags,
                })
        step = f"Found {len(instances)} running instance(s)."
        print(step)
        log.append(step)

        return {
            "success": True,
            "message": step,
            "instances": instances,
            "count": len(instances),
            "log": log,
        }
    except Exception as e:
        msg = str(e)
        print(f"Error listing instances: {msg}")
        log.append(f"Error: {msg}")
        return {
            "success": False,
            "message": msg,
            "instances": [],
            "count": 0,
            "log": log,
        }


def run_terminate_ec2(instance_id: str) -> dict:
    """Terminate the EC2 instance and wait until terminated. Returns success, message, instance_id, log."""
    log = []
    try:
        clients = create_session(PROFILE, REGION)
        ec2 = clients["ec2"]

        step = f"Terminating instance {instance_id}..."
        print(step)
        log.append(step)
        ec2.terminate_instances(InstanceIds=[instance_id])
        waiter = ec2.get_waiter("instance_terminated")
        waiter.wait(InstanceIds=[instance_id])
        step = "Instance terminated."
        print(step)
        log.append(step)

        return {
            "success": True,
            "message": "EC2 instance terminated successfully",
            "instance_id": instance_id,
            "log": log,
        }
    except Exception as e:
        msg = str(e)
        print(f"Error terminating instance: {msg}")
        log.append(f"Error: {msg}")
        return {
            "success": False,
            "message": msg,
            "instance_id": instance_id,
            "log": log,
        }
