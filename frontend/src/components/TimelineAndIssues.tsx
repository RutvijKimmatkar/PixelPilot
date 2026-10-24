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
        <span className="text-xs font-mono text-[#A0A0A0] bg-[#1C1C1C] px-2.5 py-1 rounded-full border border-[#2E2E2E]">
          {activeCount} of {totalCount} actions
        </span>
      }
      className="flex flex-col"
    >
      {/* Thin emerald progress bar */}
      <div className="w-full h-1 bg-[#232323] rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-[#3ECF8E] transition-all duration-300"
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
                <div key={pIdx} className="border border-[#2E2E2E] rounded-[6px] overflow-hidden bg-[#171717]">
                  <button
                    type="button"
                    onClick={() => togglePageCollapse(pIdx)}
                    className="w-full px-3 py-2 bg-[#1C1C1C] border-b border-[#2E2E2E] flex items-center justify-between text-xs font-mono text-[#EDEDED]"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[#3ECF8E]">📄</span>
                      <span className="font-medium">Page {pIdx} of 10</span>
                      <span className="text-[#707070]">· {pageUrl}</span>
                    </span>
                    <span className="text-[#707070]">{isCollapsed ? "▾" : "▴"}</span>
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

      {/* Live browser view mini preview footer strip */}
      <div className="mt-4 pt-3 border-t border-[#2E2E2E]">
        <div className="flex items-center justify-between text-xs text-[#A0A0A0] mb-2">
          <span className="font-medium flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                loading ? "bg-[#3ECF8E] animate-ping" : "bg-[#707070]"
              }`}
            />
            Live browser view (Chromium Headless)
          </span>
          {loading && (
            <span className="text-[#3ECF8E] text-[11px] font-mono tracking-wide uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E]" /> Recording
            </span>
          )}
        </div>
        <div className="aspect-video w-full rounded-[6px] border border-[#2E2E2E] bg-[#121212] overflow-hidden relative flex items-center justify-center">
          <div className="w-full h-full p-2 flex flex-col justify-between opacity-80 pointer-events-none">
            <div className="h-3 w-full bg-[#232323] rounded flex items-center px-1.5 gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5A524]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E]" />
              <span className="text-[9px] font-mono text-[#707070] ml-2 truncate">
                https://shop.acme-demo.dev
              </span>
            </div>
            <div className="flex-1 my-1.5 border border-dashed border-[#2E2E2E] rounded flex items-center justify-center">
              <span className="text-[11px] font-mono text-[#707070]">
                {loading ? "Streaming Chromium DOM Frame..." : "1280×800 Viewport Sandboxed"}
              </span>
            </div>
            <div className="h-2 w-1/3 bg-[#232323] rounded" />
          </div>
        </div>
      </div>
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
          ? "bg-[rgba(62,207,142,0.08)] border-[#3ECF8E]"
          : isFailed
          ? "bg-[rgba(239,68,68,0.1)] border-[#EF4444]"
          : "bg-[#1C1C1C] border-[#2E2E2E] hover:border-[#363636]"
      }`}
    >
      {isRunning && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#3ECF8E] animate-pulse-bar rounded-l" />
      )}

      <button
        type="button"
        onClick={() => setExpandedId(isExpanded ? null : act.id)}
        className="w-full text-left p-3 flex items-start gap-3 justify-between"
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="mt-0.5">
            {isRunning && <Spinner className="w-3.5 h-3.5 text-[#3ECF8E]" />}
            {isDone && <span className="text-xs text-[#3ECF8E] font-bold">✓</span>}
            {isFailed && <span className="text-xs text-[#EF4444] font-bold">✕</span>}
            {act.status === "pending" && (
              <span className="inline-block w-3 h-3 rounded-full border border-[#707070]" />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-[#EDEDED] text-sm leading-tight truncate">
              {act.name}
            </p>
            <p className="font-mono text-xs text-[#707070] mt-0.5 truncate">
              {act.detail}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="font-mono text-xs text-[#A0A0A0]">{act.duration}</span>
          <span className="text-xs text-[#707070]">{isExpanded ? "▴" : "▾"}</span>
        </div>
      </button>

      {isExpanded && act.output && (
        <div className="px-3 pb-3 pt-0 border-t border-[#2E2E2E] mt-1 bg-[#121212] rounded-b-[6px]">
          <div className="mt-2 text-xs font-mono text-[#A0A0A0] whitespace-pre-wrap break-all bg-[#171717] p-2.5 rounded border border-[#2E2E2E]">
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
  availablePages?: string[];
}

export function IssuesFound({
  issues,
  loading,
  onShowInScreenshot,
  availablePages = [],
}: IssuesProps) {
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [selectedPage, setSelectedPage] = useState<string>("all");

  const filtered = issues.filter((iss) => {
    if (filter !== "all" && iss.severity !== filter) return false;
    if (selectedPage !== "all" && iss.pageUrl && iss.pageUrl !== selectedPage) return false;
    return true;
  });

  return (
    <Panel
      title={
        <div className="flex items-center gap-2">
          <span>Issues found</span>
          <span className="h-5 px-2 rounded-full text-xs font-mono bg-[#232323] text-[#A0A0A0] flex items-center">
            {issues.length}
          </span>
        </div>
      }
      actions={
        availablePages.length > 1 ? (
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="h-7 bg-[#1C1C1C] border border-[#2E2E2E] rounded px-2 text-xs text-[#EDEDED] font-mono"
          >
            <option value="all">All pages</option>
            {availablePages.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        ) : null
      }
    >
      {/* Row 2: Filter chips on their own row to prevent crowding */}
      <div className="flex items-center gap-1.5 pb-3 mb-3 border-b border-[#2E2E2E]">
        <span className="text-[11px] text-[#707070] mr-1">Severity:</span>
        {(["all", "high", "medium", "low"] as const).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilter(lvl)}
            className={`h-6 px-2.5 rounded-full text-xs transition-colors capitalize ${
              filter === lvl
                ? "bg-[#3ECF8E] text-[#121212] font-medium"
                : "bg-[#1C1C1C] border border-[#2E2E2E] text-[#707070] hover:text-[#EDEDED]"
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
        <div className="border border-dashed border-[#2E2E2E] rounded-[8px] p-6 text-center">
          <div className="w-8 h-8 rounded-full bg-[rgba(62,207,142,0.12)] text-[#3ECF8E] mx-auto flex items-center justify-center text-sm font-bold mb-2">
            ✓
          </div>
          <p className="text-sm font-medium text-[#EDEDED]">No layout issues found</p>
          <p className="text-xs text-[#707070] mt-1">
            Try a different viewport or describe another symptom.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((iss) => (
            <div
              key={iss.id}
              className="bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#363636] transition-colors rounded-[8px] p-3.5"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge kind={iss.severity} />
                <span className="text-xs font-mono text-[#707070]">
                  {iss.pageUrl ? `${iss.pageUrl} · ` : ""}
                  {iss.viewport}
                </span>
              </div>
              <h4 className="text-sm font-medium text-[#EDEDED] leading-snug">
                {iss.title}
              </h4>
              <div className="mt-2 flex items-center">
                <code className="text-xs font-mono text-[#3ECF8E] bg-[#121212] px-2 py-1 rounded border border-[#2E2E2E] truncate max-w-full">
                  {iss.selector}
                </code>
              </div>
              <p className="text-xs text-[#A0A0A0] mt-2">
                {iss.measurement}
              </p>
              <div className="mt-3 pt-2.5 border-t border-[#2E2E2E] flex justify-end">
                <button
                  type="button"
                  onClick={() => onShowInScreenshot(iss)}
                  className="text-xs text-[#A0A0A0] hover:text-[#3ECF8E] transition-colors flex items-center gap-1 font-medium"
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
