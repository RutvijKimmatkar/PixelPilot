import type { ConsoleState } from "../types/console";
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
  url: string;
  desc: string;
  setUrl: (v: string) => void;
  setDesc: (v: string) => void;
  error: string | null;
  running: boolean;
  canRun: boolean;
  onRun: () => void;
  onCancel: () => void;
  onSample: () => void;
  vp: { desktop: boolean; mobile: boolean };
  setVp: (v: { desktop: boolean; mobile: boolean }) => void;
}

export function TargetPanel(props: TargetProps) {
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
        <h1 className="text-[32px] leading-[38px] font-medium tracking-[-0.02em] text-[#EDEDED]">
          Test a live page
        </h1>
        <p className="text-sm text-[#A0A0A0] mt-1.5 max-w-2xl">
          Paste a public URL and describe the bug. Playwright tests it and writes the fix.
        </p>

        <div className="mt-6 flex flex-col lg:flex-row gap-4 items-stretch lg:items-start">
          {/* URL Input */}
          <div className="flex-[2] min-w-0">
            <label htmlFor="url-input" className="block text-xs text-[#A0A0A0] mb-1.5 font-medium">
              Page URL
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-[#707070] pointer-events-none" aria-hidden="true">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </span>
              <input
                id="url-input"
                type="url"
                value={props.url}
                onChange={(e) => props.setUrl(e.target.value)}
                placeholder="https://my-site.dev"
                aria-invalid={!!props.error}
                aria-describedby={props.error ? "url-error" : undefined}
                className={`w-full h-11 bg-[#1C1C1C] rounded-[6px] pl-10 pr-3 text-sm text-[#EDEDED] font-mono placeholder:text-[#707070] border transition-colors focus:outline-none focus:border-[#3ECF8E] focus:ring-2 focus:ring-[rgba(62,207,142,0.2)] ${
                  props.error ? "border-[#EF4444]" : "border-[#363636]"
                }`}
              />
            </div>
            {props.error && (
              <p id="url-error" className="text-xs text-[#EF4444] mt-1.5 flex items-center gap-1.5">
                <span>✕</span> {props.error}
              </p>
            )}
          </div>

          {/* Bug description */}
          <div className="flex-[3] min-w-0">
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

          {/* Buttons */}
          <div className="flex items-center gap-2 lg:pt-[22px]">
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
                  <svg
                    className="w-4 h-4 fill-current"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Run Playwright test
                </>
              )}
            </Btn>

            {props.running && (
              <Btn
                id="cancel-btn"
                variant="secondary"
                size="lg"
                onClick={props.onCancel}
              >
                Cancel
              </Btn>
            )}
          </div>
        </div>

        {/* Second row of controls */}
        <div className="mt-5 flex flex-wrap items-center gap-3 pt-4 border-t border-[#2E2E2E]">
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
              id="vp-mobile"
              on={props.vp.mobile}
              onClick={() => props.setVp({ ...props.vp, mobile: !props.vp.mobile })}
            >
              Mobile 375px
            </Chip>
          </div>
          <span className="text-xs text-[#707070] ml-auto">
            Localhost and IP addresses are blocked.
          </span>
        </div>
      </section>
    </div>
  );
}
