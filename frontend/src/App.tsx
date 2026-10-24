import { useState, useEffect, useRef } from "react";
import type {
  ConsoleState,
  IssueItem,
  PlaywrightAction,
  SiteInfo,
  TargetMode,
  TestScope,
  ViewportKey,
  PreviewTool,
  SelectionRegion,
  PickedElement,
  CaptureItem,
  LocalServer,
} from "./types/console";
import { TopBar, TargetPanel } from "./components/Header";
import { LivePreviewPanel } from "./components/LivePreviewPanel";
import { SiteSnapshot, Screenshots, DESKTOP_SHOT, MOBILE_SHOT } from "./components/Overview";
import { PlaywrightTimeline, IssuesFound } from "./components/TimelineAndIssues";
import { CodeWorkspace } from "./components/CodeWorkspace";
import { ReportPanel } from "./components/ReportPanel";
import { Toast, ZoomModal } from "./components/ToastAndModal";
import { Btn } from "./components/ui";
import { detectLocalServers } from "./lib/api";
import {
  DEMO_SITE_INFO,
  DEMO_ACTIONS,
  DEMO_ISSUES,
} from "./data/demoData";

export function App() {
  // Console state: 8 states
  // 1. idle
  // 2. validation_error
  // 3. running
  // 4. completed_issues (default view)
  // 5. completed_clean
  // 6. failed_blocked
  // 7. preview_area_selected (NEW)
  // 8. whole_site_running (NEW, page 3 of 10)
  const [consoleState, setConsoleState] = useState<ConsoleState>("completed_issues");

  // Target panel state
  const [targetMode, setTargetMode] = useState<TargetMode>("public");
  const [url, setUrl] = useState("https://shop.acme-demo.dev");
  const [port, setPort] = useState("5173");
  const [path, setPath] = useState("");
  const [desc, setDesc] = useState("Navbar overflows on mobile and the page scrolls sideways");
  const [scope, setScope] = useState<TestScope>("page");
  const [maxPages, setMaxPages] = useState<number>(10);
  const [vp, setVp] = useState({ desktop: true, tablet: false, mobile: true });

  // Live preview state
  const [previewUrl, setPreviewUrl] = useState<string>("https://shop.acme-demo.dev");
  const [previewViewport, setPreviewViewport] = useState<ViewportKey>("mobile");
  const [previewTool, setPreviewTool] = useState<PreviewTool>("region");
  const [region, setRegion] = useState<SelectionRegion | null>(null);
  const [pickedElement, setPickedElement] = useState<PickedElement | null>(null);
  const [selectionNote, setSelectionNote] = useState<string>("");
  const [captures, setCaptures] = useState<CaptureItem[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Local apps detection
  const [detectedServers, setDetectedServers] = useState<LocalServer[]>([]);
  const [detectingServers, setDetectingServers] = useState<boolean>(false);

  // UI toast and modal state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [hasReport, setHasReport] = useState<boolean>(true);
  const [runningActionIndex, setRunningActionIndex] = useState<number>(0);

  // Section references for smooth scrolling
  const targetRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const runningTimelineRef = useRef<HTMLDivElement>(null);
  const issuesRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const blockedBannerRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Sync state helpers
  const isRunning = consoleState === "running" || consoleState === "whole_site_running";
  const isIdle = consoleState === "idle";
  const isFailedBlocked = consoleState === "failed_blocked";
  const isValidationError = consoleState === "validation_error";

  // Compute computed active URL
  const activeTargetUrl =
    targetMode === "public"
      ? url.trim()
      : `http://localhost:${port}${path ? (path.startsWith("/") ? path : `/${path}`) : ""}`;

  // URL validation error message
  const urlError = (() => {
    if (isValidationError) {
      return targetMode === "public"
        ? "IP addresses and loopbacks are blocked. Use a public hostname."
        : "Invalid port number. Enter a port between 1 and 65535.";
    }

    if (targetMode === "public") {
      const u = url.trim().toLowerCase();
      if (!u) return null;
      if (
        u.includes("localhost") ||
        u.includes("127.0.0.1") ||
        u.includes("0.0.0.0") ||
        u.includes("[::1]") ||
        u.includes("192.168.") ||
        u.includes("10.") ||
        u.includes("169.254.") ||
        /^https?:\/\/\d+\.\d+\.\d+\.\d+/.test(u)
      ) {
        return "Private IP addresses and localhost are blocked in Public mode. Switch to Localhost to test local apps.";
      }
    } else {
      const p = parseInt(port, 10);
      if (isNaN(p) || p < 1 || p > 65535) {
        return "Port must be an integer between 1 and 65535.";
      }
    }
    return null;
  })();

  // Primary button run enablement and helper text
  const canRun = (() => {
    if (urlError) return false;
    if (targetMode === "public" && !url.trim()) return false;
    if (targetMode === "localhost" && !port.trim()) return false;
    if (scope === "region" && !region) return false;
    if (scope === "element" && !pickedElement) return false;
    return true;
  })();

  const disabledReason = (() => {
    if (scope === "region" && !region) return "Draw an area in the preview first";
    if (scope === "element" && !pickedElement) return "Pick an element in the preview first";
    if (!canRun) return "Complete target details first";
    return undefined;
  })();

  // Stream in actions when in running state + auto-scroll
  useEffect(() => {
    if (!isRunning) return;
    setRunningActionIndex(1);
    scrollToSection(runningTimelineRef);

    const interval = setInterval(() => {
      setRunningActionIndex((prev) => {
        const next = prev + 1;
        if (next === 6) {
          scrollToSection(issuesRef);
        }
        if (next >= DEMO_ACTIONS.length) {
          clearInterval(interval);
          setConsoleState("completed_issues");
          setTimeout(() => {
            scrollToSection(codeRef);
          }, 400);
          return DEMO_ACTIONS.length;
        }
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isRunning]);

  // When switching states, trigger corresponding smooth scrolling and demo fixtures
  const switchStateWithScroll = (newState: ConsoleState) => {
    setConsoleState(newState);

    if (newState === "idle") {
      setUrl("");
      setDesc("");
      setRegion(null);
      setPickedElement(null);
      setPreviewUrl("");
      setHasReport(false);
      scrollToSection(targetRef);
    } else if (newState === "validation_error") {
      setTargetMode("public");
      setUrl("192.168.1.10");
      scrollToSection(targetRef);
    } else if (newState === "running") {
      setHasReport(false);
    } else if (newState === "whole_site_running") {
      setScope("site");
      setMaxPages(10);
      setHasReport(false);
      scrollToSection(runningTimelineRef);
    } else if (newState === "preview_area_selected") {
      setTargetMode("public");
      setUrl("https://shop.acme-demo.dev");
      setPreviewUrl("https://shop.acme-demo.dev");
      setScope("region");
      setPreviewTool("region");
      setRegion({ x: 32, y: 16, width: 310, height: 180 });
      setPickedElement(null);
      setTimeout(() => scrollToSection(previewRef), 100);
    } else if (newState === "completed_issues") {
      setTargetMode("public");
      setUrl("https://shop.acme-demo.dev");
      setDesc("Navbar overflows on mobile and the page scrolls sideways");
      setHasReport(true);
      setTimeout(() => scrollToSection(issuesRef), 100);
    } else if (newState === "completed_clean") {
      setUrl("https://clean-site.example");
      setDesc("Check for responsive defects");
      setHasReport(true);
      setTimeout(() => scrollToSection(issuesRef), 100);
    } else if (newState === "failed_blocked") {
      setTargetMode("public");
      setUrl("http://169.254.169.254/latest/meta-data");
      setTimeout(() => scrollToSection(blockedBannerRef), 100);
    }
  };

  // Actions list based on state
  const currentActions: PlaywrightAction[] = (() => {
    if (isIdle || isValidationError) return [];
    if (isFailedBlocked) {
      return [
        {
          id: "1",
          name: "Check URL safety",
          detail: "Private IP detected: 169.254.169.254 (Cloud metadata)",
          duration: "0.1s",
          status: "failed",
          output: "Security policy error: Target resolves to AWS/Cloud metadata loopback IP. Blocked to prevent SSRF vulnerability.",
        },
      ];
    }
    if (consoleState === "whole_site_running") {
      return [
        { id: "p1-1", name: "Crawl page /", detail: "Capture 1280px & 375px", duration: "1.2s", status: "done", pageUrl: "/", pageIndex: 1 },
        { id: "p1-2", name: "Measure overflow /", detail: "scrollWidth 612px > 375px", duration: "0.4s", status: "done", pageUrl: "/", pageIndex: 1 },
        { id: "p2-1", name: "Crawl page /catalog", detail: "Capture 1280px & 375px", duration: "1.4s", status: "done", pageUrl: "/catalog", pageIndex: 2 },
        { id: "p2-2", name: "Inspect console errors", detail: "1 404 image resource", duration: "0.2s", status: "done", pageUrl: "/catalog", pageIndex: 2 },
        { id: "p3-1", name: "Crawl page /products", detail: "page.goto, waitUntil networkidle", duration: "0.8s", status: "running", pageUrl: "/products", pageIndex: 3 },
      ];
    }
    if (isRunning) {
      return DEMO_ACTIONS.slice(0, runningActionIndex).map((a, idx) => ({
        ...a,
        status: idx === runningActionIndex - 1 ? "running" : "done",
      }));
    }
    return DEMO_ACTIONS;
  })();

  // Site info based on state
  const currentSiteInfo: SiteInfo | null = (() => {
    if (isIdle || isValidationError || isFailedBlocked) return null;
    return {
      ...DEMO_SITE_INFO,
      url: activeTargetUrl || DEMO_SITE_INFO.url,
      scope:
        scope === "site"
          ? `Whole site · ${maxPages} pages`
          : scope === "region" && region
          ? `Selected area ${region.width}×${region.height}`
          : scope === "element" && pickedElement
          ? `Element: ${pickedElement.selector}`
          : "This page",
      pagesTested: consoleState === "whole_site_running" ? 3 : scope === "site" ? 10 : 1,
    };
  })();

  // Issues based on state
  const currentIssues: IssueItem[] = (() => {
    if (isIdle || isValidationError || isFailedBlocked) return [];
    if (consoleState === "completed_clean") return [];
    if (consoleState === "whole_site_running") {
      return [
        {
          id: "iss-site-1",
          severity: "high",
          title: "Horizontal overflow on mobile navbar",
          selector: "header.navbar > ul.nav-links",
          measurement: "612px content in 375px viewport",
          viewport: "375px",
          pageUrl: "/",
        },
        {
          id: "iss-site-2",
          severity: "medium",
          title: "Catalog grid image clip",
          selector: "div.catalog-grid img",
          measurement: "420px image in 360px cell",
          viewport: "375px",
          pageUrl: "/catalog",
        },
      ];
    }
    return DEMO_ISSUES;
  })();

  // Load preview handler
  const handleLoadPreview = () => {
    if (!activeTargetUrl) return;
    setIsPreviewLoading(true);
    setPreviewError(null);
    setPreviewUrl(activeTargetUrl);

    setTimeout(() => {
      setIsPreviewLoading(false);
      setToastMessage("Preview loaded");
      scrollToSection(previewRef);
    }, 450);
  };

  // Run detection of local dev servers
  const handleDetectLocal = async () => {
    setDetectingServers(true);
    try {
      const servers = await detectLocalServers();
      setDetectedServers(servers);
      if (servers.length > 0) {
        setPort(String(servers[0].port));
        setToastMessage(`Detected ${servers.length} running local servers`);
      } else {
        setToastMessage("No running servers detected on common ports");
      }
    } finally {
      setDetectingServers(false);
    }
  };

  // Run test handler
  const handleRun = () => {
    if (!canRun) return;
    if (targetMode === "public") {
      const u = url.trim().toLowerCase();
      if (
        u.includes("127.0.0.1") ||
        u.includes("192.168") ||
        u.includes("169.254") ||
        /^\d+\.\d+\.\d+\.\d+$/.test(url.trim())
      ) {
        setConsoleState("validation_error");
        scrollToSection(targetRef);
        return;
      }
    }
    setConsoleState(scope === "site" ? "whole_site_running" : "running");
    setHasReport(false);
  };

  const handleCancel = () => {
    setConsoleState("idle");
    setToastMessage("Test run cancelled");
    scrollToSection(targetRef);
  };

  const handleSample = () => {
    setTargetMode("public");
    setUrl("https://shop.acme-demo.dev");
    setPreviewUrl("https://shop.acme-demo.dev");
    setDesc("Navbar overflows on mobile and the page scrolls sideways");
    setConsoleState("completed_issues");
    setHasReport(true);
    setToastMessage("Sample bug loaded");
    setTimeout(() => scrollToSection(issuesRef), 100);
  };

  const handleCopy = (text: string, label: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setToastMessage(label);
  };

  const handleExport = (format: string) => {
    setToastMessage(`Exported report as ${format.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#EDEDED] flex flex-col font-sans selection:bg-[#006239] selection:text-[#3ECF8E]">
      {/* 1. TOP BAR */}
      <TopBar
        state={consoleState}
        onHistoryClick={() => {
          setToastMessage("Run history: 1 session loaded");
          scrollToSection(targetRef);
        }}
      />

      {/* State Switcher for Judges / Testing (8 States) */}
      <aside aria-label="State switcher" className="bg-[#171717] border-b border-[#2E2E2E] py-2 px-6 sticky top-14 z-20 backdrop-blur-md">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[#707070]">Console states:</span>
            <span className="text-[11px] text-[#3ECF8E] font-mono bg-[rgba(62,207,142,0.1)] px-2 py-0.5 rounded">
              ⚡ 8 states supported
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                ["idle", "1. Idle"],
                ["validation_error", "2. Validation Error"],
                ["running", "3. Running"],
                ["completed_issues", "4. Completed (Issues)"],
                ["completed_clean", "5. Completed (Clean)"],
                ["failed_blocked", "6. Failed / Blocked"],
                ["preview_area_selected", "7. Preview Area Selected"],
                ["whole_site_running", "8. Whole Site Running"],
              ] as const
            ).map(([s, label]) => (
              <button
                key={s}
                type="button"
                onClick={() => switchStateWithScroll(s)}
                className={`px-2.5 py-1 rounded-[4px] text-xs transition-colors ${
                  consoleState === s
                    ? "bg-[#006239] border border-[#3ECF8E] text-[#3ECF8E] font-medium"
                    : "bg-[#1C1C1C] border border-[#2E2E2E] text-[#A0A0A0] hover:text-[#EDEDED]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Floating Section Nav at right edge (docked cleanly, hidden below 1536px to avoid overlap) */}
      <nav
        aria-label="Section shortcuts"
        className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden 2xl:flex flex-col gap-1 bg-[#171717]/95 backdrop-blur-md border border-[#2E2E2E] p-1.5 rounded-[8px] shadow-2xl"
      >
        <button
          onClick={() => scrollToSection(targetRef)}
          title="Scroll to Target"
          className="px-2.5 py-1 text-[11px] font-mono text-[#A0A0A0] hover:text-[#3ECF8E] hover:bg-[#232323] rounded transition-colors text-left"
        >
          ↑ Target
        </button>
        <button
          onClick={() => scrollToSection(previewRef)}
          title="Scroll to Live Preview"
          className="px-2.5 py-1 text-[11px] font-mono text-[#A0A0A0] hover:text-[#3ECF8E] hover:bg-[#232323] rounded transition-colors text-left"
        >
          ⌖ Preview
        </button>
        <button
          onClick={() => scrollToSection(runningTimelineRef)}
          title="Scroll to Playwright Live Session"
          className="px-2.5 py-1 text-[11px] font-mono text-[#A0A0A0] hover:text-[#3ECF8E] hover:bg-[#232323] rounded transition-colors text-left"
        >
          ▶ Session
        </button>
        <button
          onClick={() => scrollToSection(issuesRef)}
          title="Scroll to Issues Found"
          className="px-2.5 py-1 text-[11px] font-mono text-[#A0A0A0] hover:text-[#3ECF8E] hover:bg-[#232323] rounded transition-colors text-left"
        >
          ▲ Issues
        </button>
        <button
          onClick={() => scrollToSection(codeRef)}
          title="Scroll to Developed Code"
          className="px-2.5 py-1 text-[11px] font-mono text-[#A0A0A0] hover:text-[#3ECF8E] hover:bg-[#232323] rounded transition-colors text-left"
        >
          { } Code
        </button>
        <button
          onClick={() => scrollToSection(reportRef)}
          title="Scroll to Report"
          className="px-2.5 py-1 text-[11px] font-mono text-[#A0A0A0] hover:text-[#3ECF8E] hover:bg-[#232323] rounded transition-colors text-left"
        >
          ↓ Report
        </button>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-6 space-y-6">
        {/* 2. TARGET PANEL */}
        <div ref={targetRef} id="target-section">
          <TargetPanel
            mode={targetMode}
            setMode={setTargetMode}
            url={url}
            setUrl={setUrl}
            port={port}
            setPort={setPort}
            path={path}
            setPath={setPath}
            desc={desc}
            setDesc={setDesc}
            scope={scope}
            setScope={setScope}
            maxPages={maxPages}
            setMaxPages={setMaxPages}
            error={urlError}
            running={isRunning}
            canRun={canRun}
            disabledReason={disabledReason}
            onRun={handleRun}
            onCancel={handleCancel}
            onLoadPreview={handleLoadPreview}
            onDetectLocal={handleDetectLocal}
            detectedServers={detectedServers}
            detectingServers={detectingServers}
            onSample={handleSample}
            vp={vp}
            setVp={setVp}
          />
        </div>

        {/* State 6: Blocked / Failed banner */}
        {isFailedBlocked && (
          <div
            ref={blockedBannerRef}
            id="blocked-banner"
            className="bg-[rgba(239,68,68,0.12)] border border-[#EF4444] rounded-[8px] p-4 flex items-center justify-between gap-4 animate-slide-in"
          >
            <div className="flex items-center gap-3">
              <span className="text-[#EF4444] font-bold text-base">✕</span>
              <div>
                <h3 className="text-sm font-medium text-[#EF4444]">
                  This URL was blocked: it points to a private network address or cloud metadata service.
                </h3>
                <p className="text-xs text-[#A0A0A0] mt-0.5">
                  Playwright security rules forbid inspecting internal subnets, RFC1918 loopbacks, or 169.254.x.x addresses in Public URL mode.
                </p>
              </div>
            </div>
            <Btn
              variant="secondary"
              size="md"
              onClick={() => {
                setUrl("https://shop.acme-demo.dev");
                switchStateWithScroll("completed_issues");
              }}
            >
              Try another URL
            </Btn>
          </div>
        )}

        {/* PHASE 2: NEW FULL-WIDTH LIVE PREVIEW PANEL */}
        <div ref={previewRef} id="preview-section" className="w-full">
          <LivePreviewPanel
            url={previewUrl}
            viewport={previewViewport}
            setViewport={setPreviewViewport}
            tool={previewTool}
            setTool={setPreviewTool}
            region={region}
            setRegion={setRegion}
            pickedElement={pickedElement}
            setPickedElement={setPickedElement}
            note={selectionNote}
            setNote={setSelectionNote}
            captures={captures}
            onAddCapture={(cap) => {
              setCaptures((prev) => [cap, ...prev]);
              setToastMessage("Capture saved");
            }}
            onDeleteCapture={(id) => {
              setCaptures((prev) => prev.filter((c) => c.id !== id));
              setToastMessage("Capture deleted");
            }}
            onToggleCaptureInTest={(id) => {
              setCaptures((prev) =>
                prev.map((c) => (c.id === id ? { ...c, includedInTest: !c.includedInTest } : c))
              );
            }}
            onZoom={(src) => setZoomSrc(src)}
            isLoading={isPreviewLoading}
            onReload={handleLoadPreview}
            previewError={previewError}
          />
        </div>

        {/* 3. MAIN GRID (3 Columns: 4 / 5 / 3 of 12)
            Responsive: Under 1280px -> 2 cols; Under 1024px -> single column stacked
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Website Overview (4/12) */}
          <div className="lg:col-span-4 space-y-6 order-4 lg:order-1">
            <SiteSnapshot
              info={currentSiteInfo}
              loading={isRunning}
            />
            <Screenshots
              ready={!isIdle && !isValidationError && !isFailedBlocked && !isRunning}
              loading={isRunning}
              onZoom={(src) => setZoomSrc(src)}
              captures={captures}
              availablePages={["/catalog", "/products"]}
            />
          </div>

          {/* CENTER: Playwright Live Session (5/12) */}
          <div ref={runningTimelineRef} id="session-section" className="lg:col-span-5 order-2 lg:order-2">
            <PlaywrightTimeline
              actions={currentActions}
              loading={isRunning}
              activeCount={currentActions.filter((a) => a.status === "done").length}
              totalCount={DEMO_ACTIONS.length}
              isWholeSite={consoleState === "whole_site_running" || scope === "site"}
            />
          </div>

          {/* RIGHT: Issues Found (3/12) */}
          <div ref={issuesRef} id="issues-section" className="lg:col-span-3 order-3 lg:order-3">
            <IssuesFound
              issues={currentIssues}
              loading={isRunning}
              availablePages={["/", "/catalog", "/products"]}
              onShowInScreenshot={(issue) => {
                setZoomSrc(issue.viewport === "375px" ? MOBILE_SHOT : DESKTOP_SHOT);
                setToastMessage(`Viewing ${issue.title} in screenshot`);
              }}
            />
          </div>
        </div>

        {/* 4. CODE WORKSPACE (Full width) */}
        <div ref={codeRef} id="code-section" className="w-full">
          <CodeWorkspace
            onCopy={handleCopy}
            scope={scope}
            region={region}
            element={pickedElement}
          />
        </div>

        {/* 5. REPORT PANEL (Full width, bottom) */}
        <div ref={reportRef} id="report-section" className="w-full">
          <ReportPanel
            hasReport={hasReport && !isIdle && !isValidationError && !isFailedBlocked && !isRunning}
            scope={scope}
            region={region}
            element={pickedElement}
            onGenerateReport={() => {
              setHasReport(true);
              setToastMessage("Report generated successfully");
              scrollToSection(reportRef);
            }}
            onExport={handleExport}
          />
        </div>
      </main>

      {/* 6. TOAST AND ZOOM MODAL */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      <ZoomModal src={zoomSrc} onClose={() => setZoomSrc(null)} />
    </div>
  );
}

export default App;
