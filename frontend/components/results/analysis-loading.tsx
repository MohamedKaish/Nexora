"use client";

import { Loader2, ShieldCheck, Activity, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnalysisStatusResponse } from "@/types/analysis";

type AnalysisLoadingProps = {
  statusResponse: AnalysisStatusResponse | null;
};

export function AnalysisLoading({ statusResponse }: AnalysisLoadingProps) {
  const progress = statusResponse?.progress ?? 0;
  const message = statusResponse?.message ?? "Connecting to secure enclave...";
  const status = statusResponse?.status ?? "queued";

  // Visual cues based on status
  let Icon = Loader2;
  let colorClass = "text-primary";
  let bgClass = "bg-primary/10";
  let borderClass = "border-primary/25";

  if (["file_validation", "metadata_extraction", "frame_extraction"].includes(status)) {
    Icon = Activity;
    colorClass = "text-violet-400";
    bgClass = "bg-violet-500/10";
    borderClass = "border-violet-500/25";
  } else if (["image_preprocessing", "heuristic_analysis", "ai_inference", "confidence_calculation"].includes(status)) {
    Icon = BrainCircuit;
    colorClass = "text-sky-400";
    bgClass = "bg-sky-500/10";
    borderClass = "border-sky-500/25";
  } else if (["evidence_generation", "risk_classification", "final_report_generation"].includes(status)) {
    Icon = ShieldCheck;
    colorClass = "text-emerald-400";
    bgClass = "bg-emerald-500/10";
    borderClass = "border-emerald-500/25";
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center min-h-[50vh] px-4">
      <div 
        className="w-full rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center shadow-glass backdrop-blur-xl relative overflow-hidden"
        role="status" 
        aria-live="polite"
      >
        <div className="absolute inset-0 bg-mesh opacity-30" aria-hidden="true" />
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        <div className="relative z-10 flex flex-col items-center gap-8">
          <motion.div
            key={status} // re-animate on status change
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex h-20 w-20 items-center justify-center rounded-2xl border ${borderClass} ${bgClass} ${colorClass} shadow-glow`}
            aria-hidden="true"
          >
            <motion.div
              animate={{ rotate: ["evidence_generation", "risk_classification", "final_report_generation"].includes(status) ? 0 : 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Icon className="h-10 w-10" strokeWidth={1.5} />
            </motion.div>
          </motion.div>

          <div className="w-full space-y-4">
            <div className="flex items-end justify-between px-1">
              <div className="flex flex-col items-start text-left">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</span>
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={message}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -5, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`mt-1 text-base font-medium ${colorClass}`}
                  >
                    {message}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Progress</span>
                <span className={`mt-1 font-mono text-xl font-bold ${colorClass}`}>
                  {progress}%
                </span>
              </div>
            </div>
            
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/5" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-full ${["file_validation", "metadata_extraction", "frame_extraction"].includes(status) ? 'bg-violet-400' : ["image_preprocessing", "heuristic_analysis", "ai_inference", "confidence_calculation"].includes(status) ? 'bg-sky-400' : ["evidence_generation", "risk_classification", "final_report_generation"].includes(status) ? 'bg-emerald-400' : 'bg-primary'}`}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>

          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            Cryptographic verification and neural analysis in progress. 
            Please keep this page open until the forensic report is generated.
          </p>
        </div>
      </div>
    </div>
  );
}
