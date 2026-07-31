"""
Media intake validation policy.

Defines the single source of truth for file upload constraints.
Both the upload route and any future voice/image routes should import
`media_intake_policy` rather than duplicating extension lists or size limits.

Sprint 3: Extend allowed_extensions or create a separate AudioIntakePolicy
          for .mp3, .wav, .flac, .ogg files.
Sprint 8: Move max_file_size_mb into a per-plan quota table once billing
          is implemented — premium plans may allow larger uploads.
"""

from dataclasses import dataclass, field
from pathlib import Path

from config.settings import get_settings


@dataclass(frozen=True)
class MediaIntakePolicy:
    """
    Immutable policy object for validating incoming video file uploads.

    Reads size limits from Settings so they stay in sync with the
    MAX_UPLOAD_SIZE_MB environment variable. Extension validation uses
    a case-insensitive suffix comparison.

    Usage::

        from services.media_intake import media_intake_policy

        if not media_intake_policy.is_supported_extension(Path(filename)):
            raise HTTPException(415, ...)

        if not media_intake_policy.is_within_size_limit(bytes_received):
            raise HTTPException(413, ...)
    """

    allowed_extensions: tuple[str, ...] = field(
        default_factory=lambda: (".mp4", ".avi", ".mov")
    )

    @property
    def max_file_size_mb(self) -> int:
        """Maximum allowed upload size in megabytes, read from Settings."""
        return get_settings().max_upload_size_mb

    @property
    def max_file_size_bytes(self) -> int:
        """Maximum allowed upload size in bytes."""
        return self.max_file_size_mb * 1024 * 1024

    def is_supported_extension(self, path: Path) -> bool:
        """Return True if path has a supported video file extension."""
        return path.suffix.lower() in self.allowed_extensions

    def is_within_size_limit(self, size_bytes: int) -> bool:
        """Return True if size_bytes does not exceed the configured limit."""
        return size_bytes <= self.max_file_size_bytes

    def is_valid_magic_number(self, header: bytes) -> bool:
        """
        Validate file signature (magic numbers) to prevent extension spoofing.
        MP4/MOV: Contains 'ftyp' at byte 4.
        AVI: Starts with 'RIFF' and contains 'AVI ' at byte 8.
        """
        if len(header) < 12:
            return False
            
        # Check AVI
        if header.startswith(b'RIFF') and header[8:12] == b'AVI ':
            return True
            
        # Check MP4/MOV
        if header[4:8] == b'ftyp':
            return True
            
        return False


# Module-level singleton — import this rather than instantiating MediaIntakePolicy directly.
media_intake_policy = MediaIntakePolicy()
