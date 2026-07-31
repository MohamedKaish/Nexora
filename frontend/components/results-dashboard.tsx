"use client";

import dynamic from "next/dynamic";
import { ShieldAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { ExecutiveSummary } from "@/components/results/executive-summary";
import { TrustMeter } from "@/components/results/trust-meter";
import { EvidenceBreakdown } from "@/components/results/evidence-breakdown";
import { PdfDownloadButton } from "@/components/results/pdf-download-button";
import type { AnalysisResult } from "@/types/analysis";

// Lazy load technical details since it's hidden by default and contains raw JSON
const TechnicalDetails = dynamic(() => import("@/components/results/technical-details").then(mod => mod.TechnicalDetails), {
  ssr: false,
});

type ResultsDashboardProps = {
  result: AnalysisResult;
};

export function ResultsDashboard({ result }: ResultsDashboardProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-8" aria-label="Analysis Results Dashboard">
      {/* Header */}
      <Reveal delay={0.1}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Forensic Report</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              TruthLens Analysis
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Deep neural verification complete. Review the cryptographic provenance and manipulation probabilities below.
            </p>
          </div>
          <div className="shrink-0">
            <PdfDownloadButton jobId={result.id} fileName={result.file_name} />
          </div>
        </div>
      </Reveal>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        
        {/* Left Column: Summary & Meter */}
        <div className="space-y-8 flex flex-col">
          <Reveal delay={0.2}>
            <ExecutiveSummary result={result} />
          </Reveal>
          
          <Reveal delay={0.3} className="flex-1 flex flex-col">
            <Card className="flex-1 overflow-hidden bg-black/40 border-white/5 relative flex items-center justify-center p-8">
               <div className="absolute inset-0 bg-mesh opacity-20" aria-hidden="true" />
               <TrustMeter manipulationProbability={result.manipulation_probability} />
            </Card>
          </Reveal>
        </div>

        {/* Right Column: Evidence Breakdown & Recommendations */}
        <div className="space-y-8 flex flex-col">
          <Reveal delay={0.4} className="flex-1 flex flex-col">
            <EvidenceBreakdown result={result} />
          </Reveal>

          <Reveal delay={0.5}>
            <Card className="p-6 bg-black/40 border-white/5 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 pointer-events-none -mr-4 -mt-4">
                <ShieldAlert className="h-32 w-32" aria-hidden="true" />
              </div>
              <div className="mb-5 flex items-center gap-3 relative z-10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <h2 className="font-semibold text-foreground">Recommendation</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground relative z-10">
                {result.recommendation}
              </p>
              <div className="mt-6 pt-5 border-t border-white/5 relative z-10 flex justify-between items-center text-xs text-muted-foreground">
                <span>Verified by TruthLens</span>
                <span>
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  }).format(new Date(result.analyzed_at))}
                </span>
              </div>
            </Card>
          </Reveal>
        </div>
      </div>

      {/* Accordion Details */}
      <Reveal delay={0.6}>
        <TechnicalDetails result={result} />
      </Reveal>
    </div>
  );
}
