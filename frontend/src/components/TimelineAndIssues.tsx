import { useState } from "react";
import type { PlaywrightAction, IssueItem } from "../types/console";
import { Panel, Badge, EmptyState, Skeleton, Spinner } from "./ui";

interface TimelineProps {
  actions: PlaywrightAction[];
  loading: boolean;
  activeCount: number;
  totalCount: number;
  isWholeSite?: boolean;
}

export function PlaywrightTimeline({
  actions,
  loading,
  activeCount,
  totalCount,
  isWholeSite = false,
}: TimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>("7");
  const [collapsedPages, setCollapsedPages] = useState<Record<number, boolean>>({});

  // Group actions by page for Whole site crawling mode
  const pagesGrouped = actions.reduce<Record<number, PlaywrightAction[]>>((acc, action) => {
    const pIdx = action.pageIndex ?? 1;
    if (!acc[pIdx]) acc[pIdx] = [];
    acc[pIdx].push(action);
    return acc;
  }, {});

  const togglePageCollapse = (pIdx: number) => {
    setCollapsedPages((prev) => ({ ...prev, [pIdx]: !prev[pIdx] }));
  };

  return (
    <Panel
      title="Playwright live session"
      actions={
        <span className="text-xs font-mono font-medium text-[#0A192F] bg-[#F2ECE0] px-2.5 py-1 rounded-full border border-[#DAD2C1] shadow-xs">
          {activeCount} of {totalCount} actions
        </span>
      }
      className="flex flex-col"
    >
      {/* Navy gradient progress bar */}
      <div className="w-full h-1.5 bg-[#E8E1D3] rounded-full overflow-hidden mb-4 border border-[#DAD2C1]">
        <div
          className="h-full bg-gradient-to-r from-[#0A192F] to-[#254F85] transition-all duration-300 shadow-sm"
          style={{ width: `${(activeCount / Math.max(totalCount, 1)) * 100}%` }}
        />
      </div>

      {loading && actions.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : actions.length === 0 ? (
        <EmptyState>No test actions recorded yet. Run a test to start instrumentation.</EmptyState>
      ) : (
        <div
          className="space-y-3 overflow-y-auto max-h-[380px] pr-1"
          aria-live="polite"
        >
          {isWholeSite ? (
            Object.entries(pagesGrouped).map(([pageStr, pActions]) => {
              const pIdx = Number(pageStr);
              const isCollapsed = collapsedPages[pIdx] ?? false;
              const pageUrl = pActions[0]?.pageUrl || `/page-${pIdx}`;

              return (
                <div key={pIdx} className="border border-[#DAD2C1] rounded-[6px] overflow-hidden bg-[#FAF6EE] shadow-xs">
                  <button
                    type="button"
                    onClick={() => togglePageCollapse(pIdx)}
                    className="w-full px-3 py-2 bg-[#F2ECE0] border-b border-[#DAD2C1] flex items-center justify-between text-xs font-mono text-[#0A192F]"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[#059669]">📄</span>
                      <span className="font-semibold text-[#0A192F]">Page {pIdx} of 10</span>
                      <span className="text-[#6E7F99]">· {pageUrl}</span>
                    </span>
                    <span className="text-[#6E7F99]">{isCollapsed ? "▾" : "▴"}</span>
                  </button>

                  {!isCollapsed && (
                    <div className="p-2 space-y-1.5 bg-[#FAF6EE]">
                      {pActions.map((act) => renderActionRow(act, expandedId, setExpandedId))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            actions.map((act) => renderActionRow(act, expandedId, setExpandedId))
          )}
        </div>
      )}
    </Panel>
  );
}

function renderActionRow(
  act: PlaywrightAction,
  expandedId: string | null,
  setExpandedId: (id: string | null) => void
) {
  const isRunning = act.status === "running";
  const isFailed = act.status === "failed";
  const isDone = act.status === "done";
  const isExpanded = expandedId === act.id;

  return (
    <div
      key={act.id}
      className={`relative rounded-[6px] border transition-all text-sm ${
        isRunning
          ? "bg-[#EBF2FA] border-[#0A192F] shadow-sm"
          : isFailed
          ? "bg-[rgba(220,38,38,0.06)] border-[#DC2626]"
          : "bg-[#FAF6EE] border-[#E8E1D3] hover:border-[#DAD2C1]"
      }`}
    >
      {isRunning && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0A192F] animate-pulse-bar rounded-l shadow-sm" />
      )}

      <button
        type="button"
        onClick={() => setExpandedId(isExpanded ? null : act.id)}
        className="w-full text-left p-3 flex items-start gap-3 justify-between"
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="mt-0.5">
            {isRunning && <Spinner className="w-3.5 h-3.5 text-[#0A192F]" />}
            {isDone && <span className="text-xs text-[#059669] font-bold">✓</span>}
            {isFailed && <span className="text-xs text-[#DC2626] font-bold">✕</span>}
            {act.status === "pending" && (
              <span className="inline-block w-3 h-3 rounded-full border border-[#8E9FBA]" />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-[#0A192F] text-sm leading-tight truncate">
              {act.name}
            </p>
            <p className="font-mono text-xs text-[#6E7F99] mt-0.5 truncate">
              {act.detail}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="font-mono text-xs text-[#3B4D66] font-medium">{act.duration}</span>
          <span className="text-xs text-[#6E7F99]">{isExpanded ? "▴" : "▾"}</span>
        </div>
      </button>

      {isExpanded && act.output && (
        <div className="px-3 pb-3 pt-0 border-t border-[#E8E1D3] mt-1 bg-[#F7F4EB] rounded-b-[6px]">
          <div className="mt-2 text-xs font-mono text-[#0A192F] whitespace-pre-wrap break-all bg-[#FAF6EE] p-2.5 rounded border border-[#DAD2C1]">
            {act.output}
          </div>
        </div>
      )}
    </div>
  );
}

interface IssuesProps {
  issues: IssueItem[];
  loading: boolean;
  onShowInScreenshot: (issue: IssueItem) => void;
}

export function IssuesFound({
  issues,
  loading,
  onShowInScreenshot,
}: IssuesProps) {
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const filtered = issues.filter((iss) => {
    if (filter !== "all" && iss.severity !== filter) return false;
    return true;
  });

  return (
    <Panel
      title={
        <div className="flex items-center gap-2">
          <span>Issues found</span>
          <span className="h-5 px-2 rounded-full text-xs font-mono font-semibold bg-[#F2ECE0] text-[#0A192F] border border-[#DAD2C1] flex items-center">
            {issues.length}
          </span>
        </div>
      }
    >
      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-1.5 pb-3 mb-3 border-b border-[#E8E1D3] flex-shrink-0">
        <span className="text-[11px] text-[#6E7F99] mr-0.5 flex-shrink-0 font-medium">Severity:</span>
        {(["all", "high", "medium", "low"] as const).map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => setFilter(lvl)}
            className={`h-6 px-2.5 rounded-full text-xs transition-all capitalize flex-shrink-0 font-medium ${
              filter === lvl
                ? "bg-[#0A192F] text-[#FAF7F0] font-semibold shadow-sm"
                : "bg-[#F7F4EB] border border-[#DAD2C1] text-[#485B78] hover:text-[#0A192F]"
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : issues.length === 0 ? (
        <div className="border border-dashed border-[#DAD2C1] bg-[#F7F4EB]/60 rounded-[8px] p-6 text-center">
          <div className="w-8 h-8 rounded-full bg-[rgba(5,150,105,0.12)] text-[#059669] mx-auto flex items-center justify-center text-sm font-bold mb-2">
            ✓
          </div>
          <p className="text-sm font-semibold text-[#0A192F]">No layout issues found</p>
          <p className="text-xs text-[#6E7F99] mt-1">
            Try a different viewport or describe another symptom.
          </p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1.5 flex-1">
          {filtered.map((iss) => (
            <div
              key={iss.id}
              className="bg-[#FAF6EE] border border-[#E8E1D3] hover:border-[#0A192F] transition-all rounded-[8px] p-3.5 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                <Badge kind={iss.severity} />
                <span className="text-xs font-mono text-[#6E7F99] truncate max-w-[150px]">
                  {iss.pageUrl ? `${iss.pageUrl} · ` : ""}
                  {iss.viewport}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-[#0A192F] leading-snug">
                {iss.title}
              </h4>
              <div className="mt-2 flex items-center">
                <code className="text-xs font-mono font-medium text-[#0A192F] bg-[#F7F4EB] px-2 py-1 rounded border border-[#DAD2C1] truncate max-w-full">
                  {iss.selector}
                </code>
              </div>
              <p className="text-xs text-[#3B4D66] mt-2">
                {iss.measurement}
              </p>
              <div className="mt-3 pt-2.5 border-t border-[#E8E1D3] flex justify-end">
                <button
                  type="button"
                  onClick={() => onShowInScreenshot(iss)}
                  className="text-xs text-[#0A192F] hover:underline transition-colors flex items-center gap-1 font-semibold"
                >
                  <span>Show in screenshot</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
