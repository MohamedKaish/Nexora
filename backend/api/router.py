"""
Central API router for TruthLens AI.

All sub-routers are registered here and then mounted onto the FastAPI app
in main.py via app.include_router(api_router, prefix=settings.api_prefix).

Sprint 3: Register voice_router from api.voice.
Sprint 4: Register auth_router from api.auth.
Sprint 8: Register billing_router and organizations_router.
"""

from fastapi import APIRouter

from api.analysis import router as analysis_router
from api.health import router as health_router

# Top-level router — mounted at settings.api_prefix (default: "").
api_router = APIRouter()
api_router.include_router(analysis_router, tags=["Analysis"])
api_router.include_router(health_router, tags=["Health"])
