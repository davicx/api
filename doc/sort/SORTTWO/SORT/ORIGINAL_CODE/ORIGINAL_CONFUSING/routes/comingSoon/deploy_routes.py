from fastapi import APIRouter
from pydantic import BaseModel

from api.services.comingSoon.deploy_logic import list_running_ec2, run_create_ec2, run_terminate_ec2
from api.functions.response_helpers import json_response, response_or_error

router = APIRouter(prefix="/deploy/ec2", tags=["EC2 Deploy"])


class CreateEc2Body(BaseModel):
    name: str
    instance_type: str = "t3.micro"


class TerminateEc2Body(BaseModel):
    instance_id: str


@router.get("/instances")
def deploy_ec2_list_instances():
    """List all running EC2 instances in the configured region."""
    result = list_running_ec2()
    if result["success"]:
        return json_response(
            data={"instances": result["instances"], "count": result["count"], "log": result["log"]},
            message=result["message"],
        )
    return response_or_error(result)


@router.post("/create")
def deploy_ec2_create(body: CreateEc2Body):
    result = run_create_ec2(body.name, body.instance_type)
    return response_or_error(result)


@router.post("/terminate")
def deploy_ec2_terminate(body: TerminateEc2Body):
    result = run_terminate_ec2(body.instance_id)
    return response_or_error(result)
