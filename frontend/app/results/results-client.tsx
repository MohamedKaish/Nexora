"use client";

/**
 * ResultsClient Component.
 *
 * Handles the client-side logic for the results page, including polling
 * the backend for job status updates and rendering either the progress
 * indicator, the final results dashboard, or an error state.
 *
 * Sprint 5: Improve WebSocket integration for real-time status updates
 *           to replace the current HTTP polling mechanism.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { AnalysisLoading } from "@/components/results/analysis-loading";
import { ResultsDashboard } from "@/components/results-dashboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchAnalysisStatus } from "@/lib/api";
import { MAX_POLL_ATTEMPTS, POLL_INTERVAL_MS } from "@/lib/constants";
import { TERMINAL_STAGES } from "@/types/analysis";
import type { AnalysisStatusResponse } from "@/types/analysis";

export function ResultsClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [statusResponse, setStatusResponse] = useState<AnalysisStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // activeRef prevents state updates after the component unmounts.
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;

    if (!id) {
      setError("Missing analysis ID. Return to the Analyze page and upload a video.");
      return;
    }

    let attempts = 0;

    async function poll() {
      if (!activeRef.current) return;

      try {
        const response = await fetchAnalysisStatus(id!);

        if (!activeRef.current) return;

        setStatusResponse(response);

        // Stop polling once the job reaches a terminal state.
        if (TERMINAL_STAGES.has(response.status)) {
          if (response.status === "failed") {
            setError(response.error ?? "Analysis failed. Please try uploading again.");
          }
          return;
        }

        attempts += 1;
        if (attempts >= MAX_POLL_ATTEMPTS) {
          setError(
            "Analysis is taking longer than expected. The backend may be under load — please check the server or try again."
          );
          return;
        }

        // Schedule the next poll.
        window.setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        if (!activeRef.current) return;
        setError(err instanceof Error ? err.message : "Unable to load results. Please try again.");
      }
    }

    void poll();

    return () => {
      activeRef.current = false;
    };
  }, [id]);

  // ── Complete: render the full results dashboard ─────────────────────────
  if (statusResponse?.result) {
    return <ResultsDashboard result={statusResponse.result} />;
  }

  // ── Error state ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="mx-auto max-w-2xl min-h-[50vh] flex flex-col items-center justify-center">
        <Card className="p-8 text-center bg-black/40 border-rose-500/20" role="alert" aria-live="assertive">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20" aria-hidden="true">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{error}</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground max-w-sm mx-auto">
            Results are available after the backend completes analysis and generates the PDF report.
          </p>
          <Button asChild className="mt-8 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20" variant="outline">
            <Link href="/analyze">Back to Analyze</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // ── In-progress: show a live progress indicator ─────────────────────────
  return <AnalysisLoading statusResponse={statusResponse} />;
}
