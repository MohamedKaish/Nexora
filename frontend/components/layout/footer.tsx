import Link from "next/link";
import { GitBranch } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-foreground">TruthLens AI</p>
          <p>Version 1.0 · Made for AI Research</p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-3" aria-label="Footer navigation">
          <a href="https://github.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition hover:text-foreground">
            <GitBranch className="h-4 w-4" />
            GitHub
          </a>
          <Link href="/#privacy" className="transition hover:text-foreground">Privacy Policy</Link>
          <Link href="/#terms" className="transition hover:text-foreground">Terms</Link>
          <Link href="/#contact" className="transition hover:text-foreground">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
