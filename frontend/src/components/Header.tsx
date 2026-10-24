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
      bg: "bg-[#172A45] text-[#D0DDF0] border border-[#233D66]",
      label: "Idle",
      icon: <span className="w-2 h-2 rounded-full bg-[#8E9FBA]" />,
    },
    validation_error: {
      bg: "bg-[rgba(220,38,38,0.2)] text-[#FCA5A5] border border-[rgba(220,38,38,0.4)]",
      label: "Invalid target",
      icon: <span className="text-xs">✕</span>,
    },
    running: {
      bg: "bg-[#102A4C] text-[#FAF7F0] border border-[#3165A6] shadow-[0_0_12px_rgba(49,101,166,0.3)]",
      label: "Running",
      icon: <Spinner className="w-3 h-3 text-[#FAF7F0]" />,
    },
    whole_site_running: {
      bg: "bg-[#102A4C] text-[#FAF7F0] border border-[#3165A6]",
      label: "Crawling site (Page 3/10)",
      icon: <Spinner className="w-3 h-3 text-[#FAF7F0]" />,
    },
    preview_area_selected: {
      bg: "bg-[#172A45] text-[#FAF7F0] border border-[#3165A6]",
      label: "Preview ready · Area selected",
      icon: <span className="text-xs font-bold text-[#F3E8CE]">⌖</span>,
    },
    completed_issues: {
      bg: "bg-[rgba(5,150,105,0.2)] text-[#6EE7B7] border border-[rgba(5,150,105,0.4)]",
      label: "Completed",
      icon: <span className="text-xs font-bold">✓</span>,
    },
    completed_clean: {
      bg: "bg-[rgba(5,150,105,0.2)] text-[#6EE7B7] border border-[rgba(5,150,105,0.4)]",
      label: "Completed",
      icon: <span className="text-xs font-bold">✓</span>,
    },
    failed_blocked: {
      bg: "bg-[rgba(220,38,38,0.2)] text-[#FCA5A5] border border-[rgba(220,38,38,0.4)]",
      label: "Failed",
      icon: <span className="text-xs font-bold">✕</span>,
    },
  }[state];

  return (
    <header className="h-14 bg-[#0A192F] text-[#FAF7F0] border-b border-[#172A45] sticky top-0 z-30 shadow-[0_2px_10px_rgba(10,25,47,0.15)]">
      <div className="max-w-[1360px] mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-[7px] bg-[#FAF7F0] flex items-center justify-center text-[#0A192F] shadow-sm border border-[#E2D9C5]">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0A192F"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="8" y="6" width="8" height="14" rx="4" />
              <path d="M12 6V3M4 13h4M16 13h4M5 7l3 2M19 7l-3 2M5 19l3-2M19 19l-3-2" />
            </svg>
          </div>
          <span className="font-semibold text-sm text-[#FAF7F0] tracking-tight">
            Visual debugging assistant
          </span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#172A45] border border-[#233D66] text-[#D0DDF0]">
            v1.0
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
          <button
            type="button"
            id="run-history-btn"
            onClick={onHistoryClick}
            className="h-9 px-3 text-xs font-medium text-[#D0DDF0] hover:text-[#FAF7F0] hover:bg-[#172A45] rounded-[6px] transition-colors"
          >
            Run history
          </button>
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
  const runBtnLabel = {
    site: "Test whole site",
    page: "Test this page",
    region: "Test selected area",
    element: "Test selected element",
  }[props.scope];

  return (
    <div className="relative">
      <section className="relative bg-[#FFFFFF] border border-[#E8E1D3] rounded-[12px] p-6 hover:border-[#DAD2C1] transition-colors shadow-[0_2px_12px_rgba(10,25,47,0.04)]">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.02em] text-[#0A192F]">
              Test a live page
            </h1>
            <p className="text-sm text-[#3B4D66] mt-1 max-w-2xl">
              Paste a public URL or connect to localhost. Playwright tests it and writes the fix.
            </p>
          </div>

          <div className="flex items-center p-1 bg-[#F2ECE0] rounded-[8px] border border-[#DAD2C1]">
            <button
              type="button"
              onClick={() => props.setMode("public")}
              className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
                props.mode === "public"
                  ? "bg-[#0A192F] text-[#FAF7F0] shadow-sm"
                  : "text-[#3B4D66] hover:text-[#0A192F]"
              }`}
            >
              Public URL
            </button>
            <button
              type="button"
              onClick={() => props.setMode("localhost")}
              className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
                props.mode === "localhost"
                  ? "bg-[#0A192F] text-[#FAF7F0] shadow-sm"
                  : "text-[#3B4D66] hover:text-[#0A192F]"
              }`}
            >
              Localhost
            </button>
          </div>
        </div>

        <div className="mb-5 p-3 rounded-[8px] bg-[#F7F4EB] border border-[#E8E1D3] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#3B4D66] font-medium">Test scope:</span>
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
                      ? "bg-[#0A192F] text-[#FAF7F0] font-medium"
                      : "text-[#3B4D66] hover:bg-[#F2ECE0] hover:text-[#0A192F]"
                  }`}
                >
                  {sLabel}
                </button>
              ))}
            </div>
          </div>

          {props.scope === "site" && (
            <div className="flex items-center gap-2 text-xs text-[#3B4D66]">
              <span>Max pages:</span>
              <div className="flex items-center border border-[#DAD2C1] rounded-[6px] overflow-hidden bg-[#FFFFFF]">
                <button
                  type="button"
                  onClick={() => props.setMaxPages(Math.max(1, props.maxPages - 1))}
                  className="px-2 py-0.5 hover:bg-[#F2ECE0] text-[#0A192F]"
                >
                  -
                </button>
                <span className="px-2 font-mono text-[#0A192F]">{props.maxPages}</span>
                <button
                  type="button"
                  onClick={() => props.setMaxPages(Math.min(25, props.maxPages + 1))}
                  className="px-2 py-0.5 hover:bg-[#F2ECE0] text-[#0A192F]"
                >
                  +
                </button>
              </div>
              <span className="text-[#6E7F99] hidden sm:inline">
                (Follows same-origin links from start page)
              </span>
            </div>
          )}

          {props.scope === "region" && (
            <span className="text-xs text-[#0A192F] font-mono font-medium">
              ⌖ Drag a box in Live Preview to specify testing bounds
            </span>
          )}

          {props.scope === "element" && (
            <span className="text-xs text-[#0A192F] font-mono font-medium">
              ↖ Click an element in Live Preview to inspect its subtree
            </span>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-start">
          <div className="flex-[2.5] min-w-0">
            {props.mode === "public" ? (
              <div>
                <label htmlFor="url-input" className="block text-xs text-[#3B4D66] mb-1.5 font-medium">
                  Page URL
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-[#6E7F99] pointer-events-none" aria-hidden="true">
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
                    className={`w-full h-11 bg-[#F7F4EB] rounded-[6px] pl-10 pr-3 text-sm text-[#0A192F] font-mono placeholder:text-[#8E9FBA] border transition-colors focus:outline-none focus:border-[#0A192F] focus:ring-2 focus:ring-[rgba(10,25,47,0.15)] ${
                      props.error ? "border-[#DC2626]" : "border-[#DAD2C1]"
                    }`}
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="localhost-port" className="block text-xs text-[#3B4D66] font-medium">
                    Localhost Target
                  </label>
                  <button
                    type="button"
                    onClick={props.onDetectLocal}
                    disabled={props.detectingServers}
                    className="text-xs text-[#0A192F] font-semibold hover:underline flex items-center gap-1 font-mono"
                  >
                    {props.detectingServers ? <Spinner className="w-3 h-3 text-[#0A192F]" /> : "⚡"}
                    Detect running apps
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center flex-1 h-11 bg-[#F7F4EB] rounded-[6px] border border-[#DAD2C1] px-3 font-mono text-sm">
                    <span className="text-[#6E7F99] select-none">http://localhost:</span>
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
                      className="w-16 bg-transparent text-[#0A192F] focus:outline-none px-1"
                    />
                    <span className="text-[#8E9FBA]">/</span>
                    <input
                      type="text"
                      value={props.path}
                      onChange={(e) => props.setPath(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") props.onLoadPreview();
                      }}
                      placeholder="path (optional)"
                      className="flex-1 bg-transparent text-[#0A192F] focus:outline-none px-1 text-xs"
                    />
                  </div>
                </div>

                {props.detectedServers.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[11px] text-[#6E7F99]">Detected:</span>
                    {props.detectedServers.map((srv) => (
                      <button
                        key={srv.port}
                        type="button"
                        onClick={() => {
                          props.setPort(String(srv.port));
                          props.setPath("");
                        }}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] bg-[#FFFFFF] border border-[#DAD2C1] text-[#0A192F] hover:border-[#0A192F]"
                      >
                        localhost:{srv.port} ({srv.title})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {props.error && (
              <p id="url-error" className="text-xs text-[#DC2626] mt-1.5 flex items-center gap-1.5">
                <span>✕</span> {props.error}
              </p>
            )}
          </div>

          <div className="flex-[2.5] min-w-0">
            <label htmlFor="desc-input" className="block text-xs text-[#3B4D66] mb-1.5 font-medium">
              What looks wrong?
            </label>
            <input
              id="desc-input"
              type="text"
              value={props.desc}
              onChange={(e) => props.setDesc(e.target.value)}
              placeholder="Navbar overflows on mobile"
              className="w-full h-11 bg-[#F7F4EB] rounded-[6px] px-3.5 text-sm text-[#0A192F] placeholder:text-[#8E9FBA] border border-[#DAD2C1] transition-colors focus:outline-none focus:border-[#0A192F] focus:ring-2 focus:ring-[rgba(10,25,47,0.15)]"
            />
          </div>

          <div className="flex items-center gap-2 lg:pt-[22px] flex-wrap">
            <Btn
              id="load-preview-btn"
              variant="secondary"
              size="lg"
              disabled={props.running}
              onClick={props.onLoadPreview}
              className="whitespace-nowrap"
            >
              <svg className="w-4 h-4 text-[#3B4D66]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    <Spinner className="w-4 h-4 text-[#FAF7F0]" />
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
                <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block bg-[#0A192F] border border-[#172A45] text-[11px] text-[#FAF7F0] px-2.5 py-1 rounded shadow-lg whitespace-nowrap z-30">
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

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E8E1D3]">
          <div className="flex items-center gap-3 flex-wrap">
            <Btn id="sample-btn" variant="ghost" onClick={props.onSample}>
              Use sample bug
            </Btn>
            <div className="h-4 w-px bg-[#DAD2C1] hidden sm:block" />
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

          <p className="text-xs text-[#6E7F99]">
            {props.mode === "public"
              ? "Only public sites are allowed here. Switch to Localhost to test an app on this machine."
              : "Testing runs on this machine. Nothing leaves your computer except the AI diagnosis request."}
          </p>
        </div>
      </section>
    </div>
  );
}
