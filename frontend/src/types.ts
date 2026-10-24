export type JobStatus = "queued" | "running" | "completed" | "failed";

export type StepId =
  | "validate"
  | "launch"
  | "desktop"
  | "mobile"
  | "inspect"
  | "analyze"
  | "prompt";

export interface JobStep {
  id: StepId;
  label: string;
  state: "pending" | "active" | "done" | "failed";
}

export type ErrorCode =
  | "UNSAFE_URL"
  | "TIMEOUT"
  | "UNREACHABLE"
  | "ANALYSIS_FAILED"
  | "UNKNOWN";

export interface JobError {
  code: ErrorCode;
  message: string;
}

export interface Job {
  id: string;
  status: JobStatus;
  progress: number; // 0-100
  currentMessage: string;
  steps: JobStep[];
  error?: JobError;
}

export interface Evidence {
  label: string;
  value: string;
  severity?: "info" | "warning" | "error";
}

export interface Report {
  jobId: string;
  url: string;
  issueDescription: string;
  summary: string;
  confidence: "low" | "medium" | "high";
  rootCause: string;
  evidence: Evidence[];
  consoleErrors: string[];
  fixSteps: string[];
  antigravityPrompt: string;
  screenshots: {
    desktop: string;
    mobile: string;
    desktopWidth: number;
    mobileWidth: number;
  };
}

export type AppView = "submit" | "progress" | "report";

export interface CreateAnalysisResponse {
  jobId: string;
}
