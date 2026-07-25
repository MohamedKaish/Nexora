# TruthLens AI

TruthLens AI is a premium authenticity verification platform. The current MVP implements deepfake video detection; AI voice detection remains reserved for a later phase.

This MVP includes a real video deepfake analysis flow using a CPU-compatible PyTorch model, OpenCV frame and face processing, FastAPI job status endpoints, and downloadable PDF reports.

## Structure

```text
TruthLens-AI/
  frontend/   Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI primitives
  backend/    FastAPI API with upload, status, report, health, model, and processing services
  uploads/    Uploaded video storage for MVP analysis jobs
  reports/    Generated PDF reports
  models/     Local model artifacts such as ig.bin
  docs/       Architecture and product notes
  assets/     Shared brand assets
```

## MVP Scope

- Premium landing page
- Video upload with drag and drop, browse, progress, validation, and backend status polling
- Deepfake video inference with an open-source PyTorch model
- Results page connected to backend analysis output
- Animated loading experience
- Reusable frontend components
- FastAPI health, analyze, status, and report endpoints
- Brand logo, favicon, and app icon

## Model

The backend is configured to load the open-source Hugging Face model `accel69/depfake-detection` with `ig.bin` weights. It uses a ResNeXt-101 32x8d architecture, runs on CPU, samples video frames, detects/crops faces with OpenCV, and averages frame-level fake probabilities into a video-level result.

Place `ig.bin` in `models/` for offline startup, or allow the backend to download it through `huggingface_hub` on first analysis.

## Commands

Commands are documented for future use only. They were not run as part of this generation.

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
python -m venv .venv
pip install -r requirements.txt
uvicorn main:app --reload
```
