"use client";

import { Activity, Download, FileText, Gauge, ShieldAlert, ShieldCheck, Timer, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getReportUrl } from "@/lib/api";
import type { AnalysisResult, ResultMetric } from "@/types/analysis";

type ResultsDashboardProps = {
  result: AnalysisResult;
};

export function ResultsDashboard({ result }: ResultsDashboardProps) {
  const metrics: ResultMetric[] = [
    { label: "Result", value: result.result, helper: result.result === "Fake" ? "Deepfake detected" : "Authentic media" },
    { label: "Confidence Score", value: `${result.confidence_score.toFixed(2)}%`, helper: "Model confidence" },
    { label: "Manipulation Probability", value: `${result.manipulation_probability.toFixed(2)}%`, helper: "Average fake probability" }
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Analysis Results</p>
          <h1 className="mt-4 text-3xl font-bold tracking-normal text-foreground sm:text-5xl">
            {result.result === "Fake" ? "Deepfake Detected" : "Authentic Video"}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            TruthLens AI analyzed sampled face frames from the uploaded video and averaged the model predictions across the clip.
          </p>
        </div>
        <Button asChild size="lg" variant="secondary">
          <a href={getReportUrl(result.id)} download>
            <Download className="h-5 w-5" />
            Download Report
          </a>
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-6">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-4 text-4xl font-bold text-foreground">{metric.value}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-primary">{metric.helper}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Analysis Status</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">Complete</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-4">
            <ResultRow icon={FileText} label="File Name" value={result.file_name} />
            <ResultRow icon={Timer} label="Analysis Time" value={`${result.analysis_time_seconds.toFixed(2)}s`} />
            <ResultRow icon={Activity} label="Frames Analyzed" value={String(result.frames_analyzed)} />
            <ResultRow icon={Gauge} label="Model Name" value={result.model_name} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Recommendation</h2>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">{result.recommendation}</p>
          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-medium text-foreground">Analysis Date</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
                timeStyle: "short"
              }).format(new Date(result.analyzed_at))}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

type ResultRowProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

function ResultRow({ icon: Icon, label, value }: ResultRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
        <span className="mt-1 block break-words text-sm font-medium text-foreground">{value}</span>
      </span>
    </div>
  );
}
