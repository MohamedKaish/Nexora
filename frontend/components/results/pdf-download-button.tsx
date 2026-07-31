"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReportUrl } from "@/lib/api";

type PdfDownloadButtonProps = {
  jobId: string;
  fileName: string;
};

type DownloadState = "idle" | "downloading" | "success" | "error";

export function PdfDownloadButton({ jobId, fileName }: PdfDownloadButtonProps) {
  const [state, setState] = useState<DownloadState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleDownload = async () => {
    setState("downloading");
    try {
      const url = getReportUrl(jobId);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Report not available or expired.");
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `truthlens-report-${jobId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      setState("success");
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Download failed");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  return (
    <Button 
      size="lg" 
      variant={state === "error" ? "outline" : "default"}
      onClick={handleDownload}
      disabled={state === "downloading" || state === "success"}
      className={`min-w-[200px] ${state === "success" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : ""} ${state === "error" ? "border-rose-500/50 text-rose-400" : ""}`}
      aria-label={`Download PDF report for ${fileName}`}
    >
      {state === "idle" && (
        <>
          <Download className="h-5 w-5 mr-2" aria-hidden="true" />
          Download Report
        </>
      )}
      {state === "downloading" && (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
          Generating...
        </>
      )}
      {state === "success" && (
        <>
          <CheckCircle2 className="h-5 w-5 mr-2" aria-hidden="true" />
          Success
        </>
      )}
      {state === "error" && (
        <>
          <AlertCircle className="h-5 w-5 mr-2" aria-hidden="true" />
          {errorMessage}
        </>
      )}
    </Button>
  );
}
