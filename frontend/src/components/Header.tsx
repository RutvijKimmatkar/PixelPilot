import type {
  ConsoleState,
  TargetMode,
  TestScope,
  LocalServer,
} from "../types/console";
import { Btn, Chip, Spinner } from "./ui";

export function TopBar({
  state,
  onHistoryClick,
}: {
  state: ConsoleState;
  onHistoryClick?: () => void;
}) {
  const statusConfig = {
    idle: {
      bg: "bg-[#232323] text-[#A0A0A0]",
      label: "Idle",
      icon: <span className="w-2 h-2 rounded-full bg-[#707070]" />,
    },
    validation_error: {
      bg: "bg-[rgba(239,68,68,0.14)] text-[#EF4444]",
      label: "Invalid target",
      icon: <span className="text-xs">✕</span>,
    },
    running: {
      bg: "bg-[rgba(62,207,142,0.10)] text-[#3ECF8E] border border-[#3ECF8E]",
      label: "Running",
      icon: <Spinner className="w-3 h-3 text-[#3ECF8E]" />,
    },
    whole_site_running: {
      bg: "bg-[rgba(62,207,142,0.10)] text-[#3ECF8E] border border-[#3ECF8E]",
      label: "Crawling site (Page 3/10)",
      icon: <Spinner className="w-3 h-3 text-[#3ECF8E]" />,
    },
    preview_area_selected: {
      bg: "bg-[rgba(62,207,142,0.12)] text-[#3ECF8E]",
      label: "Preview ready · Area selected",
      icon: <span className="text-xs font-bold">⌖</span>,
    },
    completed_issues: {
      bg: "bg-[rgba(62,207,142,0.12)] text-[#3ECF8E]",
      label: "Completed",
      icon: <span className="text-xs font-bold">✓</span>,
    },
    completed_clean: {
      bg: "bg-[rgba(62,207,142,0.12)] text-[#3ECF8E]",
      label: "Completed",
      icon: <span className="text-xs font-bold">✓</span>,
    },
    failed_blocked: {
      bg: "bg-[rgba(239,68,68,0.14)] text-[#EF4444]",
      label: "Failed",
      icon: <span className="text-xs font-bold">✕</span>,
    },
  }[state];

  return (
    <header className="h-14 bg-[rgba(18,18,18,0.8)] backdrop-blur-[12px] border-b border-[#2E2E2E] sticky top-0 z-30">
      <div className="max-w-[1360px] mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-[6px] bg-[#3ECF8E] flex items-center justify-center text-[#121212] shadow-sm">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#121212"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="8" y="6" width="8" height="14" rx="4" />
              <path d="M12 6V3M4 13h4M16 13h4M5 7l3 2M19 7l-3 2M5 19l3-2M19 19l-3-2" />
            </svg>
          </div>
          <span className="font-medium text-sm text-[#EDEDED] tracking-tight">
            Visual debugging assistant
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div
            role="status"
            className={`inline-flex items-center gap-2 h-7 px-3 rounded-full text-xs font-medium ${statusConfig.bg}`}
          >
            {statusConfig.icon}
            <span>{statusConfig.label}</span>
          </div>
          <Btn id="run-history-btn" variant="ghost" onClick={onHistoryClick}>
            Run history
          </Btn>
        </div>
      </div>
    </header>
  );
}

interface TargetProps {
  mode: TargetMode;
  setMode: (m: TargetMode) => void;
  url: string;
  setUrl: (v: string) => void;
  port: string;
  setPort: (v: string) => void;
  path: string;
  setPath: (v: string) => void;
  desc: string;
  setDesc: (v: string) => void;
  scope: TestScope;
  setScope: (s: TestScope) => void;
  maxPages: number;
  setMaxPages: (n: number) => void;
  error: string | null;
  running: boolean;
  canRun: boolean;
  disabledReason?: string;
  onRun: () => void;
  onCancel: () => void;
  onLoadPreview: () => void;
  onDetectLocal: () => void;
  detectedServers: LocalServer[];
  detectingServers: boolean;
  onSample: () => void;
  vp: { desktop: boolean; tablet: boolean; mobile: boolean };
  setVp: (v: { desktop: boolean; tablet: boolean; mobile: boolean }) => void;
}

export function TargetPanel(props: TargetProps) {
  // Label for primary run button following scope
  const runBtnLabel = {
    site: "Test whole site",
    page: "Test this page",
    region: "Test selected area",
    element: "Test selected element",
  }[props.scope];

  return (
    <div className="relative">
      {/* Subtle radial emerald glow behind Target panel */}
      <div
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-[85%] h-44 pointer-events-none rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(62,207,142,0.16) 0%, rgba(62,207,142,0) 70%)",
        }}
        aria-hidden="true"
      />

      <section className="relative bg-[#171717] border border-[#2E2E2E] rounded-[12px] p-6 hover:border-[#363636] transition-colors">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="text-[32px] leading-[38px] font-medium tracking-[-0.02em] text-[#EDEDED]">
              Test a live page
            </h1>
            <p className="text-sm text-[#A0A0A0] mt-1 max-w-2xl">
              Paste a public URL or connect to localhost. Playwright tests it and writes the fix.
            </p>
          </div>

          {/* Mode Segmented Control: Public URL | Localhost */}
          <div className="flex items-center p-1 bg-[#1C1C1C] rounded-[8px] border border-[#2E2E2E]">
            <button
              type="button"
              onClick={() => props.setMode("public")}
              className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
                props.mode === "public"
                  ? "bg-[#006239] text-[#3ECF8E] border border-[#3ECF8E]/50 shadow-sm"
                  : "text-[#A0A0A0] hover:text-[#EDEDED]"
              }`}
            >
              Public URL
            </button>
            <button
              type="button"
              onClick={() => props.setMode("localhost")}
              className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
                props.mode === "localhost"
                  ? "bg-[#006239] text-[#3ECF8E] border border-[#3ECF8E]/50 shadow-sm"
                  : "text-[#A0A0A0] hover:text-[#EDEDED]"
              }`}
            >
              Localhost
            </button>
          </div>
        </div>

        {/* Test Scope Segmented Control */}
        <div className="mb-5 p-3 rounded-[8px] bg-[#1C1C1C] border border-[#2E2E2E] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#A0A0A0] font-medium">Test scope:</span>
            <div className="flex items-center gap-1">
              {(
                [
                  ["site", "Whole site"],
                  ["page", "This page"],
                  ["region", "Selected area"],
                  ["element", "Selected element"],
                ] as const
              ).map(([sKey, sLabel]) => (
                <button
                  key={sKey}
                  type="button"
                  onClick={() => props.setScope(sKey)}
                  className={`px-2.5 py-1 text-xs rounded-[6px] transition-colors ${
                    props.scope === sKey
                      ? "bg-[#006239] text-[#EDEDED] font-medium border border-[#3ECF8E]"
                      : "text-[#A0A0A0] hover:bg-[#232323] hover:text-[#EDEDED]"
                  }`}
                >
                  {sLabel}
                </button>
              ))}
            </div>
          </div>

          {props.scope === "site" && (
            <div className="flex items-center gap-2 text-xs text-[#A0A0A0]">
              <span>Max pages:</span>
              <div className="flex items-center border border-[#363636] rounded-[6px] overflow-hidden bg-[#121212]">
                <button
                  type="button"
                  onClick={() => props.setMaxPages(Math.max(1, props.maxPages - 1))}
                  className="px-2 py-0.5 hover:bg-[#232323] text-[#EDEDED]"
                >
                  -
                </button>
                <span className="px-2 font-mono text-[#EDEDED]">{props.maxPages}</span>
                <button
                  type="button"
                  onClick={() => props.setMaxPages(Math.min(25, props.maxPages + 1))}
                  className="px-2 py-0.5 hover:bg-[#232323] text-[#EDEDED]"
                >
                  +
                </button>
              </div>
              <span className="text-[#707070] hidden sm:inline">
                (Follows same-origin links from start page)
              </span>
            </div>
          )}

          {props.scope === "region" && (
            <span className="text-xs text-[#3ECF8E] font-mono">
              ⌖ Drag a box in Live Preview to specify testing bounds
            </span>
          )}

          {props.scope === "element" && (
            <span className="text-xs text-[#3ECF8E] font-mono">
              ↖ Click an element in Live Preview to inspect its subtree
            </span>
          )}
        </div>

        {/* Inputs row */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-start">
          {/* URL Input: Public vs Localhost */}
          <div className="flex-[2.5] min-w-0">
            {props.mode === "public" ? (
              <div>
                <label htmlFor="url-input" className="block text-xs text-[#A0A0A0] mb-1.5 font-medium">
                  Page URL
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-[#707070] pointer-events-none" aria-hidden="true">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </span>
                  <input
                    id="url-input"
                    type="url"
                    value={props.url}
                    onChange={(e) => props.setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") props.onLoadPreview();
                    }}
                    placeholder="https://my-site.dev"
                    aria-invalid={!!props.error}
                    aria-describedby={props.error ? "url-error" : undefined}
                    className={`w-full h-11 bg-[#1C1C1C] rounded-[6px] pl-10 pr-3 text-sm text-[#EDEDED] font-mono placeholder:text-[#707070] border transition-colors focus:outline-none focus:border-[#3ECF8E] focus:ring-2 focus:ring-[rgba(62,207,142,0.2)] ${
                      props.error ? "border-[#EF4444]" : "border-[#363636]"
                    }`}
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="localhost-port" className="block text-xs text-[#A0A0A0] font-medium">
                    Localhost Target
                  </label>
                  <button
                    type="button"
                    onClick={props.onDetectLocal}
                    disabled={props.detectingServers}
                    className="text-xs text-[#3ECF8E] hover:underline flex items-center gap-1 font-mono"
                  >
                    {props.detectingServers ? <Spinner className="w-3 h-3 text-[#3ECF8E]" /> : "⚡"}
                    Detect running apps
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center flex-1 h-11 bg-[#1C1C1C] rounded-[6px] border border-[#363636] px-3 font-mono text-sm">
                    <span className="text-[#A0A0A0] select-none">http://localhost:</span>
                    <input
                      id="localhost-port"
                      type="number"
                      min="1"
                      max="65535"
                      value={props.port}
                      onChange={(e) => props.setPort(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") props.onLoadPreview();
                      }}
                      placeholder="5173"
                      className="w-16 bg-transparent text-[#EDEDED] focus:outline-none px-1"
                    />
                    <span className="text-[#707070]">/</span>
                    <input
                      type="text"
                      value={props.path}
                      onChange={(e) => props.setPath(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") props.onLoadPreview();
                      }}
                      placeholder="path (optional)"
                      className="flex-1 bg-transparent text-[#EDEDED] focus:outline-none px-1 text-xs"
                    />
                  </div>
                </div>

                {/* Detected apps chips */}
                {props.detectedServers.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[11px] text-[#707070]">Detected:</span>
                    {props.detectedServers.map((srv) => (
                      <button
                        key={srv.port}
                        type="button"
                        onClick={() => {
                          props.setPort(String(srv.port));
                          props.setPath("");
                        }}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] bg-[#232323] border border-[#2E2E2E] text-[#3ECF8E] hover:border-[#3ECF8E]"
                      >
                        localhost:{srv.port} ({srv.title})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {props.error && (
              <p id="url-error" className="text-xs text-[#EF4444] mt-1.5 flex items-center gap-1.5">
                <span>✕</span> {props.error}
              </p>
            )}
          </div>

          {/* Bug description */}
          <div className="flex-[2.5] min-w-0">
            <label htmlFor="desc-input" className="block text-xs text-[#A0A0A0] mb-1.5 font-medium">
              What looks wrong?
            </label>
            <input
              id="desc-input"
              type="text"
              value={props.desc}
              onChange={(e) => props.setDesc(e.target.value)}
              placeholder="Navbar overflows on mobile"
              className="w-full h-11 bg-[#1C1C1C] rounded-[6px] px-3.5 text-sm text-[#EDEDED] placeholder:text-[#707070] border border-[#363636] transition-colors focus:outline-none focus:border-[#3ECF8E] focus:ring-2 focus:ring-[rgba(62,207,142,0.2)]"
            />
          </div>

          {/* Buttons: Load Preview + Primary Test Run */}
          <div className="flex items-center gap-2 lg:pt-[22px] flex-wrap">
            <Btn
              id="load-preview-btn"
              variant="secondary"
              size="lg"
              disabled={props.running}
              onClick={props.onLoadPreview}
              className="whitespace-nowrap"
            >
              <svg className="w-4 h-4 text-[#A0A0A0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Load preview
            </Btn>

            <div className="relative group">
              <Btn
                id="run-btn"
                variant="primary"
                size="lg"
                disabled={!props.canRun || props.running}
                onClick={props.onRun}
                className="whitespace-nowrap"
              >
                {props.running ? (
                  <>
                    <Spinner className="w-4 h-4 text-[#EDEDED]" />
                    Testing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    {runBtnLabel}
                  </>
                )}
              </Btn>
              {props.disabledReason && !props.canRun && (
                <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block bg-[#1C1C1C] border border-[#2E2E2E] text-[11px] text-[#A0A0A0] px-2.5 py-1 rounded shadow-lg whitespace-nowrap z-30">
                  {props.disabledReason}
                </div>
              )}
            </div>

            {props.running && (
              <Btn id="cancel-btn" variant="secondary" size="lg" onClick={props.onCancel}>
                Cancel
              </Btn>
            )}
          </div>
        </div>

        {/* Second row of controls: Context note, Sample bug, Viewports */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#2E2E2E]">
          <div className="flex items-center gap-3 flex-wrap">
            <Btn id="sample-btn" variant="ghost" onClick={props.onSample}>
              Use sample bug
            </Btn>
            <div className="h-4 w-px bg-[#2E2E2E] hidden sm:block" />
            <div className="flex items-center gap-2">
              <Chip
                id="vp-desktop"
                on={props.vp.desktop}
                onClick={() => props.setVp({ ...props.vp, desktop: !props.vp.desktop })}
              >
                Desktop 1280px
              </Chip>
              <Chip
                id="vp-tablet"
                on={props.vp.tablet}
                onClick={() => props.setVp({ ...props.vp, tablet: !props.vp.tablet })}
              >
                Tablet 768px
              </Chip>
              <Chip
                id="vp-mobile"
                on={props.vp.mobile}
                onClick={() => props.setVp({ ...props.vp, mobile: !props.vp.mobile })}
              >
                Mobile 375px
              </Chip>
            </div>
          </div>

          <p className="text-xs text-[#707070]">
            {props.mode === "public"
              ? "Only public sites are allowed here. Switch to Localhost to test an app on this machine."
              : "Testing runs on this machine. Nothing leaves your computer except the AI diagnosis request."}
          </p>
        </div>
      </section>
    </div>
  );
}
