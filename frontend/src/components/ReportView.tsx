import { useState } from "react";
import type React from "react";
import type { Evidence, Report } from "../types";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { PromptBox } from "./PromptBox";
import { copyToClipboard } from "../lib/clipboard";
import { ScreenshotCompare } from "./ScreenshotCompare";

export interface ReportViewProps {
  report: Report;
  onReset: () => void;
}

function looksLikeCodeOrCss(val: string): boolean {
  return (
    val.includes(":") ||
    val.includes("px") ||
    val.includes("()") ||
    val.includes("{") ||
    val.includes("}") ||
    val.includes("=") ||
    val.includes("z-index") ||
    val.includes("overflow") ||
    val.includes("TypeError") ||
    val.includes("CLS")
  );
}

function getSeverityBadge(severity?: Evidence["severity"]) {
  switch (severity) {
    case "error":
      return (
        <span
          className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center text-xs font-bold flex-shrink-0"
          title="Error Severity"
        >
          ✕
        </span>
      );
    case "warning":
      return (
        <span
          className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-xs font-bold flex-shrink-0"
          title="Warning Severity"
        >
          ⚠
        </span>
      );
    case "info":
    default:
      return (
        <span
          className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center text-xs font-bold flex-shrink-0"
          title="Information"
        >
          ℹ
        </span>
      );
  }
}

export const ReportView: React.FC<ReportViewProps> = ({ report, onReset }) => {
  const [consoleOpen, setConsoleOpen] = useState<boolean>(true);
  const [mobileCopied, setMobileCopied] = useState<boolean>(false);

  const handleMobileCopy = async () => {
    const success = await copyToClipboard(report.antigravityPrompt);
    if (success) {
      setMobileCopied(true);
      setTimeout(() => setMobileCopied(false), 2000);
    }
  };

  const consoleCount = report.consoleErrors ? report.consoleErrors.length : 0;

  return (
    <div className="animate-fade-in flex flex-col gap-8 w-full max-w-5xl mx-auto pb-16 sm:pb-8">
      {/* 1. HEADER ROW */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sky-400 text-lg font-bold">◈</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Visual Debugging Report
            </h1>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-300 truncate">
            <span className="text-slate-500">Target URL:</span>
            <a
              href={report.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline font-mono text-xs sm:text-sm truncate transition-colors flex items-center gap-1 focus-visible:ring-1 focus-visible:ring-sky-500 focus-visible:outline-none rounded px-1"
              title="Open target URL in new tab"
            >
              <span>{report.url}</span>
              <span className="text-[10px] no-underline">↗</span>
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <ConfidenceBadge confidence={report.confidence} />
        </div>
      </div>

      {/* 2. SUMMARY CARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
        {report.issueDescription && (
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Original Issue Reported
            </span>
            <blockquote className="text-xs sm:text-sm text-slate-400 italic bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed">
              &ldquo;{report.issueDescription}&rdquo;
            </blockquote>
          </div>
        )}

        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
            Diagnosis Summary
          </span>
          <p className="text-lg sm:text-xl font-medium text-slate-100 leading-relaxed">
            {report.summary}
          </p>
        </div>
      </div>

      {/* 3. SCREENSHOT COMPARISON */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <ScreenshotCompare screenshots={report.screenshots} />
      </div>

      {/* 4. LIKELY CAUSE CARD */}
      <div className="bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 border border-amber-900/40 rounded-2xl p-6 sm:p-8 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
            Likely Root Cause
          </h3>
        </div>
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
          {report.rootCause}
        </p>
      </div>

      {/* 5. EVIDENCE LIST & BROWSER CONSOLE ERRORS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="space-y-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Diagnostic Evidence
          </h3>
          <p className="text-xs text-slate-400">
            Empirical telemetry collected by headless browser instrumentation and DOM inspection
          </p>
        </div>

        {/* Evidence rows */}
        <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
          {report.evidence.map((ev, idx) => {
            const isCode = looksLikeCodeOrCss(ev.value);

            return (
              <div
                key={idx}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-[200px]">
                  {getSeverityBadge(ev.severity)}
                  <span className="font-semibold text-slate-200">{ev.label}</span>
                </div>

                <div className="sm:text-right flex-1 sm:max-w-xl">
                  {isCode ? (
                    <span className="font-mono text-[11px] sm:text-xs text-sky-300 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md inline-block max-w-full overflow-x-auto break-all sm:break-normal">
                      {ev.value}
                    </span>
                  ) : (
                    <span className="text-slate-300 leading-relaxed">{ev.value}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Collapsible Console Errors */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80">
          <button
            type="button"
            aria-expanded={consoleOpen}
            aria-controls="browser-console-errors"
            onClick={() => setConsoleOpen(!consoleOpen)}
            className="w-full px-4 py-3 bg-slate-900/80 hover:bg-slate-900 flex items-center justify-between text-xs font-semibold text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
          >
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-mono">❯_</span>
              <span>Browser console errors ({consoleCount})</span>
            </div>
            <span className="text-slate-400 text-sm font-mono">
              {consoleOpen ? "▲ Hide" : "▼ Expand"}
            </span>
          </button>

          {consoleOpen && (
            <div id="browser-console-errors" className="p-4 border-t border-slate-800">
              {consoleCount === 0 ? (
                <p className="text-xs text-slate-500 italic">No console errors detected during page run.</p>
              ) : (
                <pre className="font-mono text-xs text-red-300 bg-slate-950 p-4 rounded-lg border border-slate-900 overflow-x-auto leading-relaxed space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                  {report.consoleErrors.map((line, idx) => (
                    <div key={idx} className="whitespace-pre-wrap">
                      {line}
                    </div>
                  ))}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 6. RECOMMENDED FIX */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
              Recommended Remediation Steps
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Sequential corrective actions to eliminate visual regression and runtime exceptions
          </p>
        </div>

        <ol className="space-y-3">
          {report.fixSteps.map((step, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-200 leading-relaxed"
            >
              <span className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* 7. ANTIGRAVITY PROMPT CARD */}
      <PromptBox prompt={report.antigravityPrompt} reportUrl={report.url} />

      {/* 8. FOOTER ACTION */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80">
        <div className="text-xs text-slate-500 text-center sm:text-left">
          Ready to inspect another defect or test another viewport state?
        </div>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
        >
          <span>↺</span>
          <span>Analyze another page</span>
        </button>
      </div>

      {/* 9. STICKY MOBILE MINI-BAR */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-4 py-3 flex items-center justify-between gap-3 shadow-2xl">
        <button
          type="button"
          onClick={onReset}
          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
        >
          ↺ New Page
        </button>

        <button
          type="button"
          onClick={handleMobileCopy}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
            mobileCopied
              ? "bg-emerald-600 text-white"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
          }`}
        >
          {mobileCopied ? (
            <>
              <span>✓</span>
              <span>Copied Prompt</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>Copy Prompt</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReportView;
