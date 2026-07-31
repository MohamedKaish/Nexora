"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, FileVideo, FolderOpen, ShieldCheck, LockKeyhole, UploadCloud, Server } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchAnalysisStatus, uploadVideo } from "@/lib/api";
import { MAX_POLL_ATTEMPTS, POLL_INTERVAL_MS, UPLOAD_MAX_SIZE_BYTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AnalysisStage } from "@/types/analysis";

const formats = ["MP4", "AVI", "MOV"];
const allowedExtensions = [".mp4", ".avi", ".mov"];

function stageLabel(status: AnalysisStage, fallback: string) {
  const labels: Record<AnalysisStage, string> = {
    queued: "Initializing forensic analysis...",
    file_validation: "Validating media integrity...",
    metadata_extraction: "Extracting hidden EXIF/metadata...",
    frame_extraction: "Extracting temporal frames...",
    image_preprocessing: "Preprocessing image tensors...",
    heuristic_analysis: "Running heuristic forensic filters...",
    ai_inference: "Running deep neural networks...",
    confidence_calculation: "Calculating risk thresholds...",
    evidence_generation: "Generating forensic evidence...",
    risk_classification: "Classifying threat level...",
    final_report_generation: "Compiling cryptographic report...",
    complete: "Analysis complete.",
    failed: "Analysis failed."
  };
  return labels[status] ?? fallback;
}

export function AnalyzeUploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stage, setStage] = useState<AnalysisStage | "idle" | "uploading">("idle");
  const [message, setMessage] = useState("Awaiting media input...");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const isBusy = stage !== "idle" && stage !== "failed";

  async function handleFile(file: File | undefined) {
    if (!file || isBusy) return;

    const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (!allowedExtensions.includes(extension)) {
      setError("Unsupported codec. Please provide MP4, AVI, or MOV media.");
      setStage("failed");
      return;
    }

    if (file.size > UPLOAD_MAX_SIZE_BYTES) {
      setError(`Media payload exceeds maximum size limit (50 MB).`);
      setStage("failed");
      return;
    }

    setError(null);
    setUploadProgress(0);
    setStage("uploading");
    setMessage("Uploading to secure enclave...");

    try {
      const response = await uploadVideo({
        file,
        onProgress: (progress) => setUploadProgress(progress)
      });
      await pollStatus(response.id);
    } catch (uploadError) {
      setStage("failed");
      setError(uploadError instanceof Error ? uploadError.message : "Secure transfer failed.");
    }
  }

  async function pollStatus(id: string) {
    let attempts = 0;
    while (attempts < MAX_POLL_ATTEMPTS) {
      attempts += 1;
      const statusResponse = await fetchAnalysisStatus(id);
      setStage(statusResponse.status);
      setUploadProgress(statusResponse.progress);
      setMessage(stageLabel(statusResponse.status, statusResponse.message));

      if (statusResponse.status === "complete") {
        router.push(`/results?id=${id}`);
        return;
      }
      if (statusResponse.status === "failed") {
        setError(statusResponse.error ?? "Analysis pipeline failure.");
        return;
      }
      await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
    }
    setStage("failed");
    setError("Analysis timeout. The server may be under extreme load.");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Premium Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Forensic Media Intake
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Upload media to our secure enclave. TruthLens will execute a cryptographic pipeline to detect manipulation, temporal inconsistencies, and synthetic generation.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {/* Main Upload Zone */}
        <motion.div
          animate={{ scale: isDragging ? 1.02 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            void handleFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            "relative flex flex-col min-h-[500px] overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-3xl transition-colors duration-300",
            isDragging && "border-primary/50 bg-primary/5",
            isBusy && "pointer-events-none opacity-80"
          )}
          aria-label="Secure media upload zone"
        >
          <div className="absolute inset-0 bg-mesh opacity-20" aria-hidden="true" />
          
          <div className="relative flex-1 flex flex-col items-center justify-center text-center z-10">
            <motion.div
              className="mb-8 flex h-28 w-28 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 text-primary shadow-glow relative"
              animate={isBusy ? { rotate: 360 } : { y: [0, -8, 0] }}
              transition={isBusy ? { duration: 3, repeat: Infinity, ease: "linear" } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50" />
              <UploadCloud className="h-12 w-12 relative z-10" />
            </motion.div>

            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-3">
              Deploy Media for Analysis
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground mb-8">
              Drag and drop your file into this encrypted zone, or browse your local system.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".mp4,.avi,.mov,video/mp4,video/avi,video/quicktime"
              className="sr-only"
              onChange={(e) => void handleFile(e.target.files?.[0])}
              aria-label="Upload video file"
            />

            <Button type="button" size="lg" className="h-14 px-8 text-base shadow-glow rounded-xl" onClick={() => fileInputRef.current?.click()} disabled={isBusy}>
              <FolderOpen className="h-5 w-5 mr-3" aria-hidden="true" />
              Select File
            </Button>

            {/* Validation & Supported Formats row */}
            <div className="mt-8 flex items-center justify-center gap-4 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5"><FileVideo className="h-4 w-4" /> Max 50 MB</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="flex gap-2">
                {formats.map(f => (
                  <span key={f} className="rounded-md bg-white/5 px-2 py-0.5 border border-white/10">{f}</span>
                ))}
              </span>
            </div>

            {/* Progress / Status Overlay */}
            <AnimatePresence>
              {stage !== "idle" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-5"
                >
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="font-semibold text-foreground tracking-wide">{message}</span>
                    <span className="font-mono text-primary font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress}>
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-6 left-6 right-6 flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-left text-sm text-rose-200 backdrop-blur-xl"
                  role="alert"
                >
                  <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
                  <span className="font-medium">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Security & Guidelines Sidebar */}
        <div className="flex flex-col gap-6">
          <Card className="p-7 bg-black/40 border-white/5 overflow-hidden relative">
            <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none -mr-8 -mt-8">
              <ShieldCheck className="h-48 w-48" />
            </div>
            <div className="mb-5 flex items-center gap-4 relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">Strict Security</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">End-to-End Encrypted</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground relative z-10">
              All media is analyzed within a secure, ephemeral sandbox. Files are cryptographically verified and permanently erased from our servers immediately after the forensic report is generated.
            </p>
          </Card>

          <Card className="p-7 bg-black/40 border-white/5 relative overflow-hidden flex-1">
            <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none -mr-8 -mt-8">
              <Server className="h-48 w-48" />
            </div>
            <div className="mb-5 flex items-center gap-4 relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">Forensic Guidelines</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">For Optimal Accuracy</p>
              </div>
            </div>
            <ul className="space-y-4 text-sm leading-relaxed text-muted-foreground relative z-10 mt-6">
              <li className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                <span>Submit original, uncompressed source files whenever possible.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                <span>Avoid screen recordings, as they strip vital metadata.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                <span>Ensure faces are clearly visible for temporal inconsistency detection.</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
