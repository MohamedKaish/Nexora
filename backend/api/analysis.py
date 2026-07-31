"""
Video analysis API endpoints.

Routes:
  POST /analyze          Upload a video and start a background analysis job.
  GET  /status/{job_id}  Poll job progress and retrieve the result.
  GET  /report/{job_id}  Download the generated PDF authenticity report.

Sprint 3: Add POST /analyze-voice for audio deepfake detection.
Sprint 4: Protect all routes with JWT authentication (Bearer token).
Sprint 5: Replace in-memory job_store reads with async DB queries.
Sprint 6: Replace FileResponse with a cloud-storage presigned URL redirect.
"""

import shutil
import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from config.settings import get_settings
from schemas.analysis import AnalysisStage, AnalysisStatusResponse, AnalyzeResponse
from services.cleanup_service import cleanup_service
from services.job_store import AnalysisJob, job_store
from services.media_intake import media_intake_policy
from services.report_generator import report_generator
from services.video_processor import video_processor
from utils.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)

# Read buffer for streaming uploads — 1 MB keeps memory usage bounded while
# still being large enough to avoid excessive syscall overhead.
_CHUNK_SIZE = 1024 * 1024


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload a video for deepfake analysis",
    description=(
        "Accepts an MP4, AVI, or MOV video file (≤ 500 MB). "
        "Returns a job ID immediately; poll GET /status/{id} for progress."
    ),
)
async def analyze_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Video file to analyze (MP4, AVI, or MOV)."),
) -> AnalyzeResponse:
    settings = get_settings()

    file_path_obj = Path(file.filename or "")
    if not media_intake_policy.is_supported_extension(file_path_obj):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                "Unsupported file type. Upload an MP4, AVI, or MOV video. "
                f"Received: '{file_path_obj.suffix or 'unknown'}'"
            ),
        )

    # Validate magic number
    header = await file.read(16)
    if not media_intake_policy.is_valid_magic_number(header):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Invalid file signature. Only valid MP4, AVI, and MOV files are allowed.",
        )
    await file.seek(0)

    job_id = uuid4().hex
    extension = file_path_obj.suffix.lower()
    safe_name = Path(file.filename or f"video{extension}").name
    
    # Create a secure OS-level temporary directory for the upload.
    # This ensures no media is permanently written to the server's workspace.
    sandbox_dir = Path(tempfile.mkdtemp(prefix="truthlens_uploads_"))
    saved_path = (sandbox_dir / safe_name).resolve()
    total_bytes = 0

    try:
        with saved_path.open("wb") as buffer:
            while chunk := await file.read(_CHUNK_SIZE):
                total_bytes += len(chunk)
                if not media_intake_policy.is_within_size_limit(total_bytes):
                    buffer.close()
                    shutil.rmtree(sandbox_dir, ignore_errors=True)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds the {media_intake_policy.max_file_size_mb} MB upload limit.",
                    )
                buffer.write(chunk)
    except Exception:
        shutil.rmtree(sandbox_dir, ignore_errors=True)
        raise
    finally:
        await file.close()

    job_store.create(AnalysisJob(id=job_id, file_name=safe_name, file_path=str(saved_path)))
    background_tasks.add_task(run_analysis_job, job_id)
    logger.info("Analysis job queued", extra={"job_id": job_id, "file_name": safe_name})

    return AnalyzeResponse(
        id=job_id,
        status=AnalysisStage.queued,
        message="Video uploaded successfully. Analysis has been queued.",
    )


@router.get(
    "/status/{job_id}",
    response_model=AnalysisStatusResponse,
    summary="Poll analysis job status",
    description="Returns the current status and progress (0–100). When status is 'complete', the result payload is included.",
)
async def get_status(job_id: str) -> AnalysisStatusResponse:
    job = job_store.get(job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis job '{job_id}' not found. It may have expired or the ID is incorrect.",
        )

    return AnalysisStatusResponse(
        id=job.id,
        status=job.status,
        progress=job.progress,
        message=job.message,
        result=job.result,
        error=job.error,
    )


@router.get(
    "/report/{job_id}",
    summary="Download the PDF authenticity report",
    description="Streams the generated PDF report. Returns 409 if analysis is not yet complete.",
)
async def download_report(job_id: str, background_tasks: BackgroundTasks) -> FileResponse:
    job = job_store.get(job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis job '{job_id}' not found. It may have expired or the ID is incorrect.",
        )
    if job.status != AnalysisStage.complete or job.report_path is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The PDF report is not ready yet. Poll GET /status/{id} until status is 'complete'.",
        )

    report_path = Path(job.report_path)
    if not report_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The report file has expired and been removed. Re-upload the video to generate a new report.",
        )

    def delete_report_dir():
        # Deletes the isolated temporary directory containing the PDF
        report_dir = report_path.parent
        shutil.rmtree(report_dir, ignore_errors=True)
        logger.info("Cleaned up ephemeral report sandbox", extra={"report_dir": str(report_dir)})

    # FastAPI's FileResponse accepts a background task which will execute AFTER the file has successfully streamed
    from starlette.background import BackgroundTask
    
    return FileResponse(
        path=str(report_path),
        media_type="application/pdf",
        filename=f"truthlens-report-{job_id}.pdf",
        background=BackgroundTask(delete_report_dir)
    )


def run_analysis_job(job_id: str) -> None:
    job = job_store.get(job_id)
    if job is None:
        logger.warning("run_analysis_job called for unknown job", extra={"job_id": job_id})
        return

    settings = get_settings()
    sandbox_dir = Path(job.file_path).parent

    def update_status(stage: AnalysisStage, progress: int, message: str) -> None:
        job_store.update(job_id, status=stage, progress=progress, message=message)

    try:
        update_status(AnalysisStage.file_validation, 5, "Validating media integrity...")
        
        result = video_processor.analyze(
            job.id, 
            Path(job.file_path), 
            job.file_name, 
            update_status=update_status
        )

        update_status(AnalysisStage.final_report_generation, 95, "Compiling cryptographic report...")
        report_path = report_generator.generate(result)

        job_store.update(
            job_id,
            status=AnalysisStage.complete,
            progress=100,
            message="Analysis complete.",
            result=result,
            report_path=str(report_path),
        )
        logger.info(
            "Analysis job completed",
            extra={
                "job_id": job_id,
                "result": result.result,
                "confidence": result.confidence_score,
                "frames": result.frames_analyzed,
                "duration_s": result.analysis_time_seconds,
            },
        )

        cleanup_service.schedule_file_deletion(report_path.parent, settings.report_ttl_seconds)

    except Exception as exc:
        logger.exception("Analysis job failed", extra={"job_id": job_id}, exc_info=True)
        from services.video_processor import VideoProcessingError
        error_msg = str(exc) if isinstance(exc, VideoProcessingError) else "An unexpected error occurred during forensic analysis. Please ensure the video is valid and try again."
        job_store.update(
            job_id,
            status=AnalysisStage.failed,
            progress=100,
            message="Analysis failed.",
            error=error_msg,
        )
    finally:
        if sandbox_dir.exists():
            shutil.rmtree(sandbox_dir, ignore_errors=True)
            logger.info("Cleaned up ephemeral sandbox", extra={"sandbox_dir": str(sandbox_dir)})
