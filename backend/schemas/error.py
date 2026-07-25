from typing import Any

from pydantic import BaseModel


class ErrorResponse(BaseModel):
    message: str
    code: str
    details: dict[str, Any] | None = None

