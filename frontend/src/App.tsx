import { useEffect, useState } from "react";
import type React from "react";
import { ProgressView } from "./components/ProgressView";
import { ReportView } from "./components/ReportView";
import { useJobPolling } from "./hooks/useJobPolling";
import {
  ApiError,
  cancelAnalysis,
  createAnalysis,
  getReport,
  isMockEnabled,
  isMockSupported,
  setMockEnabled,
} from "./lib/api";
import type { AppView, Report } from "./types";

export function App() {
  // State machine core state
  const [view, setView] = useState<AppView>("submit");
  const [jobId, setJobId] = useState<string | null>(null);
  const [submittedUrl, setSubmittedUrl] = useState<string>("");
  const [submittedDescription, setSubmittedDescription] = useState<string>("");
  const [report, setReport] = useState<Report | null>(null);

  // Demo mode toggle state
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => isMockEnabled());
  const showDemoToggle = isMockSupported();

  // Form input local state
  const [urlInput, setUrlInput] = useState<string>(
    "https://shop-demo.example.com/checkout"
  );
  const [descriptionInput, setDescriptionInput] = useState<string>(
    "Checkout button is clipped and unresponsive on mobile screens."
  );

  // Aux state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<ApiError | Error | null>(null);

  // Custom polling hook
  const { job, reset: resetPolling } = useJobPolling(jobId);

  // When job reaches "completed" status in progress view, fetch report and switch to "report"
  useEffect(() => {
    if (view !== "progress" || job?.status !== "completed" || !jobId || report) {
      return;
    }

    let isCurrent = true;

    const loadReport = async () => {
      try {
        const fetchedReport = await getReport(jobId);
        if (isCurrent) {
          setReport(fetchedReport);
          setView("report");
        }
      } catch (err) {
        if (isCurrent) {
          setSubmitError(err instanceof Error ? err : new Error(String(err)));
          setView("submit");
        }
      }
    };

    void loadReport();

    return () => {
      isCurrent = false;
    };
  }, [view, job?.status, jobId, report]);

  // Handler: Submit analysis
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const trimmedUrl = urlInput.trim();
      const trimmedDesc = descriptionInput.trim();
      const response = await createAnalysis(trimmedUrl, trimmedDesc);

      setJobId(response.jobId);
      setSubmittedUrl(trimmedUrl);
      setSubmittedDescription(trimmedDesc);
      setReport(null);
      setView("progress");
    } catch (err) {
      setSubmitError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Cancel and start over from progress
  const handleCancelAndReset = async () => {
    if (jobId) {
      try {
        await cancelAnalysis(jobId);
      } catch {
        // Ignore cancel errors during reset
      }
    }
    resetAll();
  };

  // Handler: Analyze another page from report view
  const handleAnalyzeAnother = () => {
    resetAll();
  };

  // Reset all state to clean submit view
  const resetAll = () => {
    setJobId(null);
    setSubmittedUrl("");
    setSubmittedDescription("");
    setReport(null);
    setSubmitError(null);
    resetPolling();
    setView("submit");
  };

  const handleToggleDemo = () => {
    const next = !isDemoMode;
    setIsDemoMode(next);
    setMockEnabled(next);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white overflow-x-hidden w-full">
      {/* Top Bar */}
      <header
        role="banner"
        className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span
              className="text-xl text-sky-400 font-bold select-none flex-shrink-0"
              aria-hidden="true"
            >
              ◈
            </span>
            <span className="font-semibold tracking-tight text-slate-100 text-sm sm:text-base truncate">
              Visual Debugging Assistant
            </span>
            <span className="hidden md:inline text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              v1.0
            </span>
          </div>

          {/* Right Controls: Demo Mode & View State */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs flex-shrink-0">
            {/* Demo Mode Toggle (visible when VITE_USE_MOCK=true) */}
            {showDemoToggle && (
              <div
                className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800"
                title="Toggle between in-memory mock pipeline and live backend API"
              >
                <span className="text-[11px] font-mono text-slate-400 hidden xs:inline">
                  Demo mode
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDemoMode}
                  aria-label="Toggle Demo Mock Mode"
                  onClick={handleToggleDemo}
                  className={`relative inline-flex h-4 w-7 sm:w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                    isDemoMode ? "bg-sky-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isDemoMode ? "translate-x-3.5 sm:translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )}

            {/* View State Pill */}
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400"
            >
              <span
                className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">State:</span>
              <span className="font-mono font-semibold text-slate-200 capitalize">
                {view}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        role="main"
        className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex flex-col"
      >
        {/* VIEW 1: SUBMIT */}
        {view === "submit" && (
          <div
            key="submit"
            className="animate-fade-in flex flex-col gap-8 max-w-2xl mx-auto w-full my-auto"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800 text-sky-400 text-xs font-medium mb-1">
                <span>⚡ Automated Sandbox Diagnostics</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
                Inspect and Diagnose Visual Bugs
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                Submit any target webpage and describe observed defects. Our headless
                sandbox will inspect DOM anomalies, console faults, and layout shifts.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5"
            >
              {submitError && (
                <div
                  role="alert"
                  className="p-4 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-sm flex items-start gap-3 animate-fade-in"
                >
                  <span
                    className="text-red-400 text-base font-bold select-none"
                    aria-hidden="true"
                  >
                    ⚠
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-red-300">
                      {submitError instanceof ApiError
                        ? `Error (${submitError.code})`
                        : "Submission Failed"}
                    </p>
                    <p className="text-xs text-red-200/90 mt-0.5">
                      {submitError.message}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="url-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Target Webpage URL
                </label>
                <div className="relative">
                  <input
                    id="url-input"
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/checkout"
                    required
                    disabled={isSubmitting}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition-colors disabled:opacity-60"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                  <span>Quick presets:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setUrlInput("https://shop-demo.example.com/checkout")
                    }
                    className="text-sky-400 hover:text-sky-300 hover:underline focus-visible:ring-1 focus-visible:ring-sky-500 rounded px-1"
                  >
                    Demo URL
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setUrlInput("http://localhost:3000/broken")}
                    className="text-amber-400 hover:text-amber-300 hover:underline focus-visible:ring-1 focus-visible:ring-amber-500 rounded px-1"
                  >
                    Test Localhost (UNSAFE_URL)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="desc-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Issue Description &amp; Symptoms
                </label>
                <textarea
                  id="desc-input"
                  rows={3}
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="Describe the visual defect, clipped element, or unexpected behavior..."
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 transition-colors resize-none disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !urlInput.trim()}
                className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-sky-500/10 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
              >
                {isSubmitting ? (
                  <>
                    <span
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    <span>Initiating Analysis...</span>
                  </>
                ) : (
                  <>
                    <span>Run Visual Analysis</span>
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 2: PROGRESS */}
        {view === "progress" && (
          <ProgressView
            job={job}
            url={submittedUrl}
            description={submittedDescription}
            onCancel={handleCancelAndReset}
            onRetry={handleCancelAndReset}
            onRetryAnalysis={() => {
              void handleSubmit();
            }}
          />
        )}

        {/* VIEW 3: REPORT */}
        {view === "report" && report && (
          <ReportView report={report} onReset={handleAnalyzeAnother} />
        )}
      </main>

      {/* Footer */}
      <footer
        role="contentinfo"
        className="border-t border-slate-900 py-4 text-center text-xs text-slate-600 px-4"
      >
        Visual Debugging Assistant &bull; Pair Programming &bull; GDGC Hackathon
      </footer>
    </div>
  );
}

export default App;
