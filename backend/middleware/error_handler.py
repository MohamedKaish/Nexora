"""
Global HTTP exception handlers for TruthLens AI.

Converts all FastAPI/Starlette exceptions and unhandled Python errors into
a consistent ErrorResponse JSON envelope, ensuring every non-2xx response
from this service has the same shape.

Sprint 4: Add a request_id header extractor and include it in every
          ErrorResponse for correlation with distributed tracing systems.
Sprint 8: Suppress internal error details in production (APP_ENV=production)
          to avoid leaking stack information to external clients.
"""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from schemas.error import ErrorResponse
from utils.logging import get_logger

logger = get_logger(__name__)


def register_error_handlers(app: FastAPI) -> None:
    """
    Attach exception handlers to a FastAPI application instance.

    Called once during app creation in main.py. Handles three categories:

    - HTTPException / StarletteHTTPException: expected errors raised by route
      handlers (4xx, 5xx with explicit detail strings).
    - RequestValidationError: Pydantic validation failures on request bodies
      or query parameters (422 Unprocessable Entity).
    - Exception: any unhandled error from application code (500).

    Args:
        app: The FastAPI application instance to attach handlers to.
    """

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                message=str(exc.detail),
                code="http_error",
            ).model_dump(),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=ErrorResponse(
                message="Request validation failed. Check the request body and parameters.",
                code="validation_error",
                details={"errors": exc.errors()},
            ).model_dump(),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
        # Log the full traceback server-side; return a generic message to the client
        # to avoid leaking implementation details. Sprint 8 will gate the detail on
        # APP_ENV so development environments show more context.
        logger.exception("Unhandled application error", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                message="An unexpected server error occurred. Please try again later.",
                code="internal_server_error",
            ).model_dump(),
        )
