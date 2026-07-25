# TruthLens AI MVP Architecture

## Purpose

The MVP preserves the premium Phase 1 interface and adds an end-to-end video deepfake analysis path. Users upload a supported video, FastAPI saves it, samples frames, detects and crops faces, runs CPU-compatible PyTorch inference with an open-source model, stores job status in memory, and generates a downloadable PDF report.

## Frontend

- Next.js App Router with strict TypeScript
- Tailwind CSS with reusable design tokens
- shadcn-style local UI primitives
- Framer Motion for polished transitions and micro-interactions
- Lucide React for consistent iconography
- Drag-and-drop and browse upload flows
- Upload progress through `XMLHttpRequest`
- Backend status polling through `/status/{id}`
- Results page populated from real backend analysis output
- PDF download through `/report/{id}`

## Backend

- FastAPI application factory
- API router with `/health`, `/analyze`, `/status/{id}`, and `/report/{id}`
- Upload validation for MP4, AVI, and MOV files up to 500 MB
- OpenCV frame extraction and Haar cascade face detection
- CPU PyTorch inference using `accel69/depfake-detection` ResNeXt-101 32x8d weights
- Average frame-level fake probability into a video-level result
- In-memory job store for MVP status tracking
- ReportLab PDF report generation
- Central settings module
- Structured logging setup
- Error response middleware

## Model

The backend is configured for the Hugging Face model `accel69/depfake-detection` and the `ig.bin` weights file. For offline use, place `ig.bin` inside the root `models/` folder. If the weights are missing and network access is available, the backend attempts to download them with `huggingface_hub` during first analysis.

## Intentional Exclusions

- Voice detection
- Authentication
- Database persistence
- Cloud storage
- Browser extension
- Live camera
- Heatmaps

## Future Phases

- Voice preprocessing and detection
- Persistent database-backed job tracking
- Authentication and role-based access
- Private object storage
- Model-serving orchestration and monitoring
- Billing and organization management