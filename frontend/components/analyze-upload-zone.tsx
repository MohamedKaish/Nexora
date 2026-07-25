"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, FileVideo, FolderOpen, Info, LockKeyhole, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchAnalysisStatus, uploadVideo } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AnalysisStatus } from "@/types/analysis";

const formats = ["MP4", "AVI", "MOV"];
const maxSizeBytes = 500 * 1024 * 1024;
const allowedExtensions = [".mp4", ".avi", ".mov"];
const guidelines = [
  "Use original source files when available.",
  "Avoid compressed screen recordings for research-grade review.",
  "Use MP4, AVI, or MOV files up to 500 MB.",
  "Keep video clips tied to verified consent workflows."
];

export function AnalyzeUploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stage, setStage] = useState<AnalysisStatus | "idle" | "uploading">("idle");
  const [message, setMessage] = useState("Select a video to begin.");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const isBusy = stage !== "idle" && stage !== "failed";

  async function handleFile(file: File | undefined) {
    if (!file || isBusy) {
      return;
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (!allowedExtensions.includes(extension)) {
      setError("Unsupported file type. Upload an MP4, AVI, or MOV video.");
      setStage("failed");
      return;
    }

    if (file.size > maxSizeBytes) {
      setError("File is larger than 500 MB.");
      setStage("failed");
      return;
    }

    setError(null);
    setUploadProgress(0);
    setStage("uploading");
    setMessage("Uploading...");

    try {
      const response = await uploadVideo({
        file,
        onProgress: (progress) => setUploadProgress(progress)
      });
      await pollStatus(response.id);
    } catch (uploadError) {
      setStage("failed");
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    }
  }

  async function pollStatus(id: string) {
    let shouldContinue = true;

    while (shouldContinue) {
      const status = await fetchAnalysisStatus(id);
      setStage(status.status);
      setUploadProgress(status.progress);
      setMessage(stageLabel(status.status, status.message));

      if (status.status === "complete") {
        router.push(`/results?id=${id}`);
        shouldContinue = false;
        return;
      }

      if (status.status === "failed") {
        setError(status.error ?? "Analysis failed.");
        shouldContinue = false;
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 1400));
    }
  }

  function openFileDialog() {
    fileInputRef.current?.click();
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.35fr_.65fr]">
      <motion.div
        animate={{ scale: isDragging ? 1.01 : 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
        className={cn(
          "glass-line relative min-h-[480px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-glass backdrop-blur-2xl transition",
          isDragging && "border-primary/45 bg-primary/10 shadow-glow"
        )}
      >
        <div className="absolute inset-0 bg-mesh opacity-50" />
        <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-70 animate-scan" />
        <div className="relative flex h-full min-h-[430px] flex-col items-center justify-center text-center">
          <motion.div
            className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-glow"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <UploadCloud className="h-11 w-11" />
          </motion.div>
          <h1 className="max-w-2xl text-3xl font-bold tracking-normal text-foreground sm:text-5xl">
            Analyze media authenticity
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            Drag a video file into this secure workspace to run deepfake analysis with the backend model pipeline.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.avi,.mov,video/mp4,video/avi,video/quicktime"
            className="sr-only"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button type="button" size="lg" onClick={openFileDialog} disabled={isBusy}>
              <FolderOpen className="h-5 w-5" />
              Browse File
            </Button>
            <Button type="button" size="lg" variant="secondary">
              <FileVideo className="h-5 w-5" />
              Media Types
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {formats.map((format) => (
              <span key={format} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-sky-100">
                {format}
              </span>
            ))}
          </div>
          {stage !== "idle" ? (
            <div className="mt-8 w-full max-w-xl rounded-2xl border border-white/10 bg-black/25 p-4 text-left">
              <div className="mb-3 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-foreground">{message}</span>
                <span className="text-primary">{uploadProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-sky-300 to-violet-400"
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            </div>
          ) : null}
          {error ? (
            <div className="mt-5 flex max-w-xl items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-left text-sm text-red-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>
      </motion.div>

      <div className="grid gap-5">
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Info className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-foreground">Upload guidelines</h2>
          </div>
          <ul className="space-y-4 text-sm leading-6 text-muted-foreground">
            {guidelines.map((guideline) => (
              <li key={guideline} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{guideline}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-foreground">Secure handling</h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            The workspace is designed for private review flows, authenticated storage, and controlled report access as the platform expands.
          </p>
        </Card>
      </div>
    </div>
  );
}

function stageLabel(status: AnalysisStatus, fallback: string) {
  const labels: Record<AnalysisStatus, string> = {
    queued: "Processing...",
    processing: "Processing...",
    analyzing: "Analyzing...",
    generating_report: "Generating Report...",
    complete: "Analysis complete.",
    failed: "Analysis failed."
  };

  return labels[status] ?? fallback;
}
