"use client";

/**
 * FeaturesSection Component.
 *
 * Details the core technical capabilities of the TruthLens AI platform,
 * using a responsive grid of glassmorphic cards with animated icons.
 */

import { motion } from "framer-motion";
import { Cpu, FileCheck, ShieldCheck, Video } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";

const features = [
  {
    icon: Video,
    title: "Deepfake Video Detection",
    description: "Detect facial synthesis, deep neural artifacts, and frame manipulation using OpenCV frame sampling and face crop extraction.",
    accent: "from-sky-500/20 to-blue-600/20"
  },
  {
    icon: Cpu,
    title: "PyTorch Neural Inference",
    description: "Evaluates frame-level feature maps via PyTorch ResNeXt-101 32x8d classifier to calculate aggregate manipulation probability.",
    accent: "from-violet-500/20 to-purple-600/20"
  },
  {
    icon: FileCheck,
    title: "Forensic PDF Cybersecurity Reports",
    description: "Generate instant enterprise PDF audit reports complete with executive summaries, risk levels, timeline data, and security recommendations.",
    accent: "from-emerald-500/20 to-teal-600/20"
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Privacy & Cleanup",
    description: "Restricted data retention policies, encrypted status polling, and automatic upload file cleanup after analysis completion.",
    accent: "from-amber-500/20 to-orange-600/20"
  }
];

export function FeaturesSection() {
  return (
    <Section id="technology" aria-labelledby="features-heading">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary font-mono">Platform Capabilities</p>
        <h2 id="features-heading" className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Engineered for Media Integrity & Trust
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          State-of-the-art neural detection pipeline built for enterprise security, legal forensics, and digital asset verification.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4" role="list" aria-label="Platform features">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <Reveal key={feature.title} delay={index * 0.08} role="listitem">
              <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 280, damping: 24 }}>
                <Card className="group h-full overflow-hidden glass-card transition-all duration-300">
                  <CardHeader className="p-6">
                    <div 
                      className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br ${feature.accent} text-sky-300 transition group-hover:scale-110 group-hover:border-primary/40 group-hover:shadow-glow`}
                      aria-hidden="true"
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground">{feature.title}</CardTitle>
                    <CardDescription className="mt-2 text-xs leading-relaxed text-muted-foreground">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
