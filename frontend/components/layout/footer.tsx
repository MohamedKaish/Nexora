/**
 * Footer Component.
 *
 * Renders the global application footer with brand information,
 * navigation links, and security/compliance badges.
 */

import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Lock, Cpu, FileCode2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/40 backdrop-blur-xl px-4 py-12 sm:px-6 lg:px-8" role="contentinfo">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 pb-12 border-b border-white/5">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Image src="/favicon.svg" alt="TruthLens AI Logo" width={28} height={28} aria-hidden="true" />
              <span className="font-bold text-base tracking-tight text-foreground">TruthLens AI</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground max-w-xs">
              Enterprise-grade deepfake video detection and media authenticity analysis platform powered by PyTorch ResNeXt architecture.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
              <Lock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>AES-256 Encrypted Reports</span>
            </div>
          </div>

          {/* Platform Col */}
          <nav aria-label="Platform navigation">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/analyze" className="transition hover:text-foreground">Video Authenticity Scanner</Link>
              </li>
              <li>
                <Link href="/#technology" className="transition hover:text-foreground">Model Architecture</Link>
              </li>
              <li>
                <Link href="/#about" className="transition hover:text-foreground">Research Methodology</Link>
              </li>
            </ul>
          </nav>

          {/* Technology Col */}
          <nav aria-label="Core engine technologies">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Core Engine</h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                <span>PyTorch ResNeXt-101 32x8d</span>
              </li>
              <li className="flex items-center gap-1.5">
                <FileCode2 className="h-3.5 w-3.5 text-violet-400" aria-hidden="true" />
                <span>FastAPI Backend Pipeline</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                <span>ReportLab PDF Generator</span>
              </li>
            </ul>
          </nav>

          {/* Compliance & Security Col */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Security & Integrity</h4>
            <p className="text-xs leading-relaxed text-muted-foreground mb-3">
              Built for secure content verification workflows, research auditability, and forensic-grade verification.
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-sky-200" title="Security compliance standard">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>SOC2 Type II Compliant Architecture</span>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} TruthLens AI. All rights reserved. Commercial Deepfake Detection Platform.</p>
          <nav className="flex items-center gap-6" aria-label="Legal navigation">
            <Link href="/#privacy" className="transition hover:text-foreground">Privacy Policy</Link>
            <Link href="/#terms" className="transition hover:text-foreground">Terms of Service</Link>
            <Link href="/#security" className="transition hover:text-foreground">Security Overview</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
