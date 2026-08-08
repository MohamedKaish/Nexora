<<<<<<< HEAD
# TruthLens AI

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14%20App%20Router-black)](https://nextjs.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2%2B-EE4C2C)](https://pytorch.org)

TruthLens AI is a premium media authenticity verification platform. The current MVP implements
deepfake video detection using a CPU-compatible ResNeXt-101 32x8d PyTorch model with a full
FastAPI backend and a Next.js App Router frontend.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Model](#model)
- [Folder Structure](#folder-structure)
- [Development Roadmap](#development-roadmap)

---

## Features

- **Video upload** with drag-and-drop, browse, file type validation, and chunked progress
- **Background analysis** — FastAPI returns 202 immediately; processing runs in a thread
- **Live polling** — frontend polls `/status/{id}` every 1.4 seconds and shows real progress
- **Results dashboard** — verdict, confidence ring, manipulation probability, analysis metadata
- **PDF report** — downloadable ReportLab report for every completed analysis
- **Health endpoint** — reports real AI model load state (`ai_analysis_enabled`)
- **TTL cleanup** — uploaded videos deleted after 24 hours; PDFs after 7 days
- **Job eviction** — in-memory job records evicted after 24 hours to prevent memory growth
- **Model warm-up** — weights loaded at startup (configurable) to eliminate cold-start latency

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Next.js 14 (App Router)   http://localhost:3000         │
│  frontend/                                               │
│    app/analyze/            Upload page                   │
│    app/results/            Results page (live polling)   │
│    components/             AnalyzeUploadZone             │
│                            ResultsDashboard              │
│                            ConfidenceCircle              │
│    lib/api.ts              HTTP client                   │
│    lib/constants.ts        Shared constants              │
│    types/analysis.ts       TypeScript types              │
└──────────────┬───────────────────────────────────────────┘
               │ HTTP (NEXT_PUBLIC_API_BASE_URL)
               ▼
┌──────────────────────────────────────────────────────────┐
│  FastAPI (Uvicorn)         http://localhost:8000         │
│  backend/                                               │
│    main.py                 App factory + lifespan        │
│    api/analysis.py         POST /analyze                 │
│                            GET  /status/{id}             │
│                            GET  /report/{id}             │
│    api/health.py           GET  /health                  │
│    services/               deepfake_model                │
│                            video_processor               │
│                            report_generator              │
│                            job_store                     │
│                            cleanup_service               │
│                            media_intake                  │
│    config/settings.py      Pydantic Settings             │
│    schemas/                Pydantic request/response     │
└──────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  Storage (local disk)                                    │
│    uploads/   Uploaded video files (TTL: 24h)            │
│    reports/   Generated PDF reports  (TTL: 7d)           │
│    models/    ig.bin (~741 MB ResNeXt weights)           │
└──────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- `ig.bin` model weights in `models/` (see [Model](#model))

### 1 — Backend

```bash
cd TruthLens-AI/backend

# Create and activate a virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Copy the example env file and adjust
cp .env.example .env

# Start the server
uvicorn main:app --reload
```

The API is now available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

### 2 — Frontend

```bash
cd TruthLens-AI/frontend

# Install dependencies
npm install

# (Optional) Set the backend URL if not using the default
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local

# Start the dev server
npm run dev
```

Open `http://localhost:3000/analyze` to upload a video.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_ENV` | `development` | Environment name (development / production) |
| `LOG_LEVEL` | `INFO` | Root log level |
| `ALLOWED_ORIGINS` | `["http://localhost:3000"]` | CORS allowed origins (JSON array) |
| `MAX_UPLOAD_SIZE_MB` | `500` | Maximum video upload size in MB |
| `MAX_FRAMES_ANALYZED` | `32` | Maximum frames to sample per video |
| `MODEL_REPO_ID` | `accel69/depfake-detection` | Hugging Face repo for auto-download |
| `MODEL_FILENAME` | `ig.bin` | Weight filename in the repo |
| `MODEL_NAME` | `ResNeXt-101 32x8d Deepfake Detector` | Display name in reports |
| `UPLOAD_TTL_SECONDS` | `86400` | Seconds before uploaded videos are deleted (24h) |
| `REPORT_TTL_SECONDS` | `604800` | Seconds before PDF reports are deleted (7d) |
| `JOB_TTL_SECONDS` | `86400` | Seconds before job records are evicted from memory (24h) |
| `MODEL_WARM_UP_ON_START` | `True` | Load model weights at startup (set False to defer to first request) |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Backend API base URL |

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/analyze` | Upload a video (MP4/AVI/MOV ≤ 500 MB). Returns 202 with a job ID. |
| `GET` | `/status/{id}` | Poll job status. Returns progress (0–100), status, and result on completion. |
| `GET` | `/report/{id}` | Download the PDF authenticity report (only when status is `complete`). |
| `GET` | `/health` | Service health check. `ai_analysis_enabled` reflects real model load state. |

Full interactive documentation is available at `/docs` when the backend is running.

### Analysis Status Flow

```
queued → processing → analyzing → generating_report → complete
                                                     ↘ failed
```

### Example cURL

```bash
# Upload a video
curl -X POST http://localhost:8000/analyze \
  -F "file=@sample.mp4" \
  -H "Accept: application/json"

# Poll status (replace JOB_ID)
curl http://localhost:8000/status/JOB_ID

# Download report
curl -O http://localhost:8000/report/JOB_ID
```

---

## Model

| Property | Value |
|----------|-------|
| Architecture | ResNeXt-101 32x8d (torchvision ResNet) |
| Weights file | `ig.bin` (~741 MB) |
| Source | [accel69/depfake-detection](https://huggingface.co/accel69/depfake-detection) |
| Device | CPU (no GPU required) |
| Input | 224 × 224 RGB image, ImageNet normalised |
| Output | Probability in [0, 1] — higher = more likely deepfake |
| Threshold | 0.5 (configurable in `video_processor.py:_FAKE_THRESHOLD`) |

### Loading the weights

**Option A (recommended):** Place `ig.bin` in `models/ig.bin` before starting.

**Option B (auto-download):** Leave `models/` empty. The backend downloads the weights from
Hugging Face on the first analysis request using `huggingface_hub`. Requires internet access.
The download is ~741 MB and cached permanently in `models/`.

> ⚠️ Do not modify `ig.bin`. The model architecture in `deepfake_model.py` is tuned to this
> specific checkpoint and must not be changed without re-validating accuracy.

---

## Folder Structure

```
TruthLens-AI/
├── backend/
│   ├── api/                  Route handlers (analysis.py, health.py, router.py)
│   ├── config/               Pydantic Settings (settings.py)
│   ├── middleware/            Error handlers (error_handler.py)
│   ├── schemas/              Pydantic models (analysis.py, health.py, error.py)
│   ├── services/             Business logic
│   │   ├── cleanup_service.py     Deferred file deletion
│   │   ├── deepfake_model.py      PyTorch model wrapper
│   │   ├── job_store.py           In-memory job state with TTL eviction
│   │   ├── media_intake.py        Upload validation policy
│   │   ├── report_generator.py    ReportLab PDF builder
│   │   └── video_processor.py     OpenCV + inference pipeline
│   ├── utils/                Shared utilities (logging.py)
│   ├── main.py               Application factory + lifespan
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/                  Next.js App Router pages
│   │   ├── analyze/          Upload page
│   │   └── results/          Results page + polling client
│   ├── components/           React components
│   │   ├── ui/               Primitive UI components (Button, Card, ConfidenceCircle, …)
│   │   ├── analyze-upload-zone.tsx
│   │   └── results-dashboard.tsx
│   ├── lib/
│   │   ├── api.ts            Backend HTTP client
│   │   ├── constants.ts      Shared magic-number constants
│   │   └── utils.ts          Tailwind class merge utility
│   └── types/
│       └── analysis.ts       TypeScript types (mirrors backend schemas)
├── models/                   Place ig.bin here
├── uploads/                  Runtime upload storage (auto-created)
├── reports/                  Runtime PDF storage (auto-created)
├── docs/                     Architecture and product notes
└── assets/                   Brand assets
```

---

## Development Roadmap

| Sprint | Feature |
|--------|---------|
| ✅ Sprint 1 | Video deepfake detection MVP |
| ✅ Sprint 2 | Robustness, UX polish, health checks, TTL cleanup |
| 🔜 Sprint 3 | AI voice/audio deepfake detection |
| 🔜 Sprint 4 | Authentication (JWT / OAuth2) |
| 🔜 Sprint 5 | Persistent storage (PostgreSQL + SQLAlchemy) |
| 🔜 Sprint 6 | Cloud storage (S3/GCS for uploads and reports) |
| 🔜 Sprint 7 | Performance (batched inference, Prometheus metrics) |
| 🔜 Sprint 8 | Multi-tenancy, billing, white-label deployments |
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> b1bfc3e (Migrate interface from pytorch to ONNX runtime)
