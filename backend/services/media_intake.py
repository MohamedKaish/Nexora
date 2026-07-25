from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class MediaIntakePolicy:
    allowed_extensions: tuple[str, ...] = (".mp4", ".avi", ".mov")
    max_file_size_mb: int = 500

    def is_supported_extension(self, path: Path) -> bool:
        return path.suffix.lower() in self.allowed_extensions

