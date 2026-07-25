from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class AnalysisStage(str, Enum):
    queued = "queued"
    processing = "processing"
    analyzing = "analyzing"
    generating_report = "generating_report"
    complete = "complete"
    failed = "failed"


class AnalysisResult(BaseModel):
    id: str
    file_name: str
    result: str
    confidence_score: float
    manipulation_probability: float
    analysis_time_seconds: float
    frames_analyzed: int
    model_name: str
    recommendation: str
    analyzed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalyzeResponse(BaseModel):
    id: str
    status: AnalysisStage
    message: str


class AnalysisStatusResponse(BaseModel):
    id: str
    status: AnalysisStage
    progress: int
    message: str
    result: AnalysisResult | None = None
    error: str | None = None

