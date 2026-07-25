from pydantic import BaseModel, ConfigDict


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    ai_analysis_enabled: bool

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "status": "ok",
            "service": "TruthLens AI",
            "version": "1.0.0",
            "ai_analysis_enabled": True,
        }
    })
