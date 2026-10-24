import { useState } from "react";
import type { SiteInfo, CaptureItem } from "../types/console";
import { EmptyState, Panel, Skeleton } from "./ui";
import { DESKTOP_SHOT, MOBILE_SHOT } from "../lib/demoScreenshots";

export { DESKTOP_SHOT, MOBILE_SHOT };

export function SiteSnapshot({ info, loading }: { info: SiteInfo | null; loading: boolean }) {
  return (
    <Panel title="Site snapshot">
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      ) : !info ? (
        <EmptyState>Run a test to inspect target website metadata.</EmptyState>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-[6px] bg-[#1C1B19] border border-[#2A2825] grid place-items-center text-xs font-bold text-[#FAF7F0] shadow-[0_1px_4px_rgba(250,247,240,0.15)]"
              aria-hidden="true"
            >
              A
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#FAF8F5] truncate">{info.title}</p>
              <p className="text-xs font-mono text-[#8C8578] truncate">{info.url}</p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 mt-4 flex-1">
            {[
              ["Scope", info.scope ?? "This page", "text-[#FAF7F0]"],
              ["Pages tested", info.pagesTested ?? 1, "text-[#FAF8F5]"],
              ["HTTP status", info.status, "text-[#3ECF8E]"],
              ["Load time", info.loadTime, "text-[#FAF8F5]"],
              ["Page weight", info.pageWeight, "text-[#FAF8F5]"],
              ["DOM nodes", info.domNodes, "text-[#FAF8F5]"],
              ["Console errors", info.consoleErrors, info.consoleErrors ? "text-[#F5A524]" : "text-[#FAF8F5]"],
              ["Viewports tested", info.viewports.length, "text-[#FAF8F5]"],
            ].map(([label, val, col]) => (
              <div
                key={label as string}
                className="bg-[#141312] border border-[#2A2825] rounded-[8px] p-3 hover:border-[#3E3A34] transition-colors shadow-[inset_0_1px_0_0_rgba(253,248,241,0.03)] flex flex-col justify-center"
              >
                <dt className="text-xs text-[#B8B2A7]">{label}</dt>
                <dd className={`text-[20px] leading-7 font-medium mt-1 font-mono truncate ${col}`}>
                  {val}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </Panel>
  );
}

export function Screenshots({
  ready,
  loading,
  onZoom,
  captures = [],
  availablePages = [],
  desktopShot,
  mobileShot,
}: {
  ready: boolean;
  loading: boolean;
  onZoom: (src: string) => void;
  captures?: CaptureItem[];
  availablePages?: string[];
  desktopShot?: string;
  mobileShot?: string;
}) {
  const [tab, setTab] = useState<"desktop" | "mobile" | "crops">("mobile");
  const activeDesktopShot = desktopShot || DESKTOP_SHOT;
  const activeMobileShot = mobileShot || MOBILE_SHOT;
  const [page, setPage] = useState<string>("all");

  const tabs = (
    <div role="tablist" className="flex gap-3">
      {(
        [
          ["desktop", "Desktop 1280"],
          ["mobile", "Mobile 375"],
          ["crops", `Crops (${captures.length})`],
        ] as const
      ).map(([k, label]) => (
        <button
          key={k}
          role="tab"
          aria-selected={tab === k}
          onClick={() => setTab(k)}
          className={`text-xs pb-1 border-b-2 font-medium transition-all ${
            tab === k
              ? "border-[#FAF7F0] text-[#FAF8F5] drop-shadow-[0_1px_4px_rgba(250,247,240,0.2)]"
              : "border-transparent text-[#B8B2A7] hover:text-[#FAF8F5]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <Panel
      title={
        <div className="flex items-center gap-2">
          <span>Captures and screenshots</span>
          {availablePages.length > 1 && (
            <select
              value={page}
              onChange={(e) => setPage(e.target.value)}
              className="h-6 bg-[#141312] border border-[#2A2825] rounded px-1.5 text-[11px] text-[#B8B2A7]"
            >
              <option value="all">Page 1 (/)</option>
              {availablePages.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </div>
      }
      actions={tabs}
    >
      {loading ? (
        <Skeleton className="h-72 w-full" />
      ) : !ready ? (
        <EmptyState>Screenshots appear here after Playwright captures viewports.</EmptyState>
      ) : tab === "desktop" ? (
        <div className="space-y-2">
          <button
            type="button"
            id="zoom-desktop"
            onClick={() => onZoom(activeDesktopShot)}
            className="block w-full rounded-[8px] overflow-hidden border border-[#2A2825] hover:border-[#FAF7F0] transition-colors group cursor-zoom-in"
          >
            <img src={activeDesktopShot} alt="Desktop screenshot at 1280px" className="w-full" />
          </button>
          <p className="text-right text-[11px] font-mono text-[#8C8578]">Click image to inspect full size</p>
        </div>
      ) : tab === "mobile" ? (
        <div className="space-y-3">
          <div className="mx-auto w-52 rounded-[32px] border-[8px] border-[#1C1B19] bg-[#0F0E0D] p-1.5 shadow-2xl relative">
            <div className="mx-auto w-14 h-2 rounded-full bg-[#24221F] mb-1.5" />
            <button
              type="button"
              id="zoom-mobile"
              onClick={() => onZoom(activeMobileShot)}
              className="block w-full overflow-hidden rounded-[20px] cursor-zoom-in group"
            >
              <img
                src={activeMobileShot}
                alt="Mobile screenshot at 375px with overflow indicator"
                className="w-full group-hover:scale-105 transition-transform duration-200"
              />
            </button>
            <div className="mx-auto w-20 h-1 rounded-full bg-[#24221F] mt-2 mb-0.5" />
          </div>
          <p className="text-center text-[11px] font-mono text-[#8C8578]">Phone frame emulation: 375×812</p>
        </div>
      ) : (
        // Crops & Area captures tab
        <div className="space-y-2">
          {captures.length === 0 ? (
            <p className="text-xs text-[#8C8578] text-center py-6 font-mono">
              No region or element crops saved yet. Draw a box in Live Preview to capture one.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {captures.map((cap) => (
                <div
                  key={cap.id}
                  onClick={() => onZoom(cap.imageUrl || DESKTOP_SHOT)}
                  className="p-2 rounded bg-[#141312] border border-[#2A2825] hover:border-[#FAF7F0] cursor-zoom-in transition-colors text-xs font-mono shadow-[inset_0_1px_0_0_rgba(253,248,241,0.03)]"
                >
                  <div className="h-20 bg-[#0F0E0D] rounded flex items-center justify-center text-[#FAF7F0]">
                    {cap.width}×{cap.height}
                  </div>
                  <p className="mt-1 truncate text-[#FAF8F5] font-sans">{cap.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
