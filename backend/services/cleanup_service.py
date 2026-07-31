"""
Scheduled file cleanup service.

Handles deferred deletion of temporary files produced by the analysis
pipeline (uploaded videos and generated PDF reports). Deletions are
scheduled in daemon threads so they do not block request processing
and are automatically cancelled on process exit.

Sprint 6: Replace threading.Timer with S3 lifecycle rules when cloud
          storage is introduced. The CleanupService interface remains the
          same — only the _delete() implementation changes.
"""

from pathlib import Path
from threading import Timer

from utils.logging import get_logger

logger = get_logger(__name__)


class CleanupService:
    """
    Schedules deferred deletion of temporary files produced by the analysis pipeline.

    Design decisions:
    - Uses threading.Timer (daemon threads): timers are silently cancelled on
      process exit. This is intentional — the TTL is a housekeeping policy,
      not a hard security guarantee. If the process exits unexpectedly, the
      files remain on disk until the next startup's OS-level cleanup or a
      manual sweep.
    - Deletion is idempotent: missing files are silently ignored.
    - All operations are logged at INFO level for auditability.

    Sprint 6: swap _delete() to call storage_service.delete(path) when
              cloud storage is active. The public API is stable.
    """

    def schedule_file_deletion(self, file_path: Path, delay_seconds: int) -> None:
        """
        Schedule ``file_path`` for deletion after ``delay_seconds``.

        Args:
            file_path: Absolute path to the file to delete.
            delay_seconds: Seconds to wait before deleting. Pass 0 (or
                           negative) to delete synchronously in the
                           calling thread — used for failed job cleanups.
        """
        if delay_seconds <= 0:
            self._delete(file_path)
        else:
            timer = Timer(delay_seconds, self._delete, args=(file_path,))
            timer.daemon = True
            timer.start()
            logger.info(
                "Scheduled file deletion",
                extra={"path": str(file_path), "delay_seconds": delay_seconds},
            )

    def _delete(self, file_path: Path) -> None:
        """Delete a single file or directory tree. Silently skips missing paths."""
        import shutil
        try:
            if not file_path.exists():
                return
            if file_path.is_dir():
                shutil.rmtree(file_path, ignore_errors=True)
            else:
                file_path.unlink(missing_ok=True)
            logger.info("Deleted file/directory", extra={"path": str(file_path)})
        except Exception:
            logger.warning(
                "Failed to delete path — it will remain on disk",
                extra={"path": str(file_path)},
                exc_info=True,
            )


# Module-level singleton.
cleanup_service = CleanupService()
