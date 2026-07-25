import type { Metadata } from "next";

import { AnalyzeUploadZone } from "@/components/analyze-upload-zone";

export const metadata: Metadata = {
  title: "Analyze",
  description: "Prepare video and voice files for future TruthLens AI authenticity analysis."
};

export default function AnalyzePage() {
  return (
    <section className="min-h-screen px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <AnalyzeUploadZone />
    </section>
  );
}

