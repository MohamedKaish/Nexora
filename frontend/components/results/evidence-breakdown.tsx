"use client";

import { memo } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import type { AnalysisResult, EvidenceItem } from "@/types/analysis";

type EvidenceBreakdownProps = {
  result: AnalysisResult;
};

function StatusIcon({ status }: { status: EvidenceItem["status"] }) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    case "critical":
      return <XCircle className="h-4 w-4 text-rose-400" />;
    case "info":
    default:
      return <Info className="h-4 w-4 text-sky-400" />;
  }
}

function StatusColor({ status }: { status: EvidenceItem["status"] }) {
  switch (status) {
    case "success":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "warning":
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "critical":
      return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    case "info":
    default:
      return "text-sky-400 bg-sky-500/10 border-sky-500/20";
  }
}

function EvidenceBreakdownComponent({ result }: EvidenceBreakdownProps) {
  return (
    <Card className="p-6 overflow-hidden relative bg-black/40 border-white/5">
      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          Evidence Breakdown
        </h2>
      </div>
      
      <div className="space-y-4">
        {result.evidence_breakdown.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex flex-col gap-1 p-3 rounded-xl border border-white/5 bg-white/[0.02]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon status={item.status} />
                <span className="font-semibold text-foreground text-sm">{item.title}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${StatusColor({ status: item.status })}`}>
                {item.score.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground ml-6 leading-relaxed">
              {item.explanation}
            </p>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

export const EvidenceBreakdown = memo(EvidenceBreakdownComponent);
