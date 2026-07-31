"""
Health check schema.

Sprint 7: Extend with model_load_time_seconds: float | None and
          inference_latency_p50_ms: float | None for monitoring dashboards.
"""

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    """Response shape for GET /health."""

    status: str = Field(description="Always 'ok' when the process is alive.")
    service: str = Field(description="Application name from settings.")
    version: str = Field(description="Application version from settings.")
    ai_analysis_enabled: bool = Field(
        description="True only if the AI model weights are loaded into memory and ready to serve inference."
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "ok",
                "service": "TruthLens AI",
                "version": "1.0.0",
                "ai_analysis_enabled": True,
            }
        }
    )
