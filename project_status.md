# TruthLens AI MVP Project Status

## Completed Features

- Existing premium Next.js App Router frontend has been preserved.
- Existing FastAPI backend skeleton has been extended into an MVP API.
- Video-only upload flow is implemented with drag and drop, browse file selection, file validation, and upload progress.
- Supported frontend/backend formats are MP4, AVI, and MOV.
- Maximum upload size is enforced at 500 MB.
- Frontend calls the FastAPI backend through `NEXT_PUBLIC_API_BASE_URL`, defaulting to `http://localhost:8000`.
- `POST /analyze` saves the uploaded video and starts a background analysis job.
- `GET /status/{id}` returns queued, processing, analyzing, generating_report, complete, or failed status.
- `GET /report/{id}` downloads the generated PDF report after analysis is complete.
- `GET /health` reports service health and AI analysis availability.
- Backend extracts frames with OpenCV.
- Backend detects faces with OpenCV Haar cascade and falls back to a center crop if no face is found.
- Backend prepares frames with torchvision transforms.
- Backend integrates a CPU-compatible PyTorch ResNeXt-101 32x8d deepfake detector.
- Model loading supports local weights in `models/ig.bin` and Hugging Face download through `huggingface_hub`.
- Model checkpoint loading handles common PyTorch checkpoint formats and both one-logit sigmoid and two-logit softmax classifiers.
- Backend averages frame-level predictions into a video-level Real/Fake result.
- Results include Real/Fake, confidence score, manipulation probability, analysis time, frames analyzed, model name, recommendation, and analysis date.
- Frontend polls job status and navigates to the results page after completion.
- Results page displays the real backend prediction.
- PDF report generation is implemented with ReportLab.
- PDF reports include file name, analysis date, result, confidence, manipulation probability, frames analyzed, model name, and recommendation.
- Stale voice-detection MVP copy was removed from the upload and feature UI.

## Remaining Features

- Voice detection remains intentionally out of scope for this MVP.
- Authentication remains out of scope.
- Database persistence remains out of scope.
- Cloud storage remains out of scope.
- Browser extension, live camera, and heatmaps remain out of scope.
- In-memory job tracking should be replaced with persistent storage before production deployment.
- Upload/report retention and cleanup policies should be added before production deployment.
- Model threshold and accuracy should be validated against a representative dataset before production use.

## Manual Setup Required

Install frontend dependencies:

```bash
cd TruthLens-AI/frontend
npm install
```

Install backend dependencies:

```bash
cd TruthLens-AI/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Optional frontend environment variable:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

The frontend defaults to `http://localhost:8000` if this value is not set.

## Required Model Download

The backend is configured for:

```text
Repository: accel69/depfake-detection
Weights: ig.bin
Local path: TruthLens-AI/models/ig.bin
```

For offline use, place `ig.bin` in `TruthLens-AI/models/ig.bin`.

If the file is missing and the backend machine has network access, the first analysis request will attempt to download the weights with `huggingface_hub`.

## How To Run

Start the backend:

```bash
cd TruthLens-AI/backend
uvicorn main:app --reload
```

Start the frontend:

```bash
cd TruthLens-AI/frontend
npm run dev
```

Then open:

```text
http://localhost:3000/analyze
```

Upload an MP4, AVI, or MOV video. The frontend uploads the file to `/analyze`, polls `/status/{id}`, navigates to `/results?id={id}`, displays the real prediction, and links the PDF report from `/report/{id}`.

## Verification Notes

- No install, dev server, Python, uvicorn, or build commands were run during this continuation.
- Verification was limited to source inspection and targeted consistency fixes, per the instruction not to run project commands.