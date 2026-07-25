export type AnalysisStatus = "queued" | "processing" | "analyzing" | "generating_report" | "complete" | "failed";

export type ResultMetric = {
  label: string;
  value: string;
  helper: string;
};

export type TimelinePoint = {
  time: string;
  probability: number;
};

export type AnalysisResult = {
  id: string;
  file_name: string;
  result: "Real" | "Fake";
  confidence_score: number;
  manipulation_probability: number;
  analysis_time_seconds: number;
  frames_analyzed: number;
  model_name: string;
  recommendation: string;
  analyzed_at: string;
};

export type AnalyzeResponse = {
  id: string;
  status: AnalysisStatus;
  message: string;
};

export type AnalysisStatusResponse = {
  id: string;
  status: AnalysisStatus;
  progress: number;
  message: string;
  result: AnalysisResult | null;
  error: string | null;
};
