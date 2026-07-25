"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { ResultsDashboard } from "@/components/results-dashboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchAnalysisStatus } from "@/lib/api";
import type { AnalysisStatusResponse } from "@/types/analysis";

export function ResultsClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [status, setStatus] = useState<AnalysisStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Missing analysis id.");
      return;
    }

    let active = true;

    async function loadResult() {
      try {
        const response = await fetchAnalysisStatus(id);
        if (!active) {
          return;
        }
        setStatus(response);
        if (response.status !== "complete") {
          setError("The report is not ready yet. Return to Analyze and wait for completion.");
        }
      } catch (resultError) {
        if (active) {
          setError(resultError instanceof Error ? resultError.message : "Unable to load results.");
        }
      }
    }

    void loadResult();

    return () => {
      active = false;
    };
  }, [id]);

  if (status?.result) {
    return <ResultsDashboard result={status.result} />;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-200">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{error ?? "Loading results..."}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Results are available after the backend completes analysis and generates the PDF report.
        </p>
        <Button asChild className="mt-6" variant="secondary">
          <Link href="/analyze">Back to Analyze</Link>
        </Button>
      </Card>
    </div>
  );
}
