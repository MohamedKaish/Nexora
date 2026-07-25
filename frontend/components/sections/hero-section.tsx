"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, PlayCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

const particles = Array.from({ length: 22 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  top: `${(index * 23) % 86}%`,
  delay: (index % 7) * 0.32,
  duration: 5 + (index % 5)
}));

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-4 pb-16 pt-32 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-mesh" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,7,13,0)_0%,rgba(5,7,13,.24)_66%,#05070d_100%)]" />

      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute h-1 w-1 rounded-full bg-primary/70 shadow-glow"
          style={{ left: particle.left, top: particle.top }}
          animate={{ y: [-12, 16, -12], opacity: [0.25, 0.9, 0.25], scale: [0.8, 1.25, 0.8] }}
          transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      <div className="relative mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm text-muted-foreground backdrop-blur-xl">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Authenticity verification for high-trust media workflows
          </div>
          <h1 className="text-[clamp(4rem,13vw,9.5rem)] font-black leading-[0.88] tracking-normal text-foreground">
            TruthLens AI
          </h1>
          <p className="mt-7 max-w-3xl text-[clamp(1.35rem,3vw,2.25rem)] font-semibold leading-tight text-sky-100">
            Detect Deepfake Videos and AI Voices with Confidence.
          </p>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            TruthLens AI helps teams evaluate suspicious video and voice content through a secure, research-ready verification workspace built for clarity, privacy, and trust.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/analyze">
                <PlayCircle className="h-5 w-5" />
                Start Analysis
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="#technology">
                <ArrowDown className="h-5 w-5" />
                Learn More
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="glass-line relative min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-6 shadow-glass backdrop-blur-2xl"
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-x-8 top-16 h-px bg-gradient-to-r from-transparent via-primary to-transparent shadow-glow" />
          <div className="absolute inset-y-10 left-1/2 w-px bg-gradient-to-b from-transparent via-violet-400/70 to-transparent" />
          <motion.div
            className="absolute left-10 right-10 top-20 h-20 rounded-xl border border-primary/25 bg-primary/10"
            animate={{ y: [0, 210, 0], opacity: [0.45, 0.9, 0.45] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative grid h-full grid-cols-2 gap-4">
            {["Video integrity", "Voice pattern", "Frame timeline", "Report preview"].map((label, index) => (
              <motion.div
                key={label}
                className="rounded-xl border border-white/10 bg-black/20 p-5"
                animate={{ y: index % 2 === 0 ? [0, -10, 0] : [0, 10, 0] }}
                transition={{ duration: 6 + index, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="mb-5 h-2 w-16 rounded-full bg-white/15" />
                <div className="h-24 rounded-lg bg-gradient-to-br from-primary/20 via-white/[0.05] to-violet-500/20" />
                <p className="mt-4 text-sm font-medium text-sky-100">{label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

