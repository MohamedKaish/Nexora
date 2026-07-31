"""
Analysis domain schemas.

These models are the single source of truth for the analysis API contract.
Any field change here must be reflected in frontend/types/analysis.ts.

Sprint 3: Add VoiceAnalysisResult and VoiceAnalysisStatusResponse.
Sprint 4: Add user_id: str to AnalysisResult for ownership tracking.
Sprint 5: Add orm_mode / from_attributes support for SQLAlchemy row mapping.
"""

from datetime import datetime
from enum import Enum
from typing import Literal, Dict, Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class AnalysisStage(str, Enum):
    """Lifecycle stages of a single analysis job, in order of progression."""
    queued = "queued"
    file_validation = "file_validation"
    metadata_extraction = "metadata_extraction"
    frame_extraction = "frame_extraction"
    image_preprocessing = "image_preprocessing"
    heuristic_analysis = "heuristic_analysis"
    ai_inference = "ai_inference"
    confidence_calculation = "confidence_calculation"
    evidence_generation = "evidence_generation"
    risk_classification = "risk_classification"
    final_report_generation = "final_report_generation"
    complete = "complete"
    failed = "failed"


class EvidenceItem(BaseModel):
    title: str
    score: float
    status: Literal["critical", "warning", "info", "success"]
    explanation: str


class AnalysisResult(BaseModel):
    """The fully resolved prediction payload for a completed analysis job."""
    id: str = Field(description="Job ID (uuid4 hex string).")
    file_name: str = Field(description="Original uploaded filename.")
    result: Literal["Real", "Fake"] = Field(description="Model verdict.")
    
    # Risk Engine Scores
    confidence_score: float = Field(ge=0.0, le=100.0, description="Overall confidence")
    manipulation_probability: float = Field(ge=0.0, le=100.0, description="Overall fake probability")
    ai_confidence: float = Field(ge=0.0, le=100.0)
    heuristic_confidence: float = Field(ge=0.0, le=100.0)
    evidence_strength: str
    risk_level: str
    reliability_score: float = Field(ge=0.0, le=100.0)

    # Granular Metrics
    executive_summary: str
    evidence_breakdown: List[EvidenceItem]
    technical_metrics: Dict[str, float]
    frame_statistics: Dict[str, int]
    model_information: Dict[str, str]
    
    analysis_time_seconds: float = Field(ge=0.0)
    frames_analyzed: int = Field(ge=0)
    model_name: str
    
    risk_explanation: str
    confidence_explanation: str
    recommendation: str
    forensic_notes: str
    
    analyzed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalyzeResponse(BaseModel):
    """Immediate 202 response returned when a video upload is accepted."""
    id: str = Field(description="Job ID")
    status: AnalysisStage
    message: str


class AnalysisStatusResponse(BaseModel):
    """Polling response for GET /status/{job_id}."""
    id: str
    status: AnalysisStage
    progress: int = Field(ge=0, le=100)
    message: str
    result: Optional[AnalysisResult] = None
    error: Optional[str] = None
