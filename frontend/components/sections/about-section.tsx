import { Shield, Sparkles, Workflow } from "lucide-react";

/**
 * AboutSection Component.
 *
 * Outlines the core product principles of TruthLens AI, emphasizing
 * trustworthy design, modularity, and premium interaction.
 */

import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";

const principles = [
  { icon: Shield, label: "Trustworthy by design", copy: "Clear product boundaries, careful evidence presentation, and confidence surfaces built for serious review." },
  { icon: Workflow, label: "Modular foundation", copy: "Clear boundaries between interface, orchestration, services, reports, and future model artifacts." },
  { icon: Sparkles, label: "Premium interaction", copy: "Motion and glass surfaces support focus without turning the product into visual noise." }
];

export function AboutSection() {
  return (
    <Section id="about" className="pt-4" aria-labelledby="about-heading">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">About</p>
          <h2 id="about-heading" className="mt-4 text-3xl font-bold tracking-normal text-foreground sm:text-5xl">
            A verification workspace with restraint.
          </h2>
        </Reveal>
        <div className="grid gap-4" role="list" aria-label="Core principles">
          {principles.map((principle, index) => {
            const Icon = principle.icon;
            return (
              <Reveal key={principle.label} delay={index * 0.08} className="rounded-2xl border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl">
                <div className="flex gap-4" role="listitem">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-primary" aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{principle.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{principle.copy}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
