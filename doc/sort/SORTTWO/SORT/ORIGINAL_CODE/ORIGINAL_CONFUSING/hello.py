from fastapi import APIRouter

from api.functions.response_helpers import json_response

router = APIRouter(tags=["hello"])


@router.get("/hello")
def hello():
    return json_response(data={"Hello": "World"}, message="OK")
