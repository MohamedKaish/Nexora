import type { AnalysisStatusResponse, AnalyzeResponse } from "@/types/analysis";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type UploadOptions = {
  file: File;
  onProgress: (progress: number) => void;
};

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
      reject(new Error(extractError(payload, "Upload failed.")));
    };

    request.onerror = () => reject(new Error("Backend unavailable. Confirm the FastAPI server is running."));
    request.send(formData);
  });
}

export async function fetchAnalysisStatus(id: string): Promise<AnalysisStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/status/${id}`, { cache: "no-store" });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(extractError(payload, "Unable to fetch analysis status."));
  }

  return payload as AnalysisStatusResponse;
}

export function getReportUrl(id: string) {
  return `${API_BASE_URL}/report/${id}`;
}

function parseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string") {
      return detail;
    }
  }

  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
}
