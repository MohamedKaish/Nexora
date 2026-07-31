"""
In-memory job state store for analysis jobs.

JobStore is the authoritative source of truth for job lifecycle state
while the process is alive. It is intentionally simple for the MVP —
all state is lost on process restart.

Sprint 5: Replace JobStore with an async SQLAlchemy repository backed
          by PostgreSQL. The AnalysisJob dataclass will become a SQLAlchemy
          ORM model. The public API (create/get/update/shutdown) remains stable.
Sprint 4: Add a user_id field to AnalysisJob for ownership scoping once
          authentication is introduced.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from threading import Lock, Timer

from schemas.analysis import AnalysisResult, AnalysisStage
from utils.logging import get_logger

logger = get_logger(__name__)

# Stages representing work still in progress. Jobs in these states must
# never be evicted regardless of their age.
_ACTIVE_STAGES: frozenset[AnalysisStage] = frozenset({
    AnalysisStage.queued,
    AnalysisStage.file_validation,
    AnalysisStage.metadata_extraction,
    AnalysisStage.frame_extraction,
    AnalysisStage.image_preprocessing,
    AnalysisStage.heuristic_analysis,
    AnalysisStage.ai_inference,
    AnalysisStage.confidence_calculation,
    AnalysisStage.evidence_generation,
    AnalysisStage.risk_classification,
    AnalysisStage.final_report_generation,
})


@dataclass
class AnalysisJob:
    """
    Mutable state record for a single analysis job.

    Created when a video is accepted by POST /analyze and updated
    throughout the pipeline by run_analysis_job().

    Sprint 4: Add user_id: str = "" for ownership tracking.
    Sprint 5: This dataclass will be replaced by a SQLAlchemy ORM model.
    """

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
    """
    Thread-safe in-memory store for AnalysisJob records.

    Provides create/get/update operations guarded by a threading.Lock,
    making it safe for concurrent access from FastAPI's request threads
    and BackgroundTask threads.

    Eviction:
        Completed and failed jobs are automatically removed after
        ``job_ttl_seconds`` by a recurring daemon-thread timer.
        In-progress jobs (any stage in _ACTIVE_STAGES) are never evicted.
        After eviction, GET /status/{id} returns 404 — this is correct
        behaviour; clients should have collected the result before the TTL.

    Sprint 5: This class will be replaced by an async DB repository.
              The public API (create/get/update/shutdown) is the migration
              contract — keep it stable.
    """

    def __init__(self, job_ttl_seconds: int = 86400) -> None:
        self._jobs: dict[str, AnalysisJob] = {}
        self._lock = Lock()
        self._job_ttl_seconds = job_ttl_seconds
        self._eviction_timer: Timer | None = None
        self._schedule_eviction()

    # ── Public API ──────────────────────────────────────────────────────────

    def create(self, job: AnalysisJob) -> None:
        """Store a new job record. Overwrites any existing record with the same ID."""
        with self._lock:
            self._jobs[job.id] = job

    def get(self, job_id: str) -> AnalysisJob | None:
        """Return the job record for ``job_id``, or None if not found."""
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
        """
        Partially update a job record in-place.

        Only keyword arguments that are not None are applied, allowing
        callers to update a single field without clobbering others.

        Args:
            job_id: ID of the job to update.
            status: New lifecycle stage.
            progress: New completion percentage (clamped to 0–100).
            message: New human-readable status message.
            result:  Completed AnalysisResult payload.
            error:   Error description for failed jobs.
            report_path: Filesystem path to the generated PDF.

        Returns:
            The mutated AnalysisJob, or None if the job was not found.
        """
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

    def shutdown(self) -> None:
        """
        Cancel the pending eviction timer.

        Must be called during application shutdown (FastAPI lifespan teardown)
        to prevent the daemon thread from attempting state mutations after
        the process has begun its exit sequence.
        """
        if self._eviction_timer is not None:
            self._eviction_timer.cancel()
            self._eviction_timer = None

    # ── Eviction ────────────────────────────────────────────────────────────

    def _schedule_eviction(self) -> None:
        """Schedule the next eviction sweep at half the TTL interval (min 5 min)."""
        interval = max(300, self._job_ttl_seconds // 2)
        self._eviction_timer = Timer(interval, self._run_eviction_sweep)
        self._eviction_timer.daemon = True
        self._eviction_timer.start()

    def _run_eviction_sweep(self) -> None:
        """Remove terminal-state jobs older than job_ttl_seconds."""
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=self._job_ttl_seconds)
        evicted: list[str] = []

        with self._lock:
            for job_id, job in list(self._jobs.items()):
                if job.status not in _ACTIVE_STAGES and job.created_at < cutoff:
                    del self._jobs[job_id]
                    evicted.append(job_id)

        for job_id in evicted:
            logger.info("Evicted expired job from store", extra={"job_id": job_id})

        # Reschedule — the sweep is self-perpetuating until shutdown() is called.
        self._schedule_eviction()


def _make_job_store() -> JobStore:
    """
    Build the module-level JobStore singleton from current settings.

    Deferred import of get_settings() avoids a circular import at module
    load time (settings → services would create a cycle if imported at
    the top of this file).
    """
    from config.settings import get_settings
    return JobStore(job_ttl_seconds=get_settings().job_ttl_seconds)


job_store: JobStore = _make_job_store()
