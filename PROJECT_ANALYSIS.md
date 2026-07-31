# TruthLens AI - Project Analysis

This document provides a comprehensive analysis of the TruthLens AI platform in its current state. It details the architecture, workflows, completed milestones, and future roadmap.

## 1. Current Repository Architecture

The repository follows a clean separation of concerns, divided into two primary subsystems: a Next.js (React) frontend and a FastAPI (Python) backend. The backend acts as an orchestrator for file ingestion, PyTorch model inference, and PDF report generation.

```text
TruthLens-AI/
├── frontend/                 # Next.js 14 (App Router)
│   ├── app/                  # Route definitions (/, /analyze, /results)
│   ├── components/           # UI components (Sections, Cards, Upload Zone)
│   ├── lib/                  # Utilities and API clients (api.ts, constants.ts)
│   └── types/                # Shared TypeScript types for API contracts
├── backend/                  # FastAPI Application
│   ├── api/                  # Route controllers (analysis.py, health.py)
│   ├── core/                 # App initialization and lifecycle events
│   ├── config/               # Pydantic environment settings
│   ├── middleware/           # Custom error masking and generic exception handlers
│   ├── schemas/              # Pydantic validation schemas
│   ├── services/             # Core business logic (Inference, PDF, Uploads)
│   └── utils/                # Standardized logging and helpers
├── models/                   # Local model weights directory (ig.bin)
├── uploads/                  # Temporary storage for incoming media
└── reports/                  # Generated PDF artifacts
```

## 2. Workflows

### 2.1 Backend Workflow
1. **Intake:** The `/api/v1/analysis/video` endpoint receives an uploaded file (`MediaIntakePolicy`). It validates the file extension and size (max 500MB).
2. **Job Registration:** A new `AnalysisJob` is created in the thread-safe in-memory `JobStore` with a status of `queued`.
3. **Background Execution:** FastAPI's `BackgroundTasks` hands the job off to the orchestration logic so the API can respond immediately with the Job ID.
4. **State Machine:** The background worker transitions the job through states: `processing` -> `analyzing` -> `generating_report` -> `complete` (or `failed`).
5. **Report Generation:** `report_generator.py` uses ReportLab to build a forensic PDF.
6. **Cleanup:** `CleanupService` (running as a daemon thread) automatically deletes the source video and PDF report based on TTL configuration.

### 2.2 Frontend Workflow
1. **Landing:** Users are introduced to the platform's capabilities via a premium, animated landing page built with Framer Motion.
2. **Upload Zone:** Users drag and drop files. The client validates the extension and size before uploading.
3. **Polling:** Once uploaded, the client hits the `/api/v1/analysis/status/{id}` endpoint every 2 seconds, displaying real-time UI progress.
4. **Results:** When the job reaches a terminal state (`complete` or `failed`), the client redirects to the Dashboard, displaying the verdict, confidence score, and providing a download link for the PDF.

### 2.3 AI Model Workflow
1. **Warm-up:** The PyTorch model (`ResNeXt-101 32x8d`) is lazily loaded. Based on settings, it is loaded during the FastAPI startup lifespan to prevent cold-start penalties.
2. **Frame Extraction:** `video_processor.py` uses OpenCV to extract up to 32 frames from the video.
3. **Face Detection:** OpenCV's Haar Cascade detects faces. If none are found, it defaults to a center crop to ensure maximum recall.
4. **Inference:** Each face crop is converted to a PIL Image, transformed to a PyTorch tensor, and fed into the model.
5. **Aggregation:** The model returns a manipulation probability for each frame. The scores are averaged to determine the final verdict (`Fake` if >= 50%).

## 3. Completed Work

*   **Phase 1 Complete:** Core deepfake video detection pipeline (ResNeXt-101).
*   **Sprint 2 Complete:** Automatic data retention policies, in-memory JobStore TTL, file validation deduplication, and real-time frontend polling.
*   **Sprint 2.5 (Code Quality Pass) Complete:**
    *   Exhaustive documentation: JSDoc and Python docstrings added to every file.
    *   Accessibility (a11y): ARIA labels, semantic HTML, and screen reader announcements (`aria-live`) added to all frontend components.
    *   Type Safety: Pydantic schemas strengthened; TypeScript strict types enforced.
    *   Logging: Standardized logging outputs integrated across all backend services.
    *   Dead Code: Removed unused variables and imports across the repository.
    *   Roadmap Signposting: Embedded `TODO` markers throughout the codebase indicating exactly where Sprints 3-8 will integrate.

## 4. Remaining Sprint Tasks

*   **Sprint 3 (Voice Detection):** Integrate an audio analysis model to detect AI-generated voice cloning.
*   **Sprint 4 (Authentication):** Implement JWT-based user authentication and API keys.
*   **Sprint 5 (Database Migration):** Replace the in-memory `JobStore` with PostgreSQL (via SQLAlchemy) for persistent job tracking.
*   **Sprint 6 (Cloud Storage):** Migrate local `uploads/` and `reports/` storage to AWS S3 / Google Cloud Storage with presigned URLs.
*   **Sprint 7 (Observability):** Wire up Prometheus metrics (inference latency, job counts) and distributed tracing (OpenTelemetry).
*   **Sprint 8 (Monetization):** Multi-tenant organization support and Stripe billing integration.

## 5. Technical Debt & Pending Improvements

*   **In-Memory Store Limits:** The current `JobStore` will lose state if the backend restarts. (Addressed in Sprint 5).
*   **Polling Overhead:** The frontend uses HTTP polling every 2 seconds. This should be migrated to Server-Sent Events (SSE) or WebSockets to reduce server load.
*   **Synchronous Inference Blocking:** Currently, PyTorch inference is CPU-bound. While the `AnalysisJob` runs in a background thread, heavy concurrent traffic could starve the process. Thread-pool tuning or Celery workers will be needed at scale.
*   **Hardcoded HAAR Cascade:** OpenCV's face detection is fast but can struggle with extreme angles. Upgrading to MTCNN or RetinaFace would improve crop accuracy.

## 6. Known Bugs

*   *(None currently reported in the core pipeline. The application is stable and all invariants hold).*

## 7. Future Roadmap (Beyond Sprint 8)

*   **Live Camera Analysis:** WebRTC integration for analyzing live camera feeds in real-time.
*   **Browser Extension:** Chrome/Edge extension to analyze Twitter/YouTube videos directly in the browser.
*   **Explainable AI (XAI):** Generating heatmaps on the video frames to visually highlight the specific facial artifacts that triggered the deepfake detection.
