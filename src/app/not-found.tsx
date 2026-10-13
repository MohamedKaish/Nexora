import Link from 'next/link'
import { NexoraLogo } from '@/components/brand/NexoraLogo'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-950 text-foreground flex flex-col items-center justify-center p-6 text-center selection:bg-amber-400 selection:text-stone-950">
      {/* Background Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-md w-full space-y-6">
        <div className="flex justify-center">
          <Link href="/dashboard" className="hover:opacity-90 transition-opacity">
            <NexoraLogo size={52} />
          </Link>
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 font-mono text-xs font-bold border border-amber-400/25">
            <Compass className="w-3.5 h-3.5" />
            <span>Horizon Not Found • 404</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-100">
            Lost in the Sanctuary
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
            The path you followed does not lead to an active quest horizon or habitat chamber. Let us navigate back to your productivity matrix.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,168,83,0.35)] transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Return to Sanctuary World</span>
          </Link>
          <Link
            href="/tasks"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-stone-100 font-semibold text-xs transition-colors cursor-pointer"
          >
            <span>View Tasks Matrix</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
