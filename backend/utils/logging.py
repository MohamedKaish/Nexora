"""
Structured logging configuration for TruthLens AI.

All backend modules obtain loggers through get_logger() rather than
calling logging.getLogger() directly, which keeps the naming convention
consistent and makes log filtering predictable.

Sprint 4: Replace the console handler with a JSON formatter and add a
          request-scoped correlation ID filter for distributed tracing.
Sprint 7: Add a rotating file handler and a Prometheus log metrics handler.
"""

import logging
from logging.config import dictConfig


def configure_logging(level: str = "INFO") -> None:
    """
    Apply the application-wide logging configuration.

    Must be called once at startup before any module emits log records.
    Calling it more than once is safe — dictConfig is idempotent for the
    same configuration dict.

    Args:
        level: Root log level string (e.g., "INFO", "DEBUG", "WARNING").
               Case-insensitive; normalised to upper-case internally.
    """
    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "standard": {
                    # Format: timestamp level [logger_name] message
                    # Extra fields passed via the `extra` kwarg are NOT automatically
                    # included here. Sprint 4 will replace this with a JSON formatter
                    # that serialises all extra keys for structured log aggregation.
                    "format": "%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
                    "datefmt": "%Y-%m-%dT%H:%M:%S",
                }
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "standard",
                    "stream": "ext://sys.stdout",
                }
            },
            "root": {
                "handlers": ["console"],
                "level": level.upper(),
            },
        }
    )


def get_logger(name: str) -> logging.Logger:
    """
    Return a named logger for the calling module.

    Usage::

        from utils.logging import get_logger
        logger = get_logger(__name__)
        logger.info("Something happened", extra={"job_id": job_id})

    Args:
        name: Typically ``__name__`` of the calling module.

    Returns:
        A standard library Logger instance.
    """
    return logging.getLogger(name)
