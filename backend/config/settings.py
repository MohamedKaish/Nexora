from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "TruthLens AI"
    app_version: str = "1.0.0"
    environment: str = Field(default="development", validation_alias="APP_ENV")
    api_prefix: str = ""
    enable_docs: bool = True
    log_level: str = "INFO"
    allowed_origins: list[str] = ["http://localhost:3000"]
    upload_dir: Path = PROJECT_ROOT / "uploads"
    report_dir: Path = PROJECT_ROOT / "reports"
    model_dir: Path = PROJECT_ROOT / "models"
    max_upload_size_mb: int = 500
    max_frames_analyzed: int = 32
    model_repo_id: str = "accel69/depfake-detection"
    model_filename: str = "ig.bin"
    model_name: str = "ResNeXt-101 32x8d Deepfake Detector"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()