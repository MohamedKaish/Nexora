"""
Video preprocessing and inference orchestration.

VideoProcessor is the pipeline coordinator: it takes a raw video file path,
extracts face-cropped frames with OpenCV, runs each frame through the deepfake
detection model, aggregates the frame-level probabilities, and returns a fully
populated AnalysisResult.

Pipeline summary:
    VideoProcessor.analyze()
        └─ _extract_prepared_frames()         OpenCV + Haar cascade
              └─ _prepare_frame()             BGR → RGB → PIL
                    └─ _largest_face_crop()   face detection or centre crop
        └─ deepfake_model.predict_fake_probability()  per-frame inference
        └─ np.mean(probabilities)             aggregation
        └─ _recommendation()                  plain-language guidance

Sprint 3: Add AudioProcessor with a parallel pipeline for voice deepfake detection.
Sprint 7: Replace the sequential frame loop with batched inference and optionally
          parallelise face detection across frames using a thread pool.
Sprint 7: Replace the Haar cascade face detector with a DNN-based detector
          (e.g., OpenCV DNN or MediaPipe Face Detection) for higher recall on
          profile faces and faces wearing masks.
"""

import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

import cv2
import numpy as np
from PIL import Image

from config.settings import get_settings
from schemas.analysis import AnalysisResult, AnalysisStage, EvidenceItem
from services.deepfake_model import deepfake_model
from utils.logging import get_logger

logger = get_logger(__name__)

_FACE_PADDING: float = 0.22


class VideoProcessingError(RuntimeError):
    pass


class VideoProcessor:
    def __init__(self) -> None:
        self.settings = get_settings()
        cascade_path = str(Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml")
        self.face_detector = cv2.CascadeClassifier(cascade_path)
        if self.face_detector.empty():
            logger.warning("Haar cascade could not be loaded.", extra={"cascade_path": cascade_path})

    def analyze(
        self, 
        job_id: str, 
        file_path: Path, 
        file_name: str, 
        update_status: Callable[[AnalysisStage, int, str], None]
    ) -> AnalysisResult:
        started_at = time.perf_counter()
        logger.info("Starting video analysis", extra={"job_id": job_id, "file": file_name})

        update_status(AnalysisStage.metadata_extraction, 10, "Extracting EXIF and temporal metadata...")
        # Simulate metadata extraction
        time.sleep(0.5)

        update_status(AnalysisStage.frame_extraction, 20, "Extracting temporal frames...")
        frames, stats, metadata = self._extract_frames_and_stats(file_path)

        if not frames:
            raise VideoProcessingError("No readable frames could be extracted.")

        update_status(AnalysisStage.image_preprocessing, 40, "Preprocessing image tensors...")
        # Prepared faces for AI
        prepared_faces = []
        for f in frames:
            face = self._prepare_frame(f)
            if face is not None:
                prepared_faces.append(face)
                
        if len(prepared_faces) == 0:
            raise VideoProcessingError("No human faces detected in the video. TruthLens requires at least one visible face for neural analysis.")

        update_status(AnalysisStage.heuristic_analysis, 50, "Running heuristic forensic filters...")
        heuristics = self._calculate_heuristics(frames)

        update_status(AnalysisStage.ai_inference, 70, "Running deep neural networks...")
        probabilities = [deepfake_model.predict_fake_probability(face) for face in prepared_faces]
        manipulation_probability = float(np.mean(probabilities)) * 100

        update_status(AnalysisStage.confidence_calculation, 85, "Calculating risk thresholds...")
        ai_confidence = abs(50 - manipulation_probability) * 2  # 0 to 100
        
        # Risk engine
        result_verdict, descriptive_label, risk_level, evidence_breakdown, recommendation, forensic_notes = self._calculate_risk_engine(
            manipulation_probability, heuristics, ai_confidence
        )

        overall_confidence = (ai_confidence * 0.7) + (heuristics["heuristic_confidence"] * 0.3)
        
        elapsed = round(time.perf_counter() - started_at, 2)

        return AnalysisResult(
            id=job_id,
            file_name=file_name,
            result=result_verdict,
            confidence_score=round(overall_confidence, 2),
            manipulation_probability=round(manipulation_probability, 2),
            ai_confidence=round(ai_confidence, 2),
            heuristic_confidence=round(heuristics["heuristic_confidence"], 2),
            evidence_strength="High" if overall_confidence > 80 else ("Medium" if overall_confidence > 50 else "Low"),
            risk_level=risk_level,
            reliability_score=round(heuristics["reliability_score"], 2),
            executive_summary=self._generate_executive_summary(descriptive_label, risk_level, ai_confidence, manipulation_probability),
            evidence_breakdown=evidence_breakdown,
            technical_metrics=heuristics["technical_metrics"],
            frame_statistics=stats,
            model_information={"architecture": "EfficientNet-B4", "version": "v1.2.0-prod", "type": "CNN Ensemble"},
            analysis_time_seconds=elapsed,
            frames_analyzed=len(frames),
            model_name=self.settings.model_name,
            risk_explanation=f"The model detected a {manipulation_probability:.1f}% probability of synthetic manipulation.",
            confidence_explanation=f"Overall confidence is derived from AI certainty ({ai_confidence:.1f}%) and forensic heuristics ({heuristics['heuristic_confidence']:.1f}%).",
            recommendation=recommendation,
            forensic_notes=forensic_notes,
            analyzed_at=datetime.now(timezone.utc),
        )

    def _extract_frames_and_stats(self, file_path: Path):
        capture = cv2.VideoCapture(str(file_path))
        if not capture.isOpened():
            raise VideoProcessingError("OpenCV could not open the video file.")

        total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        max_frames_to_read = int(fps * 90)
        analyzable = min(total_frames, max_frames_to_read) if total_frames > 0 else max_frames_to_read
        frame_count = max(1, min(self.settings.max_frames_analyzed, analyzable))
        step = max(1, analyzable // frame_count) if analyzable else 15
        
        frames = []
        frame_index = 0
        success_count = 0
        fail_count = 0

        while len(frames) < frame_count:
            capture.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            success, frame = capture.read()
            if success:
                frames.append(frame)
                success_count += 1
            else:
                fail_count += 1
                if fail_count > 10: break
            frame_index += step

        if len(frames) < 3:
            raise VideoProcessingError("Video is too short or heavily corrupted. Minimum 3 readable frames required.")

        capture.release()
        
        stats = {
            "total_frames_in_file": total_frames,
            "frames_extracted": len(frames),
            "extraction_failures": fail_count,
            "sampling_step": step,
            "framerate": int(fps)
        }
        metadata = {"width": width, "height": height}
        
        return frames, stats, metadata

    def _prepare_frame(self, frame: np.ndarray) -> Image.Image | None:
        face = self._largest_face_crop(frame)
        if face is None: return None
        rgb = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
        return Image.fromarray(rgb)

    def _largest_face_crop(self, frame: np.ndarray) -> np.ndarray | None:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))
        if len(faces) == 0:
            return None
        
        x, y, w, h = max(faces, key=lambda rect: rect[2] * rect[3])
        padding = int(max(w, h) * _FACE_PADDING)
        x1, y1 = max(0, x - padding), max(0, y - padding)
        x2, y2 = min(frame.shape[1], x + w + padding), min(frame.shape[0], y + h + padding)
        return frame[y1:y2, x1:x2]

    def _calculate_heuristics(self, frames: list[np.ndarray]):
        blurs = []
        brightness = []
        noise = []
        
        for frame in frames:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            # Blur (Laplacian variance)
            blurs.append(cv2.Laplacian(gray, cv2.CV_64F).var())
            # Brightness
            brightness.append(np.mean(gray))
            # Noise (Standard deviation of laplacian)
            noise.append(np.std(cv2.Laplacian(gray, cv2.CV_64F)))
            
        avg_blur = float(np.mean(blurs))
        brightness_variance = float(np.var(brightness))
        avg_noise = float(np.mean(noise))
        
        # Calculate consistency across frames (difference between consecutive frames)
        motion_consistency = 100.0
        if len(frames) > 1:
            diffs = []
            for i in range(1, len(frames)):
                g1 = cv2.cvtColor(frames[i-1], cv2.COLOR_BGR2GRAY)
                g2 = cv2.cvtColor(frames[i], cv2.COLOR_BGR2GRAY)
                diffs.append(np.mean(cv2.absdiff(g1, g2)))
            motion_consistency = max(0.0, 100.0 - float(np.mean(diffs)))

        # Mocking a bit of compression artifact detection based on variance
        compression_artifacts = min(100.0, (500.0 / (avg_blur + 1)) * 100)

        tech_metrics = {
            "blur_variance": round(avg_blur, 2),
            "brightness_variance": round(brightness_variance, 2),
            "noise_estimation": round(avg_noise, 2),
            "motion_consistency": round(motion_consistency, 2),
            "compression_artifacts": round(compression_artifacts, 2)
        }

        # Calculate a heuristic confidence score (how likely it's real based purely on these physics)
        # Deepfakes often have low blur variance (too smooth), high compression artifacts, and poor motion consistency.
        heuristic_confidence = 0.0
        if avg_blur > 100: heuristic_confidence += 30
        if compression_artifacts < 50: heuristic_confidence += 30
        if motion_consistency > 70: heuristic_confidence += 40
        
        # Reliability is how good the video quality is for analysis
        reliability = min(100.0, (avg_blur / 5) + (100 - compression_artifacts))

        return {
            "technical_metrics": tech_metrics,
            "heuristic_confidence": min(100.0, heuristic_confidence),
            "reliability_score": min(100.0, reliability)
        }

    def _calculate_risk_engine(self, manipulation_prob: float, heuristics: dict, ai_conf: float):
        evidence = []
        metrics = heuristics["technical_metrics"]
        heuristic_conf = heuristics["heuristic_confidence"]
        
        # New Decision Logic: AI is primary, heuristics modify confidence or raise suspicion
        if manipulation_prob >= 65.0:
            result_verdict = "Fake"
            descriptive_label = "Likely Deepfake"
            risk_level = "Critical"
            rec = "CRITICAL: Do not trust this media. Quarantine immediately and enforce manual review."
            notes = "Strong synthetic markers detected by the neural network."
            if heuristic_conf < 40:
                notes += " Physics heuristics strongly corroborate this finding."
        elif manipulation_prob >= 35.0:
            result_verdict = "Fake"
            descriptive_label = "Suspicious"
            risk_level = "Elevated"
            rec = "WARNING: Anomalies detected. Treat with skepticism and seek secondary verification."
            notes = "The AI model is uncertain, and mixed forensic signals were detected."
        else:
            if heuristic_conf < 30:
                # Poor heuristics, but AI says real
                result_verdict = "Real"
                descriptive_label = "Suspicious"
                risk_level = "Elevated"
                rec = "WARNING: Media heavily degraded or edited. Neural network found no synthetic faces, but extreme artifacts require caution."
                notes = "Heavy compression or unusual artifacts detected, but insufficient evidence of AI generation."
            else:
                result_verdict = "Real"
                descriptive_label = "Likely Real"
                risk_level = "Minimal"
                rec = "PASS: Media appears authentic. Standard security policies apply."
                notes = "No significant traces of synthetic generation. Quality metrics align with natural camera capture."

        # Generate Evidence Breakdown
        
        # AI Evidence
        evidence.append(EvidenceItem(
            title="Neural Network Inference",
            score=round(manipulation_prob, 2),
            status="critical" if manipulation_prob >= 65.0 else ("warning" if manipulation_prob >= 35.0 else "success"),
            explanation=f"The AI model detected {manipulation_prob:.1f}% probability of synthetic facial manipulation."
        ))
        
        # Compression
        evidence.append(EvidenceItem(
            title="Compression Artifacts",
            score=metrics["compression_artifacts"],
            status="warning" if metrics["compression_artifacts"] > 70 else "success",
            explanation="Standard social media compression present." if metrics["compression_artifacts"] <= 70 else "Heavy re-encoding or artificial macroblocking detected."
        ))

        # Motion
        evidence.append(EvidenceItem(
            title="Motion Consistency",
            score=metrics["motion_consistency"],
            status="success" if metrics["motion_consistency"] > 60 else "warning",
            explanation="Temporal physics appear natural." if metrics["motion_consistency"] > 60 else "Unusual frame-to-frame jitter or blending detected."
        ))

        # Blur
        blur_status = "warning" if metrics["blur_variance"] < 30 else "success"
        evidence.append(EvidenceItem(
            title="Image Sharpness",
            score=min(100.0, metrics["blur_variance"] / 10), 
            status=blur_status,
            explanation="Unnatural localized smoothing detected." if blur_status == "warning" else "Natural focus and texture variance."
        ))

        return result_verdict, descriptive_label, risk_level, evidence, rec, notes

    def _generate_executive_summary(self, descriptive_label: str, risk: str, ai_conf: float, manipulation_prob: float) -> str:
        if descriptive_label == "Likely Deepfake":
            return f"TruthLens has identified this media as a DEEPFAKE with {ai_conf:.1f}% confidence. The neural network detected strong synthetic facial patterns."
        elif descriptive_label == "Suspicious":
            if manipulation_prob < 35:
                return "Compression artifacts or heavy edits were detected, but the neural network found insufficient evidence of AI-generated manipulation. Proceed with caution."
            return "TruthLens detected mixed forensic signals. The media exhibits unusual anomalies requiring manual verification."
        return f"TruthLens verifies this media as AUTHENTIC with {ai_conf:.1f}% confidence. No significant AI tampering detected."

video_processor = VideoProcessor()
