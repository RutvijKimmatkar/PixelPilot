import { useState, useEffect, useRef } from "react";
import type {
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
import { TopBar } from "./components/Header";
import { CombinedTargetAndPreview } from "./components/CombinedTargetAndPreview";
import { SiteSnapshot, Screenshots } from "./components/Overview";
import { DESKTOP_SHOT, MOBILE_SHOT } from "./lib/demoScreenshots";
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
  // Target & Live Preview unified state
  const [targetMode, setTargetMode] = useState<TargetMode>("public");
  const [url, setUrl] = useState("https://shop.acme-demo.dev");
  const [port, setPort] = useState("5173");
  const [path, setPath] = useState("");
  const [desc, setDesc] = useState("Navbar overflows on mobile and the page scrolls sideways");
  const [scope, setScope] = useState<TestScope>("page");
  const [maxPages, setMaxPages] = useState<number>(10);
  const [vp, setVp] = useState({ desktop: true, tablet: false, mobile: true });

  // Preview interactive state
  const [previewViewport, setPreviewViewport] = useState<ViewportKey>("mobile");
  const [previewTool, setPreviewTool] = useState<PreviewTool>("region");
  const [region, setRegion] = useState<SelectionRegion | null>(null);
  const [pickedElement, setPickedElement] = useState<PickedElement | null>(null);
  const [selectionNote, setSelectionNote] = useState<string>("");
  const [captures, setCaptures] = useState<CaptureItem[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [previewError] = useState<string | null>(null);

  // Execution status
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "failed">("completed");
  const [isFailedBlocked, setIsFailedBlocked] = useState<boolean>(false);
  const [runningActionIndex, setRunningActionIndex] = useState<number>(DEMO_ACTIONS.length);
  const [hasReport, setHasReport] = useState<boolean>(true);

  // Local apps detection
  const [detectedServers, setDetectedServers] = useState<LocalServer[]>([]);
  const [detectingServers, setDetectingServers] = useState<boolean>(false);

  // UI toast and modal state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  // Section references for smooth scrolling
  const targetAndPreviewRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<HTMLDivElement>(null);
  const issuesRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const blockedBannerRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const isRunning = status === "running";

  // Compute active target URL
  const activeTargetUrl =
    targetMode === "public"
      ? url.trim()
      : `http://localhost:${port}${path ? (path.startsWith("/") ? path : `/${path}`) : ""}`;

  const previewUrl = activeTargetUrl || "https://shop.acme-demo.dev";

  // URL validation error message
  const urlError = (() => {
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

  // Stream in actions when in running state + smooth scrolling flow
  useEffect(() => {
    if (!isRunning) return;
    scrollToSection(sessionRef);

    const interval = setInterval(() => {
      setRunningActionIndex((prev) => {
        const next = prev + 1;
        if (next === 6) {
          scrollToSection(issuesRef);
        }
        if (next >= DEMO_ACTIONS.length) {
          clearInterval(interval);
          setStatus("completed");
          setHasReport(true);
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

  // Actions list based on state
  const currentActions: PlaywrightAction[] = (() => {
    if (status === "idle") return [];
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
    if (scope === "site" && isRunning) {
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

  const currentSiteInfo: SiteInfo | null = (() => {
    if (status === "idle" || isFailedBlocked) return null;
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
      pagesTested: scope === "site" ? 10 : 1,
    };
  })();

  const currentIssues: IssueItem[] = (() => {
    if (status === "idle" || isFailedBlocked) return [];
    return DEMO_ISSUES;
  })();

  // Handlers
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
        setIsFailedBlocked(true);
        setStatus("failed");
        setTimeout(() => scrollToSection(blockedBannerRef), 100);
        return;
      }
    }
    setIsFailedBlocked(false);
    setRunningActionIndex(1);
    setStatus("running");
    setHasReport(false);
  };

  const handleCancel = () => {
    setStatus("idle");
    setToastMessage("Test run cancelled");
    scrollToSection(targetAndPreviewRef);
  };

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

  const handleSample = () => {
    setTargetMode("public");
    setUrl("https://shop.acme-demo.dev");
    setDesc("Navbar overflows on mobile and the page scrolls sideways");
    setIsFailedBlocked(false);
    setStatus("completed");
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
    <div className="min-h-screen bg-[#0F0E0D] text-[#FAF8F5] flex flex-col font-sans selection:bg-[#2A2720] selection:text-[#FAF7F0]">
      {/* 1. TOP BAR */}
      <TopBar
        state={
          isFailedBlocked
            ? "failed_blocked"
            : status === "running"
            ? scope === "site"
              ? "whole_site_running"
              : "running"
            : status === "completed"
            ? "completed_issues"
            : "idle"
        }
        onHistoryClick={() => {
          setToastMessage("Run history: 1 session loaded");
          scrollToSection(targetAndPreviewRef);
        }}
      />

      {/* Floating Section Nav at right edge */}
      <nav
        aria-label="Section shortcuts"
        className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden 2xl:flex flex-col gap-1 bg-[#141312]/95 backdrop-blur-md border border-[#2A2825] p-1.5 rounded-[8px] shadow-2xl shadow-[inset_0_1px_0_0_rgba(253,248,241,0.04)]"
      >
        <button
          onClick={() => scrollToSection(targetAndPreviewRef)}
          title="Scroll to Target & Preview"
          className="px-2.5 py-1 text-[11px] font-mono text-[#B8B2A7] hover:text-[#FAF8F5] hover:bg-[#1E1D1A] rounded transition-colors text-left"
        >
          ↑ Target & Preview
        </button>
        <button
          onClick={() => scrollToSection(sessionRef)}
          title="Scroll to Playwright Live Session"
          className="px-2.5 py-1 text-[11px] font-mono text-[#B8B2A7] hover:text-[#FAF8F5] hover:bg-[#1E1D1A] rounded transition-colors text-left"
        >
          ▶ Session
        </button>
        <button
          onClick={() => scrollToSection(issuesRef)}
          title="Scroll to Issues Found"
          className="px-2.5 py-1 text-[11px] font-mono text-[#B8B2A7] hover:text-[#FAF8F5] hover:bg-[#1E1D1A] rounded transition-colors text-left"
        >
          ▲ Issues
        </button>
        <button
          onClick={() => scrollToSection(codeRef)}
          title="Scroll to Developed Code"
          className="px-2.5 py-1 text-[11px] font-mono text-[#B8B2A7] hover:text-[#FAF8F5] hover:bg-[#1E1D1A] rounded transition-colors text-left"
        >
          { } Code
        </button>
        <button
          onClick={() => scrollToSection(reportRef)}
          title="Scroll to Report"
          className="px-2.5 py-1 text-[11px] font-mono text-[#B8B2A7] hover:text-[#FAF8F5] hover:bg-[#1E1D1A] rounded transition-colors text-left"
        >
          ↓ Report
        </button>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-6 space-y-6">
        {/* COMBINED TARGET & LIVE PREVIEW PANEL */}
        <div ref={targetAndPreviewRef} id="target-and-preview-section">
          <CombinedTargetAndPreview
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
            onDetectLocal={handleDetectLocal}
            detectedServers={detectedServers}
            detectingServers={detectingServers}
            onSample={handleSample}
            vp={vp}
            setVp={setVp}
            previewUrl={previewUrl}
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
            onReload={() => {
              setIsPreviewLoading(true);
              setTimeout(() => setIsPreviewLoading(false), 300);
            }}
            previewError={previewError}
          />
        </div>

        {/* Blocked URL Banner */}
        {isFailedBlocked && (
          <div
            ref={blockedBannerRef}
            id="blocked-banner"
            className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.35)] rounded-[8px] p-4 flex items-center justify-between gap-4 animate-slide-in shadow-[inset_0_1px_0_0_rgba(239,68,68,0.12)]"
          >
            <div className="flex items-center gap-3">
              <span className="text-[#EF4444] font-bold text-base">✕</span>
              <div>
                <h3 className="text-sm font-medium text-[#EF4444]">
                  This URL was blocked: it points to a private network address or cloud metadata service.
                </h3>
                <p className="text-xs text-[#B8B2A7] mt-0.5">
                  Playwright security rules forbid inspecting internal subnets, RFC1918 loopbacks, or 169.254.x.x addresses in Public URL mode.
                </p>
              </div>
            </div>
            <Btn
              variant="secondary"
              size="md"
              onClick={() => {
                setUrl("https://shop.acme-demo.dev");
                setIsFailedBlocked(false);
              }}
            >
              Try another URL
            </Btn>
          </div>
        )}

        {/* TOP STATUS GRID: Website Snapshot, Playwright Live Session, & Issues Found */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Site Snapshot (4/12) */}
          <div className="lg:col-span-4 order-3 lg:order-1">
            <SiteSnapshot info={currentSiteInfo} loading={isRunning} />
          </div>

          {/* Playwright Live Session (5/12) */}
          <div ref={sessionRef} id="session-section" className="lg:col-span-5 order-1 lg:order-2">
            <PlaywrightTimeline
              actions={currentActions}
              loading={isRunning}
              activeCount={currentActions.filter((a) => a.status === "done").length}
              totalCount={DEMO_ACTIONS.length}
              isWholeSite={scope === "site"}
            />
          </div>

          {/* Issues Found (3/12) */}
          <div ref={issuesRef} id="issues-section" className="lg:col-span-3 order-2 lg:order-3">
            <IssuesFound
              issues={currentIssues}
              loading={isRunning}
              onShowInScreenshot={(issue) => {
                setZoomSrc(issue.viewport === "375px" ? MOBILE_SHOT : DESKTOP_SHOT);
                setToastMessage(`Viewing ${issue.title} in screenshot`);
              }}
            />
          </div>
        </div>

        {/* HORIZONTAL LINE: Captures & Screenshots side-by-side with Developed Code */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Captures & Screenshots (5/12) */}
          <div className="xl:col-span-5 w-full">
            <Screenshots
              ready={status !== "idle" && !isFailedBlocked && !isRunning}
              loading={isRunning}
              onZoom={(src) => setZoomSrc(src)}
              captures={captures}
              availablePages={["/catalog", "/products"]}
            />
          </div>

          {/* Developed Code Workspace (7/12) */}
          <div ref={codeRef} id="code-section" className="xl:col-span-7 w-full">
            <CodeWorkspace
              onCopy={handleCopy}
              scope={scope}
              region={region}
              element={pickedElement}
            />
          </div>
        </div>

        {/* REPORT PANEL (Full width, bottom) */}
        <div ref={reportRef} id="report-section" className="w-full">
          <ReportPanel
            hasReport={hasReport && status !== "idle" && !isFailedBlocked && !isRunning}
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

      {/* TOAST AND ZOOM MODAL */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      <ZoomModal src={zoomSrc} onClose={() => setZoomSrc(null)} />
    </div>
  );
}

export default App;
