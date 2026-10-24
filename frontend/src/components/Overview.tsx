import { useState } from "react";
import type { SiteInfo, CaptureItem } from "../types/console";
import { EmptyState, Panel, Skeleton } from "./ui";

const createSvgDataUrl = (w: number, h: number, body: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#121212"/>${body}</svg>`
  )}`;

export const DESKTOP_SHOT = createSvgDataUrl(
  1280,
  800,
  `<rect width="1280" height="72" fill="#171717" stroke="#2E2E2E"/>
   <rect x="36" y="22" width="28" height="28" rx="6" fill="#3ECF8E"/>
   <text x="76" y="42" font-family="sans-serif" font-size="20" font-weight="700" fill="#EDEDED">Acme Shop</text>
   <text x="820" y="42" font-family="sans-serif" font-size="14" fill="#A0A0A0">Home    Catalog    Categories    Sale    Contact</text>
   <rect x="36" y="104" width="1208" height="340" rx="10" fill="#1C1C1C" stroke="#2E2E2E"/>
   <text x="76" y="260" font-family="sans-serif" font-size="44" font-weight="700" fill="#EDEDED">New Season Arrivals</text>
   <text x="76" y="300" font-family="sans-serif" font-size="16" fill="#A0A0A0">Designed for modern developers and designers</text>
   <rect x="76" y="330" width="140" height="42" rx="6" fill="#006239" stroke="#3ECF8E"/>
   <text x="115" y="356" font-family="sans-serif" font-size="14" font-weight="600" fill="#EDEDED">Shop now</text>
   <rect x="36" y="476" width="280" height="280" rx="8" fill="#171717" stroke="#2E2E2E"/>
   <rect x="344" y="476" width="280" height="280" rx="8" fill="#171717" stroke="#2E2E2E"/>
   <rect x="652" y="476" width="280" height="280" rx="8" fill="#171717" stroke="#2E2E2E"/>
   <rect x="960" y="476" width="284" height="280" rx="8" fill="#171717" stroke="#2E2E2E"/>`
);

export const MOBILE_SHOT = createSvgDataUrl(
  375,
  812,
  `<rect width="612" height="60" fill="#171717" stroke="#2E2E2E"/>
   <text x="16" y="36" font-family="sans-serif" font-size="16" font-weight="700" fill="#EDEDED">Acme</text>
   <text x="80" y="36" font-family="sans-serif" font-size="14" fill="#A0A0A0">Home   Catalog   Categories   Sale   Contact</text>
   <rect x="0" y="0" width="375" height="60" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-dasharray="6,4"/>
   <text x="12" y="78" font-family="monospace" font-size="10" fill="#EF4444">▲ 612px navbar overflows 375px viewport</text>
   <rect x="16" y="96" width="480" height="220" rx="8" fill="#1C1C1C" stroke="#2E2E2E"/>
   <rect x="16" y="96" width="343" height="220" fill="none" stroke="#F5A524" stroke-width="2.5" stroke-dasharray="6,4"/>
   <text x="16" y="332" font-family="monospace" font-size="10" fill="#F5A524">● 480px image in 343px container</text>
   <text x="32" y="200" font-family="sans-serif" font-size="24" font-weight="700" fill="#EDEDED">New Season</text>
   <rect x="16" y="356" width="343" height="180" rx="8" fill="#171717" stroke="#2E2E2E"/>`
);

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
        <>
          <div className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-[6px] bg-[#1C1C1C] border border-[#2E2E2E] grid place-items-center text-xs font-bold text-[#3ECF8E]"
              aria-hidden="true"
            >
              A
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#EDEDED] truncate">{info.title}</p>
              <p className="text-xs font-mono text-[#707070] truncate">{info.url}</p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 mt-4">
            {[
              ["Scope", info.scope ?? "This page", "text-[#3ECF8E]"],
              ["Pages tested", info.pagesTested ?? 1, "text-[#EDEDED]"],
              ["HTTP status", info.status, "text-[#3ECF8E]"],
              ["Load time", info.loadTime, "text-[#EDEDED]"],
              ["Page weight", info.pageWeight, "text-[#EDEDED]"],
              ["DOM nodes", info.domNodes, "text-[#EDEDED]"],
              ["Console errors", info.consoleErrors, info.consoleErrors ? "text-[#F5A524]" : "text-[#EDEDED]"],
              ["Viewports tested", info.viewports.length, "text-[#EDEDED]"],
            ].map(([label, val, col]) => (
              <div
                key={label as string}
                className="bg-[#1C1C1C] border border-[#2E2E2E] rounded-[8px] p-3 hover:border-[#363636] transition-colors"
              >
                <dt className="text-xs text-[#A0A0A0]">{label}</dt>
                <dd className={`text-[20px] leading-7 font-medium mt-1 font-mono truncate ${col}`}>
                  {val}
                </dd>
              </div>
            ))}
          </dl>
        </>
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
}: {
  ready: boolean;
  loading: boolean;
  onZoom: (src: string) => void;
  captures?: CaptureItem[];
  availablePages?: string[];
}) {
  const [tab, setTab] = useState<"desktop" | "mobile" | "crops">("mobile");
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
          className={`text-xs pb-1 border-b-2 font-medium transition-colors ${
            tab === k
              ? "border-[#3ECF8E] text-[#EDEDED]"
              : "border-transparent text-[#A0A0A0] hover:text-[#EDEDED]"
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
              className="h-6 bg-[#1C1C1C] border border-[#2E2E2E] rounded px-1.5 text-[11px] text-[#A0A0A0]"
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
            onClick={() => onZoom(DESKTOP_SHOT)}
            className="block w-full rounded-[8px] overflow-hidden border border-[#2E2E2E] hover:border-[#3ECF8E] transition-colors group cursor-zoom-in"
          >
            <img src={DESKTOP_SHOT} alt="Desktop screenshot at 1280px" className="w-full" />
          </button>
          <p className="text-right text-[11px] font-mono text-[#707070]">Click image to inspect full size</p>
        </div>
      ) : tab === "mobile" ? (
        <div className="space-y-3">
          <div className="mx-auto w-52 rounded-[32px] border-[8px] border-[#1C1C1C] bg-[#121212] p-1.5 shadow-2xl relative">
            <div className="mx-auto w-14 h-2 rounded-full bg-[#232323] mb-1.5" />
            <button
              type="button"
              id="zoom-mobile"
              onClick={() => onZoom(MOBILE_SHOT)}
              className="block w-full overflow-hidden rounded-[20px] cursor-zoom-in group"
            >
              <img
                src={MOBILE_SHOT}
                alt="Mobile screenshot at 375px with overflow indicator"
                className="w-full group-hover:scale-105 transition-transform duration-200"
              />
            </button>
            <div className="mx-auto w-20 h-1 rounded-full bg-[#232323] mt-2 mb-0.5" />
          </div>
          <p className="text-center text-[11px] font-mono text-[#707070]">Phone frame emulation: 375×812</p>
        </div>
      ) : (
        // Crops & Area captures tab
        <div className="space-y-2">
          {captures.length === 0 ? (
            <p className="text-xs text-[#707070] text-center py-6">
              No region or element crops saved yet. Draw a box in Live Preview to capture one.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {captures.map((cap) => (
                <div
                  key={cap.id}
                  onClick={() => onZoom(cap.imageUrl || DESKTOP_SHOT)}
                  className="p-2 rounded bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#3ECF8E] cursor-zoom-in transition-colors text-xs font-mono"
                >
                  <div className="h-20 bg-[#121212] rounded flex items-center justify-center text-[#3ECF8E]">
                    {cap.width}×{cap.height}
                  </div>
                  <p className="mt-1 truncate text-[#EDEDED] font-sans">{cap.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
