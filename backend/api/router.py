from fastapi import APIRouter

from api.analysis import router as analysis_router
from api.health import router as health_router

api_router = APIRouter()
api_router.include_router(analysis_router, tags=["Analysis"])
api_router.include_router(health_router, tags=["Health"])
