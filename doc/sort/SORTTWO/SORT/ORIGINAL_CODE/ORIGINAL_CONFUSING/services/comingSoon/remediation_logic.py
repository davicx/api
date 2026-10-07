"""
EC2 instance resize logic: stop → wait → change type → start → wait.
Used by POST /remediations/ec2/auto and POST /remediations/ec2/undo.
"""
from config.config import PROFILE, REGION
from config.aws.sessions import create_session


def _resize_instance(ec2_client, instance_id: str, new_type: str) -> tuple[bool, str, list[str]]:
    """
    Stop instance, wait until stopped, change instance type, start instance, wait until running.
    Returns (success, message, log).
    """
    log = []
    try:
        step = "Stopping instance..."
        print(step)
        log.append(step)
        ec2_client.stop_instances(InstanceIds=[instance_id])
        waiter_stopped = ec2_client.get_waiter("instance_stopped")
        waiter_stopped.wait(InstanceIds=[instance_id])
        step = "Instance stopped."
        print(step)
        log.append(step)

        step = "Modifying instance type..."
        print(step)
        log.append(step)
        ec2_client.modify_instance_attribute(
            InstanceId=instance_id,
            InstanceType={"Value": new_type},
        )
        step = "Instance type modified."
        print(step)
        log.append(step)

        step = "Starting instance..."
        print(step)
        log.append(step)
        ec2_client.start_instances(InstanceIds=[instance_id])
        waiter_running = ec2_client.get_waiter("instance_running")
        waiter_running.wait(InstanceIds=[instance_id])
        step = "Instance running."
        print(step)
        log.append(step)

        message = f"Instance {instance_id} resized to {new_type}."
        return True, message, log
    except Exception as e:
        msg = str(e)
        print(f"Error during resize: {msg}")
        log.append(f"Error: {msg}")
        return False, msg, log


def run_auto_resize(instance_id: str, current_type: str, target_type: str) -> dict:
    """
    Resize instance to target_type (AUTO flow).
    Returns dict with success, message, instance_id, previous_type, new_type, log.
    """
    clients = create_session(PROFILE, REGION)
    ec2 = clients["ec2"]
    success, message, log = _resize_instance(ec2, instance_id, target_type)
    return {
        "success": success,
        "message": message,
        "instance_id": instance_id,
        "previous_type": current_type,
        "new_type": target_type,
        "log": log,
    }


def run_undo_resize(instance_id: str, current_type: str, target_type: str) -> dict:
    """
    Resize instance back to current_type (UNDO flow).
    Returns dict with success, message, instance_id, previous_type, new_type, log.
    """
    clients = create_session(PROFILE, REGION)
    ec2 = clients["ec2"]
    success, message, log = _resize_instance(ec2, instance_id, current_type)
    return {
        "success": success,
        "message": message,
        "instance_id": instance_id,
        "previous_type": target_type,
        "new_type": current_type,
        "log": log,
    }
