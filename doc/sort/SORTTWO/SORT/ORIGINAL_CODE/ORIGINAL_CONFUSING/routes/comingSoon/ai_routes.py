from fastapi import APIRouter
from fastapi.responses import JSONResponse

from api.functions.response_helpers import json_response
from core.functions.ai.ai_functions import simple_test

router = APIRouter(tags=["AI"])


@router.get("/ai-test")
def ai_test():
    """Call OpenAI simple_test(); returns the model's one-sentence reply."""
    try:
        result = simple_test()
        return json_response(data={"message": result}, message="OK")
    except Exception as e:
        body = json_response(
            data=None,
            success=False,
            message=str(e),
            status_code=500,
            errors=[str(e)],
        )
        return JSONResponse(content=body, status_code=500)
