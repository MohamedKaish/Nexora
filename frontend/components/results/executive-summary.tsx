"use client";

import { memo } from "react";
import { Activity, Clock, Cpu, ShieldCheck, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { AnalysisResult } from "@/types/analysis";

type ExecutiveSummaryProps = {
  result: AnalysisResult;
};

function ExecutiveSummaryComponent({ result }: ExecutiveSummaryProps) {
  const evidenceStrength = result.confidence_score >= 80 ? "Strong" : result.confidence_score >= 60 ? "Moderate" : "Inconclusive";

  const descriptiveLabel = result.risk_level === "Critical" 
    ? "Likely Deepfake" 
    : result.risk_level === "Elevated" 
      ? "Suspicious" 
      : "Likely Real";

  const getVerdictColor = (label: string) => {
    if (label === "Likely Deepfake") return "text-rose-400";
    if (label === "Suspicious") return "text-amber-400";
    return "text-emerald-400";
  };

  const getVerdictText = (label: string) => {
    if (label === "Likely Deepfake") return "Synthetic manipulation detected";
    if (label === "Suspicious") return "Anomalies require manual verification";
    return "No significant manipulation detected";
  };

  return (
    <Card className="overflow-hidden bg-black/40 p-0 border-white/5">
      <div className="border-b border-white/5 bg-white/[0.02] px-6 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Executive Summary
        </h2>
      </div>
      <div className="grid divide-y divide-white/5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-6 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-2">Final Classification</p>
          <p className={`text-2xl font-bold ${getVerdictColor(descriptiveLabel)}`}>
            {descriptiveLabel}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {getVerdictText(descriptiveLabel)}
          </p>
        </div>
        <div className="p-6 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-2">Evidence Strength</p>
          <p className="text-2xl font-bold text-foreground">
            {evidenceStrength}
          </p>
          <p className="text-sm text-primary mt-1">
            {result.confidence_score.toFixed(1)}% Confidence
          </p>
        </div>
        <div className="p-6 flex flex-col justify-center gap-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-primary/70" />
              Processing Time
            </span>
            <span className="font-mono text-sm text-foreground">{result.analysis_time_seconds.toFixed(2)}s</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 text-primary/70" />
              Frames Analyzed
            </span>
            <span className="font-mono text-sm text-foreground">{result.frames_analyzed}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Cpu className="h-4 w-4 text-primary/70" />
              Model Architecture
            </span>
            <span className="text-xs font-medium text-foreground truncate max-w-[120px]" title={result.model_name}>
              {result.model_name.split(' ')[0]}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export const ExecutiveSummary = memo(ExecutiveSummaryComponent);
