"""
Error envelope schema.

All non-2xx responses from TruthLens AI use this shape, enabling clients
to handle errors uniformly without inspecting HTTP status codes alone.

Sprint 4: Extend with request_id: str for distributed tracing.
"""

from typing import Any

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standard error envelope returned by the global exception handlers."""

    message: str = Field(description="Human-readable error description.")
    code: str = Field(description="Machine-readable error code (snake_case).")
    details: dict[str, Any] | None = Field(
        default=None,
        description="Optional structured detail (e.g., validation field errors).",
    )
