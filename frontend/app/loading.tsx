/**
 * Global Loading UI.
 *
 * This Next.js special file automatically wraps page transitions in React Suspense.
 * It provides instant fallback UI while a route is loading its chunks or data.
 */

import Image from "next/image";

export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background" role="status" aria-label="Loading page...">
      <div className="flex flex-col items-center gap-5">
        <Image src="/favicon.svg" alt="TruthLens AI loading" width={56} height={56} aria-hidden="true" />
        <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <div className="h-full w-1/2 animate-scan rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
