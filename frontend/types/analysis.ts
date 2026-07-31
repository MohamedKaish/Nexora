/**
 * Shared TypeScript types for the TruthLens AI analysis API.
 * These types mirror the Pydantic schemas in backend/schemas/analysis.py.
 */

export type AnalysisStage =
  | "queued"
  | "file_validation"
  | "metadata_extraction"
  | "frame_extraction"
  | "image_preprocessing"
  | "heuristic_analysis"
  | "ai_inference"
  | "confidence_calculation"
  | "evidence_generation"
  | "risk_classification"
  | "final_report_generation"
  | "complete"
  | "failed";

export const TERMINAL_STAGES: ReadonlySet<AnalysisStage> = new Set([
  "complete",
  "failed",
] as const);

export const ACTIVE_STAGES: ReadonlySet<AnalysisStage> = new Set([
  "queued",
  "file_validation",
  "metadata_extraction",
  "frame_extraction",
  "image_preprocessing",
  "heuristic_analysis",
  "ai_inference",
  "confidence_calculation",
  "evidence_generation",
  "risk_classification",
  "final_report_generation"
] as const);

export type EvidenceItem = {
  title: string;
  score: number;
  status: "critical" | "warning" | "info" | "success";
  explanation: string;
};

export type AnalysisResult = {
  id: string;
  file_name: string;
  result: "Real" | "Fake";

  confidence_score: number;
  manipulation_probability: number;
  ai_confidence: number;
  heuristic_confidence: number;
  evidence_strength: string;
  risk_level: string;
  reliability_score: number;

  executive_summary: string;
  evidence_breakdown: EvidenceItem[];
  technical_metrics: Record<string, number>;
  frame_statistics: Record<string, number>;
  model_information: Record<string, string>;

  analysis_time_seconds: number;
  frames_analyzed: number;
  model_name: string;

  risk_explanation: string;
  confidence_explanation: string;
  recommendation: string;
  forensic_notes: string;

  analyzed_at: string;
};

export type AnalyzeResponse = {
  id: string;
  status: AnalysisStage;
  message: string;
};

export type AnalysisStatusResponse = {
  id: string;
  status: AnalysisStage;
  progress: number;
  message: string;
  result: AnalysisResult | null;
  error: string | null;
};
