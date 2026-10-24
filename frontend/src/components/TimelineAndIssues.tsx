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
        <span className="text-xs font-mono text-[#FAF8F5] bg-[#141312] px-2.5 py-1 rounded-full border border-[#2A2825] shadow-[inset_0_1px_0_0_rgba(253,248,241,0.04)]">
          {activeCount} of {totalCount} actions
        </span>
      }
      className="flex flex-col"
    >
      {/* Luminous warm cream & emerald progress bar */}
      <div className="w-full h-1.5 bg-[#1C1B19] rounded-full overflow-hidden mb-4 border border-[#2A2825]">
        <div
          className="h-full bg-gradient-to-r from-[#FAF7F0] to-[#3ECF8E] transition-all duration-300 shadow-[0_0_8px_rgba(250,247,240,0.3)]"
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
            // Grouped by page headers for Whole Site Crawling mode
            Object.entries(pagesGrouped).map(([pageStr, pActions]) => {
              const pIdx = Number(pageStr);
              const isCollapsed = collapsedPages[pIdx] ?? false;
              const pageUrl = pActions[0]?.pageUrl || `/page-${pIdx}`;

              return (
                <div key={pIdx} className="border border-[#2A2825] rounded-[6px] overflow-hidden bg-[#141312] shadow-[inset_0_1px_0_0_rgba(253,248,241,0.03)]">
                  <button
                    type="button"
                    onClick={() => togglePageCollapse(pIdx)}
                    className="w-full px-3 py-2 bg-[#1C1B19] border-b border-[#2A2825] flex items-center justify-between text-xs font-mono text-[#FAF8F5]"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[#3ECF8E]">📄</span>
                      <span className="font-medium text-[#FAF8F5]">Page {pIdx} of 10</span>
                      <span className="text-[#8C8578]">· {pageUrl}</span>
                    </span>
                    <span className="text-[#8C8578]">{isCollapsed ? "▾" : "▴"}</span>
                  </button>

                  {!isCollapsed && (
                    <div className="p-2 space-y-1.5">
                      {pActions.map((act) => renderActionRow(act, expandedId, setExpandedId))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // Single page standard list
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
          ? "bg-[rgba(250,247,240,0.06)] border-[#FAF7F0] shadow-[inset_0_1px_0_0_rgba(253,248,241,0.08)]"
          : isFailed
          ? "bg-[rgba(239,68,68,0.1)] border-[#EF4444]"
          : "bg-[#141312] border-[#2A2825] hover:border-[#3E3A34]"
      }`}
    >
      {isRunning && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FAF7F0] animate-pulse-bar rounded-l shadow-[0_0_8px_rgba(250,247,240,0.5)]" />
      )}

      <button
        type="button"
        onClick={() => setExpandedId(isExpanded ? null : act.id)}
        className="w-full text-left p-3 flex items-start gap-3 justify-between"
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="mt-0.5">
            {isRunning && <Spinner className="w-3.5 h-3.5 text-[#FAF7F0]" />}
            {isDone && <span className="text-xs text-[#3ECF8E] font-bold">✓</span>}
            {isFailed && <span className="text-xs text-[#EF4444] font-bold">✕</span>}
            {act.status === "pending" && (
              <span className="inline-block w-3 h-3 rounded-full border border-[#7E776C]" />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-[#FAF8F5] text-sm leading-tight truncate">
              {act.name}
            </p>
            <p className="font-mono text-xs text-[#8C8578] mt-0.5 truncate">
              {act.detail}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="font-mono text-xs text-[#B8B2A7]">{act.duration}</span>
          <span className="text-xs text-[#8C8578]">{isExpanded ? "▴" : "▾"}</span>
        </div>
      </button>

      {isExpanded && act.output && (
        <div className="px-3 pb-3 pt-0 border-t border-[#2A2825] mt-1 bg-[#0F0E0D] rounded-b-[6px]">
          <div className="mt-2 text-xs font-mono text-[#B8B2A7] whitespace-pre-wrap break-all bg-[#141312] p-2.5 rounded border border-[#2A2825]">
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
          <span className="h-5 px-2 rounded-full text-xs font-mono bg-[#141312] text-[#FAF8F5] border border-[#2A2825] flex items-center">
            {issues.length}
          </span>
        </div>
      }
    >
      {/* Row 2: Filter chips on their own row with flex-wrap so 'Low' never overflows */}
      <div className="flex flex-wrap items-center gap-1.5 pb-3 mb-3 border-b border-[#2A2825] flex-shrink-0">
        <span className="text-[11px] text-[#8C8578] mr-0.5 flex-shrink-0">Severity:</span>
        {(["all", "high", "medium", "low"] as const).map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => setFilter(lvl)}
            className={`h-6 px-2.5 rounded-full text-xs transition-all capitalize flex-shrink-0 ${
              filter === lvl
                ? "bg-[#FAF7F0] text-[#141414] font-semibold shadow-sm"
                : "bg-[#141312] border border-[#2A2825] text-[#8C8578] hover:text-[#FAF8F5]"
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
        <div className="border border-dashed border-[#2A2825] bg-[#141312]/50 rounded-[8px] p-6 text-center">
          <div className="w-8 h-8 rounded-full bg-[rgba(62,207,142,0.12)] text-[#3ECF8E] mx-auto flex items-center justify-center text-sm font-bold mb-2">
            ✓
          </div>
          <p className="text-sm font-medium text-[#FAF8F5]">No layout issues found</p>
          <p className="text-xs text-[#8C8578] mt-1">
            Try a different viewport or describe another symptom.
          </p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1.5 flex-1">
          {filtered.map((iss) => (
            <div
              key={iss.id}
              className="bg-[#141312] border border-[#2A2825] hover:border-[#3E3A34] transition-all rounded-[8px] p-3.5 shadow-[inset_0_1px_0_0_rgba(253,248,241,0.03)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                <Badge kind={iss.severity} />
                <span className="text-xs font-mono text-[#8C8578] truncate max-w-[150px]">
                  {iss.pageUrl ? `${iss.pageUrl} · ` : ""}
                  {iss.viewport}
                </span>
              </div>
              <h4 className="text-sm font-medium text-[#FAF8F5] leading-snug">
                {iss.title}
              </h4>
              <div className="mt-2 flex items-center">
                <code className="text-xs font-mono text-[#FAF7F0] bg-[#0F0E0D] px-2 py-1 rounded border border-[#2A2825] truncate max-w-full">
                  {iss.selector}
                </code>
              </div>
              <p className="text-xs text-[#B8B2A7] mt-2">
                {iss.measurement}
              </p>
              <div className="mt-3 pt-2.5 border-t border-[#2A2825] flex justify-end">
                <button
                  type="button"
                  onClick={() => onShowInScreenshot(iss)}
                  className="text-xs text-[#B8B2A7] hover:text-[#FAF7F0] transition-colors flex items-center gap-1 font-medium"
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
