/**
 * Results Page.
 *
 * Hosts the ResultsClient component which fetches and renders the outcome
 * of a completed analysis job. Wrapped in a React Suspense boundary because
 * the child component reads from the URL search params.
 */

import type { Metadata } from "next";
import { Suspense } from "react";

import { ResultsClient } from "./results-client";

export const metadata: Metadata = {
  title: "Results",
  description: "Review the TruthLens AI analysis report interface."
};

export default function ResultsPage() {
  return (
    <section className="min-h-screen px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <Suspense fallback={null}>
        <ResultsClient />
      </Suspense>
    </section>
  );
}
