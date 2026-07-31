/**
 * TruthLens AI — Backend API client.
 *
 * All communication with the FastAPI backend goes through these functions.
 * The base URL is read from NEXT_PUBLIC_API_BASE_URL (set in .env.local).
 * It defaults to http://localhost:8000 for local development.
 *
 * Sprint 3: Add uploadAudio() for voice deepfake analysis.
 * Sprint 4: Add an Authorization header once JWT auth is implemented.
 *           Consider a thin ApiClient class to manage the token lifecycle.
 * Sprint 6: Replace getReportUrl() with fetchPresignedReportUrl() once
 *           reports are stored in cloud storage.
 */

import type { AnalysisStatusResponse, AnalyzeResponse } from "@/types/analysis";

/** Backend base URL. Set NEXT_PUBLIC_API_BASE_URL in .env.local to override. */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// ── Types ────────────────────────────────────────────────────────────────────

type UploadOptions = {
  /** Video file to upload. */
  file: File;
  /** Called with progress 0–100 as the upload advances. */
  onProgress: (progress: number) => void;
};

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Upload a video file to the backend via POST /analyze.
 *
 * Uses XMLHttpRequest instead of fetch() to support the upload.onprogress
 * event, which the Fetch API does not expose in most browser environments.
 *
 * @param options - File and progress callback.
 * @returns Resolved AnalyzeResponse containing the job ID.
 * @throws Error if the upload fails or the server returns a non-2xx status.
 */
export function uploadVideo({ file, onProgress }: UploadOptions): Promise<AnalyzeResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const request = new XMLHttpRequest();
    request.open("POST", `${API_BASE_URL}/analyze`);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      const payload = parseJson(request.responseText);
      if (request.status >= 200 && request.status < 300) {
        resolve(payload as AnalyzeResponse);
        return;
      }
      reject(new Error(extractErrorMessage(payload, "Upload failed. Please try again.")));
    };

    request.onerror = () =>
      reject(
        new Error(
          "Could not reach the TruthLens AI backend. " +
          "Confirm the FastAPI server is running at " +
          API_BASE_URL
        )
      );

    request.send(formData);
  });
}

/**
 * Fetch the current status and progress of an analysis job.
 *
 * @param id - Job ID returned by uploadVideo().
 * @returns AnalysisStatusResponse with the latest status.
 * @throws Error if the request fails or the server returns a non-2xx status.
 */
export async function fetchAnalysisStatus(id: string): Promise<AnalysisStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/status/${id}`, {
    // Disable caching — every poll must hit the server for fresh status.
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(payload, `Unable to fetch status for job '${id}'.`)
    );
  }

  return payload as AnalysisStatusResponse;
}

/**
 * Return the URL for downloading the PDF report for a completed job.
 *
 * The URL points to GET /report/{id} which streams the PDF with
 * Content-Disposition: attachment.
 *
 * Sprint 6: Replace with an async fetchPresignedReportUrl(id) call once
 *           reports are stored in cloud storage.
 *
 * @param id - Job ID of a completed analysis.
 * @returns Absolute URL string for the report download.
 */
export function getReportUrl(id: string): string {
  return `${API_BASE_URL}/report/${id}`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely parse a JSON string, returning null on parse failure instead of throwing.
 */
function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Extract a human-readable error message from an API error response payload.
 *
 * Checks for the FastAPI `detail` field first (raised by HTTPException),
 * then falls back to the TruthLens `message` field (from ErrorResponse),
 * then falls back to the provided fallback string.
 */
function extractErrorMessage(payload: unknown, fallback: string): string {
  if (payload !== null && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (typeof obj["detail"] === "string") return obj["detail"];
    if (typeof obj["message"] === "string") return obj["message"];
  }
  return fallback;
}
