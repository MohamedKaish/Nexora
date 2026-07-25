from dataclasses import dataclass, field
from datetime import datetime, timezone
from threading import Lock

from schemas.analysis import AnalysisResult, AnalysisStage


@dataclass
class AnalysisJob:
    id: str
    file_name: str
    file_path: str
    status: AnalysisStage = AnalysisStage.queued
    progress: int = 0
    message: str = "Queued for analysis."
    result: AnalysisResult | None = None
    error: str | None = None
    report_path: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class JobStore:
    def __init__(self) -> None:
        self._jobs: dict[str, AnalysisJob] = {}
        self._lock = Lock()

    def create(self, job: AnalysisJob) -> None:
        with self._lock:
            self._jobs[job.id] = job

    def get(self, job_id: str) -> AnalysisJob | None:
        with self._lock:
            return self._jobs.get(job_id)

    def update(
        self,
        job_id: str,
        *,
        status: AnalysisStage | None = None,
        progress: int | None = None,
        message: str | None = None,
        result: AnalysisResult | None = None,
        error: str | None = None,
        report_path: str | None = None,
    ) -> AnalysisJob | None:
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return None
            if status is not None:
                job.status = status
            if progress is not None:
                job.progress = max(0, min(progress, 100))
            if message is not None:
                job.message = message
            if result is not None:
                job.result = result
            if error is not None:
                job.error = error
            if report_path is not None:
                job.report_path = report_path
            return job


job_store = JobStore()
