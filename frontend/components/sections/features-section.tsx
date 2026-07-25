"use client";

import { motion } from "framer-motion";
import { FileText, Gauge, LockKeyhole, Video } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";

const features = [
  {
    icon: Video,
    title: "Video Deepfake Detection",
    description: "A focused interface for future frame-level video authenticity analysis and review workflows."
  },
  {
    icon: Gauge,
    title: "Model Confidence Scoring",
    description: "Frame-level model predictions are averaged into clear confidence and manipulation probability signals."
  },
  {
    icon: FileText,
    title: "Detailed AI Reports",
    description: "Premium report surfaces that will support timeline evidence, confidence metrics, and export-ready summaries."
  },
  {
    icon: LockKeyhole,
    title: "Privacy First",
    description: "A foundation shaped around secure handling, restrained data surfaces, and trustworthy product behavior."
  }
];

export function FeaturesSection() {
  return (
    <Section id="technology">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Technology</p>
        <h2 className="mt-4 text-3xl font-bold tracking-normal text-foreground sm:text-5xl">
          Built for serious media verification.
        </h2>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          Phase 1 defines the product-quality surfaces that future detection engines will plug into without compromising clarity or trust.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <Reveal key={feature.title} delay={index * 0.08}>
              <motion.div whileHover={{ y: -8, scale: 1.015 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
                <Card className="group h-full overflow-hidden">
                  <CardHeader>
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition group-hover:border-primary/45 group-hover:shadow-glow">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
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

