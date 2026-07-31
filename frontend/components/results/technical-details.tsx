"use client";

import { memo, useState } from "react";
import { ChevronDown, Code2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import type { AnalysisResult } from "@/types/analysis";

type TechnicalDetailsProps = {
  result: AnalysisResult;
};

function TechnicalDetailsComponent({ result }: TechnicalDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="overflow-hidden bg-black/40 border-white/5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 transition-colors hover:bg-white/[0.02]"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Code2 className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Technical Details (Raw JSON)
          </h2>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="border-t border-white/5 p-6 bg-black/50 overflow-x-auto">
              <pre className="text-xs text-muted-foreground font-mono leading-relaxed">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export const TechnicalDetails = memo(TechnicalDetailsComponent);
