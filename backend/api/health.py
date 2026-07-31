"""
Health check endpoint.

GET /health is used by load balancers, container orchestrators, and
monitoring systems to determine whether the process is alive and whether
the AI model is ready to serve inference requests.

Sprint 7: Extend the health response with inference latency percentiles
          (p50, p99) and model load time once Prometheus metrics are wired.
"""

from fastapi import APIRouter

from config.settings import get_settings
from schemas.health import HealthResponse
from services.deepfake_model import deepfake_model

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service health check",
    description=(
        "Returns service metadata and AI model readiness. "
        "`ai_analysis_enabled` is True only after the model weights are loaded into memory. "
        "This may be False briefly after startup if MODEL_WARM_UP_ON_START=True is still running, "
        "or permanently False if the weights file is missing."
    ),
)
async def health_check() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=settings.app_version,
        ai_analysis_enabled=deepfake_model.is_loaded(),
    )
