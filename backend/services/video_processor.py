import time
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from config.settings import get_settings
from schemas.analysis import AnalysisResult
from services.deepfake_model import deepfake_model


class VideoProcessingError(RuntimeError):
    pass


class VideoProcessor:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.face_detector = cv2.CascadeClassifier(
            str(Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml")
        )

    def analyze(self, job_id: str, file_path: Path, file_name: str) -> AnalysisResult:
        started_at = time.perf_counter()
        frames = self._extract_prepared_frames(file_path)

        if not frames:
            raise VideoProcessingError("No readable frames could be extracted from the uploaded video.")

        probabilities = [deepfake_model.predict_fake_probability(frame) for frame in frames]
        manipulation_probability = float(np.mean(probabilities))
        is_fake = manipulation_probability >= 0.5
        confidence = manipulation_probability if is_fake else 1 - manipulation_probability

        return AnalysisResult(
            id=job_id,
            file_name=file_name,
            result="Fake" if is_fake else "Real",
            confidence_score=round(confidence * 100, 2),
            manipulation_probability=round(manipulation_probability * 100, 2),
            analysis_time_seconds=round(time.perf_counter() - started_at, 2),
            frames_analyzed=len(frames),
            model_name=self.settings.model_name,
            recommendation=self._recommendation(is_fake, confidence),
            analyzed_at=datetime.now(timezone.utc),
        )

    def _extract_prepared_frames(self, file_path: Path) -> list[Image.Image]:
        capture = cv2.VideoCapture(str(file_path))
        if not capture.isOpened():
            raise VideoProcessingError("The uploaded video could not be opened.")

        total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        frame_count = max(1, min(self.settings.max_frames_analyzed, total_frames or self.settings.max_frames_analyzed))
        step = max(1, total_frames // frame_count) if total_frames else 15
        prepared_frames: list[Image.Image] = []
        frame_index = 0

        while len(prepared_frames) < frame_count:
            capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            success, frame = capture.read()
            if not success:
                break

            prepared_frames.append(self._prepare_frame(frame))
            frame_index += step

        capture.release()
        return prepared_frames

    def _prepare_frame(self, frame: np.ndarray) -> Image.Image:
        face = self._largest_face_crop(frame)
        rgb = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
        return Image.fromarray(rgb)

    def _largest_face_crop(self, frame: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))

        if len(faces) == 0:
            height, width = frame.shape[:2]
            size = min(height, width)
            top = max(0, (height - size) // 2)
            left = max(0, (width - size) // 2)
            return frame[top : top + size, left : left + size]

        x, y, width, height = max(faces, key=lambda item: item[2] * item[3])
        padding = int(max(width, height) * 0.22)
        x1 = max(0, x - padding)
        y1 = max(0, y - padding)
        x2 = min(frame.shape[1], x + width + padding)
        y2 = min(frame.shape[0], y + height + padding)
        return frame[y1:y2, x1:x2]

    def _recommendation(self, is_fake: bool, confidence: float) -> str:
        if is_fake and confidence >= 0.8:
            return "Treat this media as high risk and require human review before publication or distribution."
        if is_fake:
            return "Review the media carefully and compare it against trusted source material."
        if confidence >= 0.8:
            return "The analyzed frames appear authentic, but retain provenance checks for sensitive use cases."
        return "The result is not decisive. Use additional verification before making a high-impact decision."


video_processor = VideoProcessor()

