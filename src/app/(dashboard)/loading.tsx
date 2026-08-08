import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-primary/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          <Loader2 className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <p className="text-sm font-medium tracking-tight text-muted-foreground animate-pulse">
          Loading module...
        </p>
      </div>
    </div>
  )
}
