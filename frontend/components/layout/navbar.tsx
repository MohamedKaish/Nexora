"use client";

/**
 * Navbar Component.
 *
 * Provides primary application navigation, dynamic glassmorphism on scroll,
 * and quick access to the analysis tool.
 *
 * Sprint 4: Add UserMenu / Auth status when authentication is integrated.
 * Sprint 8: Add billing status or organization selector for enterprise users.
 */

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Analyze Media", href: "/analyze" },
  { label: "Technology", href: "/#technology" },
  { label: "Architecture", href: "/#about" }
];

export function Navbar() {
  const { scrollY } = useScroll();
  // Animate the navbar slightly upwards and increase opacity/border when scrolling down
  const y = useTransform(scrollY, [0, 120], [0, -2]);
  const background = useTransform(
    scrollY,
    [0, 120],
    ["rgba(6, 8, 14, 0.55)", "rgba(6, 8, 14, 0.88)"]
  );
  const borderColor = useTransform(
    scrollY,
    [0, 120],
    ["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.16)"]
  );

  return (
    <motion.header className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6 lg:px-8" style={{ y }}>
      <motion.nav
        className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-2xl transition-colors"
        style={{ background, borderColor }}
        aria-label="Primary navigation"
      >
        <Link href="/" className="flex items-center gap-3 group" aria-label="TruthLens AI home">
          <div className="relative flex items-center justify-center">
            <Image src="/favicon.svg" alt="TruthLens AI" width={32} height={32} priority />
            <div className="absolute -inset-1 rounded-full bg-primary/20 opacity-0 blur group-hover:opacity-100 transition duration-500" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
              TruthLens <span className="text-primary font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">AI</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-1 md:flex" role="list">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3.5 py-2 text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-white/[0.06] hover:text-foreground"
              role="listitem"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right side operational status & quick CTA */}
        <div className="flex items-center gap-3">
          <div 
            className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400"
            role="status"
            aria-label="System status: Operational"
          >
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>System Operational</span>
          </div>

          <Button asChild size="sm" className="rounded-xl font-semibold shadow-glow">
            <Link href="/analyze" aria-label="Start analysis">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Start Analysis</span>
              <span className="sm:hidden">Analyze</span>
            </Link>
          </Button>
        </div>
      </motion.nav>
    </motion.header>
  );
}
