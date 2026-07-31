"""
Application settings for TruthLens AI.

All runtime configuration is centralised here using Pydantic Settings.
Values can be overridden via environment variables or a .env file in the
backend directory (see .env.example for the full list).

Usage::

    from config.settings import get_settings
    settings = get_settings()

The get_settings() function is decorated with @lru_cache so the Settings
object is instantiated exactly once per process. In tests, call
get_settings.cache_clear() before injecting a test environment.

Sprint 3: Add voice_model_repo_id, voice_model_filename, voice_model_name.
Sprint 4: Add jwt_secret_key, jwt_algorithm, access_token_expire_minutes.
Sprint 5: Add database_url: str for the SQLAlchemy connection string.
Sprint 6: Add cloud_storage_bucket: str and cloud_provider: str.
Sprint 7: Add prometheus_enabled: bool.
Sprint 8: Add stripe_secret_key: str (loaded only in production).
"""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Absolute path to the repository root (two levels up from this file).
PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """
    Validated application configuration.

    All fields have safe defaults suitable for local development.
    Sensitive or environment-specific values should be provided via
    environment variables or a backend/.env file (never committed).
    """

    # ── Application metadata ─────────────────────────────────────────────────
    app_name: str = "TruthLens AI"
    app_version: str = "1.0.0"
    environment: str = Field(default="development", validation_alias="APP_ENV")

    # ── API ──────────────────────────────────────────────────────────────────
    api_prefix: str = ""
    enable_docs: bool = True  # Set False in production to hide /docs

    # ── Logging ──────────────────────────────────────────────────────────────
    log_level: str = "INFO"

    # ── CORS ─────────────────────────────────────────────────────────────────
    allowed_origins: list[str] = ["http://localhost:3000"]

    # ── Storage paths ────────────────────────────────────────────────────────
    model_dir: Path = PROJECT_ROOT / "models"

    # ── Upload limits ────────────────────────────────────────────────────────
    max_upload_size_mb: int = 50  # Enforced by MediaIntakePolicy and the upload route

    # ── Inference ────────────────────────────────────────────────────────────
    max_frames_analyzed: int = 32  # Frames sampled per video for inference
    model_repo_id: str = "accel69/depfake-detection"
    model_filename: str = "ig.bin"
    model_name: str = "ResNeXt-101 32x8d Deepfake Detector"

    # ── Retention policy ─────────────────────────────────────────────────────
    # Seconds before uploaded video files are deleted after job completion.
    # Set to 0 to delete immediately (useful for high-privacy deployments).
    upload_ttl_seconds: int = Field(
        default=86_400,  # 24 hours
        validation_alias="UPLOAD_TTL_SECONDS",
    )

    # Seconds before generated PDF reports are deleted.
    # Longer than upload_ttl_seconds because users may download later.
    report_ttl_seconds: int = Field(
        default=604_800,  # 7 days
        validation_alias="REPORT_TTL_SECONDS",
    )

    # Seconds before completed or failed job records are evicted from
    # the in-memory JobStore. Should be >= upload_ttl_seconds so that
    # GET /status/{id} remains valid while the report is still on disk.
    job_ttl_seconds: int = Field(
        default=86_400,  # 24 hours
        validation_alias="JOB_TTL_SECONDS",
    )

    # ── Model warm-up ────────────────────────────────────────────────────────
    # When True, the AI model (~741 MB) is loaded into memory during the
    # FastAPI lifespan startup block rather than on the first request.
    # Eliminates cold-start latency at the cost of slower startup.
    # Set to False in resource-constrained environments or when testing.
    model_warm_up_on_start: bool = Field(
        default=True,
        validation_alias="MODEL_WARM_UP_ON_START",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Silently ignore unknown env vars
    )


@lru_cache
def get_settings() -> Settings:
    """
    Return the cached application Settings singleton.

    The first call reads all environment variables and validates them.
    Subsequent calls return the cached instance without re-reading the environment.

    In tests, call ``get_settings.cache_clear()`` before setting test env vars
    to force a fresh Settings instantiation.
    """
    return Settings()