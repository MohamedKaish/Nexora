"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function InitialLoader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasLoaded = window.sessionStorage.getItem("truthlens-initialized");

    if (hasLoaded) {
      return;
    }

    setVisible(true);
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem("truthlens-initialized", "true");
      setVisible(false);
    }, 2300);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          role="status"
          aria-label="Loading TruthLens AI"
        >
          <div className="absolute inset-0 bg-mesh opacity-90" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-70 shadow-glow animate-scan" />
          <motion.div
            className="relative flex w-[min(88vw,420px)] flex-col items-center gap-8"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              animate={{ scale: [1, 1.03, 1], filter: ["drop-shadow(0 0 18px rgba(36,212,255,.35))", "drop-shadow(0 0 34px rgba(139,92,246,.42))", "drop-shadow(0 0 18px rgba(36,212,255,.35))"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image src="/app-icon.svg" alt="TruthLens AI" width={104} height={104} priority />
            </motion.div>
            <div className="w-full space-y-4 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">TruthLens AI</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-sky-300 to-violet-400"
                  initial={{ width: "8%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.1, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="text-sm text-muted-foreground">Calibrating secure analysis workspace</p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

