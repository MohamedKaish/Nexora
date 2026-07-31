"use client";

/**
 * HeroSection Component.
 *
 * Renders the main landing page hero with animated background particles
 * and a simulated live AI inference visualization.
 *
 * Sprint 3: Consider adding audio wave visualizations for voice detection hints.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, PlayCircle, ShieldCheck, Sparkles, Cpu } from "lucide-react";

import { Button } from "@/components/ui/button";

// Static particle generation to ensure consistent SSR hydration
const particles = Array.from({ length: 26 }, (_, index) => ({
  id: index,
  left: `${(index * 31) % 100}%`,
  top: `${(index * 19) % 88}%`,
  delay: (index % 6) * 0.4,
  duration: 4 + (index % 5)
}));

export function HeroSection() {
  return (
    <section 
      className="relative flex min-h-[90vh] flex-col justify-center overflow-hidden px-4 pb-20 pt-36 sm:px-6 lg:px-8"
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-0 bg-mesh opacity-80" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#06080e_80%)]" aria-hidden="true" />

      {/* Floating ambient glow particles */}
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute h-1 w-1 rounded-full bg-sky-400/60 shadow-glow pointer-events-none"
          style={{ left: particle.left, top: particle.top }}
          animate={{ y: [-14, 18, -14], opacity: [0.2, 0.85, 0.2], scale: [0.7, 1.3, 0.7] }}
          transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
      ))}

      <div className="relative mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        {/* Left Column: Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold text-sky-300 backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>Commercial AI Deepfake Detection Engine</span>
          </div>

          <h1 id="hero-heading" className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[1.08]">
            Verify Video Authenticity with <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">Neural Precision</span>
          </h1>

          <p className="mt-6 text-base text-muted-foreground sm:text-lg leading-relaxed max-w-2xl">
            TruthLens AI analyzes facial frames, spatial inconsistencies, and deep neural artifacts to deliver forensic-grade verification and instant cybersecurity reports.
          </p>

          {/* Key Value Bullets */}
          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 font-medium" aria-label="Key features">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>PyTorch ResNeXt-101 Deep Model</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>Frame-by-Frame Face Crop Extraction</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>Instant PDF Cybersecurity Audit</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>Private & Encrypted Processing</span>
            </li>
          </ul>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row items-stretch sm:items-center">
            <Button asChild size="lg" className="rounded-xl font-bold shadow-glow text-base px-7">
              <Link href="/analyze" aria-label="Go to the analysis page">
                <PlayCircle className="h-5 w-5" aria-hidden="true" />
                Analyze Media Now
                <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-xl font-medium text-base">
              <Link href="#technology" aria-label="Scroll to technology section">
                <Cpu className="h-5 w-5 text-sky-400" aria-hidden="true" />
                Explore Architecture
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Right Column: Dynamic Interactive AI Mockup */}
        <motion.div
          className="relative rounded-2xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-2xl overflow-hidden glass-line"
          initial={{ opacity: 0, scale: 0.95, y: 28 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true" // Decorative visualization
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
              <span className="ml-2 font-mono text-xs text-muted-foreground">truthlens-inspector-v1.0</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
              LIVE INFERENCE
            </span>
          </div>

          {/* Scanner Viewport Simulation */}
          <div className="relative aspect-video w-full rounded-xl bg-black/60 border border-white/10 overflow-hidden flex flex-col items-center justify-center">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:16px_16px]" />

            {/* Scanning Bar */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-glow animate-scan z-10" />

            {/* Bounding Box Mockup */}
            <motion.div
              className="relative h-28 w-28 rounded-lg border-2 border-dashed border-sky-400 bg-sky-500/10 flex items-center justify-center"
              animate={{ scale: [0.98, 1.02, 0.98] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute -top-3 left-2 font-mono text-[10px] bg-sky-500 text-black px-1.5 py-0.5 rounded font-bold">
                FACE: 99.4%
              </div>
              <Cpu className="h-8 w-8 text-sky-400 animate-pulse" />
            </motion.div>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-black/70 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur">
              <span>MODEL: ResNeXt-101</span>
              <span>FPS: 30</span>
              <span className="text-emerald-400">STATUS: VERIFYING</span>
            </div>
          </div>

          {/* Simulated Real-time Metrics Card Row */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <span className="text-[11px] text-muted-foreground uppercase font-medium">Fake Probability</span>
              <p className="mt-1 text-lg font-bold text-rose-400 font-mono">1.2% (Authentic)</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <span className="text-[11px] text-muted-foreground uppercase font-medium">Confidence Score</span>
              <p className="mt-1 text-lg font-bold text-emerald-400 font-mono">98.8%</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
