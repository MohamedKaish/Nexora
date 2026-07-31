/**
 * Section Component.
 *
 * Standardized section wrapper for consistent vertical padding and max-width clamping.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  className?: string;
  children: ReactNode;
};

export function Section({ id, className, children }: SectionProps) {
  return (
    <section id={id} className={cn("relative px-4 py-20 sm:px-6 lg:px-8 lg:py-28", className)}>
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </section>
  );
}
