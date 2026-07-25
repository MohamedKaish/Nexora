"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Analyze", href: "/analyze" },
  { label: "Technology", href: "/#technology" },
  { label: "About", href: "/#about" }
];

export function Navbar() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 120], [0, -4]);
  const borderOpacity = useTransform(scrollY, [0, 120], [0.08, 0.2]);
  const background = useTransform(
    scrollY,
    [0, 120],
    ["rgba(5, 7, 13, 0.45)", "rgba(5, 7, 13, 0.82)"]
  );
  const borderColor = useTransform(borderOpacity, (value) => `rgba(255,255,255,${value})`);

  return (
    <motion.header className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6" style={{ y }}>
      <motion.nav
        className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-4 py-3 shadow-glass backdrop-blur-2xl"
        style={{ background, borderColor }}
        aria-label="Primary navigation"
      >
        <Link href="/" className="flex items-center gap-3" aria-label="TruthLens AI home">
          <Image src="/favicon.svg" alt="" width={34} height={34} priority />
          <span className="hidden text-sm font-bold tracking-wide text-foreground sm:inline">TruthLens AI</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://github.com/"
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>

        <Button asChild size="sm">
          <Link href="/analyze">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Start Analysis</span>
            <span className="sm:hidden">Start</span>
          </Link>
        </Button>
      </motion.nav>
    </motion.header>
  );
}
