from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from config.settings import get_settings
from schemas.analysis import AnalysisStage, AnalysisStatusResponse, AnalyzeResponse
from services.job_store import AnalysisJob, job_store
from services.report_generator import report_generator
from services.video_processor import video_processor
from utils.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)

SUPPORTED_EXTENSIONS = {".mp4", ".avi", ".mov"}
CHUNK_SIZE = 1024 * 1024


@router.post("/analyze", response_model=AnalyzeResponse, status_code=status.HTTP_202_ACCEPTED)
async def analyze_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)) -> AnalyzeResponse:
    settings = get_settings()
    extension = Path(file.filename or "").suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file type. Upload an MP4, AVI, or MOV video.",
        )

    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    job_id = uuid4().hex
    safe_name = Path(file.filename or f"video{extension}").name
    saved_path = (settings.upload_dir / f"{job_id}_{safe_name}").resolve()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    total_bytes = 0

    try:
        with saved_path.open("wb") as buffer:
            while chunk := await file.read(CHUNK_SIZE):
                total_bytes += len(chunk)
                if total_bytes > max_bytes:
                    buffer.close()
                    saved_path.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File is larger than {settings.max_upload_size_mb} MB.",
                    )
                buffer.write(chunk)
    finally:
        await file.close()

    job_store.create(AnalysisJob(id=job_id, file_name=safe_name, file_path=str(saved_path)))
    background_tasks.add_task(run_analysis_job, job_id)

    return AnalyzeResponse(id=job_id, status=AnalysisStage.queued, message="Video uploaded. Analysis queued.")


@router.get("/status/{job_id}", response_model=AnalysisStatusResponse)
async def get_status(job_id: str) -> AnalysisStatusResponse:
    job = job_store.get(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis job not found.")

    return AnalysisStatusResponse(
        id=job.id,
        status=job.status,
        progress=job.progress,
        message=job.message,
        result=job.result,
        error=job.error,
    )


@router.get("/report/{job_id}")
async def download_report(job_id: str) -> FileResponse:
    job = job_store.get(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis job not found.")
    if job.status != AnalysisStage.complete or job.report_path is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Report is not ready yet.")

    report_path = Path(job.report_path)
    if not report_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file was not found.")

    return FileResponse(
        path=str(report_path),
        media_type="application/pdf",
        filename=f"truthlens-report-{job_id}.pdf",
    )


def run_analysis_job(job_id: str) -> None:
    job = job_store.get(job_id)
    if job is None:
        return

    try:
        job_store.update(job_id, status=AnalysisStage.processing, progress=35, message="Extracting frames and detecting faces.")
        job_store.update(job_id, status=AnalysisStage.analyzing, progress=60, message="Running model inference on prepared frames.")
        result = video_processor.analyze(job.id, Path(job.file_path), job.file_name)

        job_store.update(job_id, status=AnalysisStage.generating_report, progress=90, message="Generating PDF report.")
        report_path = report_generator.generate(result)

        job_store.update(
            job_id,
            status=AnalysisStage.complete,
            progress=100,
            message="Analysis complete.",
            result=result,
            report_path=str(report_path),
        )
    except Exception as exc:
        logger.exception("Analysis job failed", exc_info=True)
        job_store.update(
            job_id,
            status=AnalysisStage.failed,
            progress=100,
            message="Analysis failed.",
            error=str(exc),
        )
