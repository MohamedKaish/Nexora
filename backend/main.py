from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.router import api_router
from config.settings import get_settings
from middleware.error_handler import register_error_handlers
from utils.logging import configure_logging, get_logger


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)
    logger = get_logger(__name__)

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        logger.info("TruthLens AI backend started", extra={"version": settings.app_version})
        yield
        logger.info("TruthLens AI backend stopped")

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="TruthLens AI backend foundation. Phase 1 includes no AI analysis implementation.",
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


app = create_app()
