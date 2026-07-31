"""
TruthLens AI — FastAPI application factory.

Entry point for Uvicorn: ``uvicorn main:app --reload``

Application lifecycle:
    Startup:
        1. Configure structured logging.
        2. Optionally warm up the AI model in a thread pool executor
           (controlled by MODEL_WARM_UP_ON_START env var).
    Running:
        - All requests are handled by the FastAPI application.
        - BackgroundTasks threads run analysis jobs concurrently.
    Shutdown:
        1. job_store.shutdown() cancels the TTL eviction timer.

Sprint 4: Add JWT/OAuth2 middleware to the lifespan or as FastAPI middleware.
Sprint 6: Add S3/GCS storage client initialisation to the lifespan.
Sprint 7: Add Prometheus metrics instrumentation middleware.
"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.router import api_router
from config.settings import get_settings
from middleware.error_handler import register_error_handlers
from services.deepfake_model import ModelLoadError, deepfake_model
from services.job_store import job_store
from utils.logging import configure_logging, get_logger


def create_app() -> FastAPI:
    """
    Build and configure the FastAPI application.

    Called once at module load time. Returns a fully wired ``FastAPI`` instance
    with CORS middleware, error handlers, and all API routes registered.

    Returns:
        Configured FastAPI application instance.
    """
    settings = get_settings()
    configure_logging(settings.log_level)
    logger = get_logger(__name__)

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        # ── Startup ──────────────────────────────────────────────────────────
        logger.info(
            "TruthLens AI backend starting",
            extra={"version": settings.app_version, "env": settings.environment},
        )

        if settings.model_warm_up_on_start:
            logger.info(
                "Warming up AI model — loading weights into memory. "
                "This may take up to 60 seconds on the first run."
            )
            try:
                # deepfake_model.load() is CPU-bound and synchronous.
                # Running it in the default thread pool keeps the event loop
                # responsive so Uvicorn can accept health-check connections
                # during the warm-up period.
                loop = asyncio.get_event_loop()
                await loop.run_in_executor(None, deepfake_model.load)
                logger.info("AI model warm-up complete — ready to serve inference requests.")
            except ModelLoadError as exc:
                # Log a warning but do NOT crash the process. The backend remains
                # healthy for configuration inspection and health checks.
                # Analysis requests will fail with a clear ModelLoadError message.
                logger.warning(
                    "AI model warm-up failed — inference will be unavailable until the process restarts.",
                    extra={"error": str(exc)},
                )
        else:
            logger.info(
                "Model warm-up disabled (MODEL_WARM_UP_ON_START=False). "
                "The model will load on the first analysis request."
            )

        logger.info("TruthLens AI backend ready.")
        yield

        # ── Shutdown ─────────────────────────────────────────────────────────
        job_store.shutdown()
        logger.info("TruthLens AI backend stopped.")

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "TruthLens AI — deepfake video detection and media authenticity verification. "
            "Upload a video via POST /analyze and poll GET /status/{id} for results."
        ),
        lifespan=lifespan,
        docs_url="/docs" if settings.enable_docs else None,
        redoc_url="/redoc" if settings.enable_docs else None,
        openapi_url="/openapi.json" if settings.enable_docs else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    register_error_handlers(app)
    app.include_router(api_router, prefix=settings.api_prefix)

    return app


# Build the application once at import time.
# Uvicorn imports this module and serves the `app` object directly.
app = create_app()
