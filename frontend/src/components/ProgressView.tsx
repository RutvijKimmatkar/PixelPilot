import type React from "react";
import type { ErrorCode, Job, JobStep, StepId } from "../types";

export interface ProgressViewProps {
  job: Job | null;
  url: string;
  description: string;
  onCancel: () => void;
  onRetry: () => void;
  onRetryAnalysis?: () => void;
}

const DEFAULT_STEPS: { id: StepId; label: string }[] = [
  { id: "validate", label: "URL validated" },
  { id: "launch", label: "Opening isolated browser" },
  { id: "desktop", label: "Capturing desktop view" },
  { id: "mobile", label: "Capturing mobile view" },
  { id: "inspect", label: "Inspecting layout and browser logs" },
  { id: "analyze", label: "Generating diagnosis with Gemma" },
  { id: "prompt", label: "Preparing your Antigravity prompt" },
];

function formatUrlHostPath(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    const withProtocol =
      rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
        ? rawUrl
        : `https://${rawUrl}`;
    const parsed = new URL(withProtocol);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${parsed.hostname}${path}`;
  } catch {
    return rawUrl.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  }
}

function getErrorHint(code?: ErrorCode | string): string {
  switch (code) {
    case "TIMEOUT":
      return "The page did not respond in time. Check that it loads without login.";
    case "UNREACHABLE":
      return "We couldn't open this address. Check the URL.";
    case "UNSAFE_URL":
      return "Only public http(s) pages are supported.";
    case "ANALYSIS_FAILED":
      return "The AI analysis failed. Try again.";
    default:
      return "An unexpected error occurred during page analysis. Please try again.";
  }
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  job,
  url,
  description,
  onCancel,
  onRetry,
  onRetryAnalysis,
}) => {
  const isFailed = job?.status === "failed";
  const progress = Math.min(100, Math.max(0, job?.progress ?? 0));

  // Circular ring constants
  const radius = 48;
  const circumference = 2 * Math.PI * radius; // ~301.59
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Compute timeline steps
  const steps: JobStep[] = job?.steps && job.steps.length > 0
    ? job.steps
    : DEFAULT_STEPS.map((s, idx) => ({
        id: s.id,
        label: s.label,
        state: idx === 0 ? "active" : "pending",
      }));

  const formattedTarget = formatUrlHostPath(url);

  return (
    <div className="animate-fade-in flex flex-col gap-6 max-w-2xl mx-auto w-full my-auto transition-all duration-300">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-3">
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Analyzing Target
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-all">
            Analyzing: <span className="text-slate-100">{formattedTarget || "Loading target..."}</span>
          </h2>
        </div>

        {description && (
          <p
            className="text-xs text-slate-300 italic bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 leading-relaxed overflow-hidden"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            &ldquo;{description}&rdquo;
          </p>
        )}
      </div>

      {/* Main Diagnostic Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Top: Circular Progress Ring & Status Line */}
        {!isFailed && (
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800/70">
            {/* Animated SVG Circular Progress Ring */}
            <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Track */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-800/80"
                  strokeWidth="8"
                />
                {/* Animated Progress Indicator */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  className="text-sky-400 transition-[stroke-dashoffset] duration-500 ease-out"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Centered Percentage */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold font-mono tracking-tight text-white transition-all duration-300">
                  {progress}%
                </span>
              </div>
            </div>

            {/* Friendly Status Line & Detail */}
            <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Current Status
              </div>
              <p className="text-sm font-medium text-slate-200 transition-colors duration-300 leading-snug">
                {job?.currentMessage || "Starting up sandbox diagnostics and opening target..."}
              </p>
              <p className="text-xs text-slate-500">
                Headless browser sandbox with visual defect inspection
              </p>
            </div>
          </div>
        )}

        {/* FAILURE STATE: Replaces timeline with failure card */}
        {isFailed ? (
          <div className="animate-fade-in bg-red-950/30 border border-red-800/70 rounded-xl p-6 sm:p-7 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center text-lg font-bold flex-shrink-0">
                ✕
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-bold text-red-200 tracking-tight">
                  We could not analyze this page
                </h3>
                <p className="text-sm text-red-200/90 leading-relaxed font-mono bg-red-950/60 p-3 rounded-lg border border-red-900/60 break-words">
                  {job?.error?.message || "An unexpected error occurred while analyzing the target webpage."}
                </p>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="font-semibold text-amber-400 uppercase tracking-wider text-[10px] block">
                    Diagnostic Hint
                  </span>
                  <p>{getErrorHint(job?.error?.code)}</p>
                </div>
              </div>
            </div>

            {/* Failure Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-red-900/40">
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
              >
                Try another URL
              </button>

              {job?.error?.code === "ANALYSIS_FAILED" && (
                <button
                  type="button"
                  onClick={onRetryAnalysis ? onRetryAnalysis : onRetry}
                  className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-colors shadow-md shadow-sky-500/20 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        ) : (
          /* VERTICAL STEP TIMELINE */
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pipeline Timeline
            </div>

            <div className="relative pl-2">
              {/* Continuous vertical connecting line behind steps */}
              <div
                className="absolute left-[19px] top-3 bottom-5 w-0.5 bg-slate-800 z-0"
                aria-hidden="true"
              />

              <div className="space-y-4 relative z-10">
                {steps.map((step, idx) => {
                  const isDone = step.state === "done";
                  const isActive = step.state === "active";
                  const isFail = step.state === "failed";
                  const isPending = step.state === "pending";

                  return (
                    <div
                      key={step.id || idx}
                      className="flex items-center gap-4 text-sm transition-all duration-300"
                    >
                      {/* Step icon per state */}
                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 bg-slate-900 rounded-full">
                        {isDone && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 flex items-center justify-center text-xs font-bold transition-all duration-300">
                            ✓
                          </div>
                        )}

                        {isActive && (
                          <div className="relative flex items-center justify-center w-5 h-5">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-400 shadow-sm shadow-sky-400/80" />
                          </div>
                        )}

                        {isFail && (
                          <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 border border-red-500/50 flex items-center justify-center text-xs font-bold">
                            ✕
                          </div>
                        )}

                        {isPending && (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-700 bg-transparent transition-colors duration-300" />
                        )}
                      </div>

                      {/* Step label */}
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <span
                          className={`font-medium transition-colors duration-300 ${
                            isActive
                              ? "text-sky-300 font-semibold"
                              : isDone
                              ? "text-slate-200"
                              : isFail
                              ? "text-red-300"
                              : "text-slate-500"
                          }`}
                        >
                          {step.label}
                        </span>

                        <span
                          className={`text-[11px] font-mono uppercase tracking-wider ${
                            isActive
                              ? "text-sky-400 font-bold"
                              : isDone
                              ? "text-emerald-400/80"
                              : isFail
                              ? "text-red-400"
                              : "text-slate-600"
                          }`}
                        >
                          {step.state}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer info & Cancel Action */}
        {!isFailed && (
          <div className="pt-4 border-t border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="text-slate-500">⏱</span>
              <span>This usually takes under a minute.</span>
            </p>

            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-slate-200 py-1.5 px-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950 transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
            >
              Cancel and start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressView;
