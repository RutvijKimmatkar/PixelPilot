import { useRef, useState } from "react";
import type {
  TargetMode,
  TestScope,
  ViewportKey,
  PreviewTool,
  SelectionRegion,
  PickedElement,
  CaptureItem,
  LocalServer,
} from "../types/console";
import { Btn, Chip, Spinner, Skeleton } from "./ui";

interface CombinedTargetAndPreviewProps {
  // Target setup props
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
  onDetectLocal: () => void;
  detectedServers: LocalServer[];
  detectingServers: boolean;
  onSample: () => void;
  vp: { desktop: boolean; tablet: boolean; mobile: boolean };
  setVp: (v: { desktop: boolean; tablet: boolean; mobile: boolean }) => void;

  // Live preview props
  previewUrl: string;
  viewport: ViewportKey;
  setViewport: (vp: ViewportKey) => void;
  tool: PreviewTool;
  setTool: (tool: PreviewTool) => void;
  region: SelectionRegion | null;
  setRegion: (r: SelectionRegion | null) => void;
  pickedElement: PickedElement | null;
  setPickedElement: (el: PickedElement | null) => void;
  note: string;
  setNote: (n: string) => void;
  captures: CaptureItem[];
  onAddCapture: (cap: CaptureItem) => void;
  onDeleteCapture: (id: string) => void;
  onToggleCaptureInTest: (id: string) => void;
  onZoom: (src: string) => void;
  isLoading: boolean;
  onReload: () => void;
  previewError: string | null;
}

export function CombinedTargetAndPreview(props: CombinedTargetAndPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredElement, setHoveredElement] = useState<{
    selector: string;
    rect: SelectionRegion;
  } | null>(null);

  // Target viewport pixel dimensions
  const dims = {
    desktop: { w: 1280, h: 800 },
    tablet: { w: 768, h: 1024 },
    mobile: { w: 375, h: 812 },
  }[props.viewport];

  // Dynamic label for primary button following test scope
  const runBtnLabel = {
    site: "Test whole site",
    page: "Test this page",
    region: "Test selected area",
    element: "Test selected element",
  }[props.scope];

  // Drawing & picking handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (props.tool !== "region" || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = dims.w / rect.width;
    const x = Math.round((e.clientX - rect.left) * scale);
    const y = Math.round((e.clientY - rect.top) * scale);
    setIsDrawing(true);
    setStartPos({ x, y });
    props.setRegion({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = dims.w / rect.width;
    const currentX = Math.round((e.clientX - rect.left) * scale);
    const currentY = Math.round((e.clientY - rect.top) * scale);

    if (props.tool === "region" && isDrawing && startPos) {
      const minX = Math.min(startPos.x, currentX);
      const minY = Math.min(startPos.y, currentY);
      const w = Math.abs(currentX - startPos.x);
      const h = Math.abs(currentY - startPos.y);
      props.setRegion({ x: minX, y: minY, width: w, height: h });
    } else if (props.tool === "element") {
      if (currentY < 80) {
        setHoveredElement({
          selector: "header.navbar > ul.nav-links",
          rect: { x: 16, y: 12, width: dims.w - 32, height: 56 },
        });
      } else if (currentY >= 80 && currentY < 380) {
        setHoveredElement({
          selector: "img.hero-banner",
          rect: { x: 24, y: 96, width: dims.w - 48, height: 260 },
        });
      } else {
        setHoveredElement({
          selector: "div.product-grid > article:nth-child(1)",
          rect: { x: 24, y: 390, width: Math.min(dims.w - 48, 300), height: 220 },
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (props.tool === "region" && isDrawing) {
      setIsDrawing(false);
      setStartPos(null);
    }
  };

  const handleClick = () => {
    if (props.tool === "element" && hoveredElement) {
      props.setPickedElement({
        selector: hoveredElement.selector,
        tagName: hoveredElement.selector.split(" ")[0],
        rect: hoveredElement.rect,
      });
    }
  };

  const handleCapture = () => {
    const newCap: CaptureItem = {
      id: `cap_${Date.now()}`,
      label:
        props.tool === "region" && props.region
          ? `Region ${props.region.width}×${props.region.height}px`
          : props.tool === "element" && props.pickedElement
          ? `Element: ${props.pickedElement.selector}`
          : `Full Viewport (${dims.w}px)`,
      imageUrl: "",
      width: props.region ? props.region.width : dims.w,
      height: props.region ? props.region.height : dims.h,
      timestamp: Date.now(),
      mode: props.tool === "region" ? "region" : props.tool === "element" ? "element" : "viewport",
      includedInTest: true,
      selector: props.pickedElement?.selector,
      region: props.region ?? undefined,
    };
    props.onAddCapture(newCap);
  };

  return (
    <div className="relative">
      {/* Subtle radial emerald glow */}
      <div
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-[90%] h-48 pointer-events-none rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(62,207,142,0.18) 0%, rgba(62,207,142,0) 70%)",
        }}
        aria-hidden="true"
      />

      <section className="relative bg-[#171717] border border-[#2E2E2E] rounded-[12px] p-6 hover:border-[#363636] transition-colors space-y-6">
        {/* HEADER & TARGET MODE */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[28px] sm:text-[32px] leading-tight font-medium tracking-tight text-[#EDEDED]">
              Test & Preview Live Page
            </h1>
            <p className="text-sm text-[#A0A0A0] mt-1 max-w-2xl">
              Inspect your target live, interact or select regions, and run automated Playwright testing.
            </p>
          </div>

          {/* Mode Switch: Public URL | Localhost */}
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

        {/* CONTROLS ROW: Target URL/Port, Bug Description, & Primary Test Trigger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* URL / Port input */}
          <div className="lg:col-span-5 min-w-0">
            {props.mode === "public" ? (
              <div>
                <label htmlFor="url-input" className="block text-xs text-[#A0A0A0] mb-1.5 font-medium">
                  Page URL
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-[#707070] pointer-events-none">
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
                    placeholder="https://my-site.dev"
                    aria-invalid={!!props.error}
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
                    Detect apps
                  </button>
                </div>
                <div className="flex items-center h-11 bg-[#1C1C1C] rounded-[6px] border border-[#363636] px-3 font-mono text-sm">
                  <span className="text-[#A0A0A0] select-none">http://localhost:</span>
                  <input
                    id="localhost-port"
                    type="number"
                    min="1"
                    max="65535"
                    value={props.port}
                    onChange={(e) => props.setPort(e.target.value)}
                    placeholder="5173"
                    className="w-16 bg-transparent text-[#EDEDED] focus:outline-none px-1"
                  />
                  <span className="text-[#707070]">/</span>
                  <input
                    type="text"
                    value={props.path}
                    onChange={(e) => props.setPath(e.target.value)}
                    placeholder="path (optional)"
                    className="flex-1 bg-transparent text-[#EDEDED] focus:outline-none px-1 text-xs"
                  />
                </div>

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

          {/* Description */}
          <div className="lg:col-span-4 min-w-0">
            <label htmlFor="desc-input" className="block text-xs text-[#A0A0A0] mb-1.5 font-medium">
              What looks wrong?
            </label>
            <input
              id="desc-input"
              type="text"
              value={props.desc}
              onChange={(e) => props.setDesc(e.target.value)}
              placeholder="Navbar overflows on mobile and scrolls sideways"
              className="w-full h-11 bg-[#1C1C1C] rounded-[6px] px-3.5 text-sm text-[#EDEDED] placeholder:text-[#707070] border border-[#363636] transition-colors focus:outline-none focus:border-[#3ECF8E] focus:ring-2 focus:ring-[rgba(62,207,142,0.2)]"
            />
          </div>

          {/* Trigger button */}
          <div className="lg:col-span-3 flex items-center gap-2 lg:pt-[22px] flex-wrap">
            <div className="relative group w-full sm:w-auto flex-1">
              <Btn
                id="run-btn"
                variant="primary"
                size="lg"
                disabled={!props.canRun || props.running}
                onClick={props.onRun}
                className="w-full whitespace-nowrap"
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

        {/* SCOPE & VIEWPORT BAR */}
        <div className="p-3.5 rounded-[8px] bg-[#1C1C1C] border border-[#2E2E2E] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
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
                  onClick={() => {
                    props.setScope(sKey);
                    if (sKey === "region") props.setTool("region");
                    else if (sKey === "element") props.setTool("element");
                    else props.setTool("browse");
                  }}
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

            {props.scope === "site" && (
              <div className="flex items-center gap-1.5 text-xs text-[#A0A0A0] ml-2">
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
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Btn id="sample-btn" variant="ghost" onClick={props.onSample}>
              Use sample bug
            </Btn>
            <div className="h-4 w-px bg-[#2E2E2E]" />
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

        {/* LIVE PREVIEW INTEGRATED CANVAS & TOOLBAR */}
        <div className="pt-2 border-t border-[#2E2E2E] space-y-4">
          {/* Preview Toolbar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#EDEDED] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3ECF8E]" />
                Live interactive canvas
              </span>
              <div className="flex items-center bg-[#1C1C1C] rounded-[6px] border border-[#2E2E2E] p-0.5">
                {(["desktop", "tablet", "mobile"] as const).map((vp) => (
                  <button
                    key={vp}
                    onClick={() => props.setViewport(vp)}
                    className={`px-2.5 py-1 text-xs rounded-[4px] capitalize transition-colors ${
                      props.viewport === vp
                        ? "bg-[#006239] text-[#3ECF8E] font-medium"
                        : "text-[#A0A0A0] hover:text-[#EDEDED]"
                    }`}
                  >
                    {vp}
                  </button>
                ))}
              </div>

              <Btn variant="ghost" size="md" onClick={props.onReload} title="Reload page">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </Btn>
            </div>

            {/* Interaction Tools */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#A0A0A0]">Tool:</span>
              <div className="flex items-center bg-[#1C1C1C] rounded-[6px] border border-[#2E2E2E] p-0.5">
                <button
                  onClick={() => props.setTool("browse")}
                  className={`px-3 py-1 text-xs rounded-[4px] flex items-center gap-1.5 transition-colors ${
                    props.tool === "browse"
                      ? "bg-[#006239] text-[#EDEDED] font-medium border border-[#3ECF8E]"
                      : "text-[#A0A0A0] hover:text-[#EDEDED]"
                  }`}
                >
                  <span>✋</span> Browse
                </button>
                <button
                  onClick={() => {
                    props.setTool("region");
                    props.setScope("region");
                  }}
                  className={`px-3 py-1 text-xs rounded-[4px] flex items-center gap-1.5 transition-colors ${
                    props.tool === "region"
                      ? "bg-[#006239] text-[#EDEDED] font-medium border border-[#3ECF8E]"
                      : "text-[#A0A0A0] hover:text-[#EDEDED]"
                  }`}
                >
                  <span>⌖</span> Select area
                </button>
                <button
                  onClick={() => {
                    props.setTool("element");
                    props.setScope("element");
                  }}
                  className={`px-3 py-1 text-xs rounded-[4px] flex items-center gap-1.5 transition-colors ${
                    props.tool === "element"
                      ? "bg-[#006239] text-[#EDEDED] font-medium border border-[#3ECF8E]"
                      : "text-[#A0A0A0] hover:text-[#EDEDED]"
                  }`}
                >
                  <span>↖</span> Pick element
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Screen & Inspector */}
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {/* Viewport Frame */}
            <div className="flex-1 w-full bg-[#121212] border border-[#2E2E2E] rounded-[8px] p-4 flex flex-col items-center justify-center min-h-[440px] overflow-hidden relative">
              {props.isLoading ? (
                <div className="w-full space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <div
                  className={`relative transition-all duration-300 ${
                    props.viewport === "mobile"
                      ? "w-[280px] rounded-[32px] border-[8px] border-[#1C1C1C] p-1 shadow-2xl bg-[#171717]"
                      : props.viewport === "tablet"
                      ? "w-[500px] rounded-[16px] border-[6px] border-[#1C1C1C] p-1 shadow-xl bg-[#171717]"
                      : "w-full max-w-[820px] rounded-[8px] border border-[#2E2E2E] bg-[#171717]"
                  }`}
                >
                  {props.viewport === "mobile" && (
                    <div className="mx-auto w-12 h-1.5 rounded-full bg-[#232323] my-1" />
                  )}

                  <div
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onClick={handleClick}
                    className={`relative select-none aspect-[16/10] overflow-hidden rounded-[4px] ${
                      props.tool === "region"
                        ? "cursor-crosshair"
                        : props.tool === "element"
                        ? "cursor-pointer"
                        : "cursor-default"
                    }`}
                  >
                    {/* Simulated live site DOM display */}
                    <div className="w-full h-full bg-[#171717] p-4 text-[#EDEDED] flex flex-col justify-between pointer-events-none">
                      <header className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
                        <div className="font-bold text-sm tracking-tight text-[#3ECF8E]">
                          Acme Shop Live
                        </div>
                        <div className="flex gap-3 text-xs text-[#A0A0A0]">
                          <span>Home</span>
                          <span>Catalog</span>
                          <span>Categories</span>
                        </div>
                      </header>
                      <div className="my-auto p-4 rounded bg-[#1C1C1C] border border-[#2E2E2E] space-y-2">
                        <h3 className="font-medium text-base text-[#EDEDED]">
                          Live Headless Preview
                        </h3>
                        <p className="text-xs text-[#A0A0A0] font-mono truncate">
                          {props.previewUrl}
                        </p>
                        <div className="h-7 w-32 bg-[#006239] rounded text-[11px] text-[#3ECF8E] font-medium flex items-center justify-center">
                          Active Sandbox
                        </div>
                      </div>
                      <footer className="text-[10px] text-[#707070] pt-2 border-t border-[#2E2E2E] flex justify-between">
                        <span>Viewport: {dims.w}×{dims.h}px</span>
                        <span>Playwright Sandboxed</span>
                      </footer>
                    </div>

                    {/* SVG overlay for region and element highlights */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox={`0 0 ${dims.w} ${dims.h}`}
                      preserveAspectRatio="none"
                    >
                      {props.region && (
                        <g>
                          <rect
                            x={props.region.x}
                            y={props.region.y}
                            width={props.region.width}
                            height={props.region.height}
                            fill="rgba(62,207,142,0.12)"
                            stroke="#3ECF8E"
                            strokeWidth="1.5"
                            strokeDasharray="4 2"
                          />
                          {[
                            [props.region.x, props.region.y],
                            [props.region.x + props.region.width, props.region.y],
                            [props.region.x, props.region.y + props.region.height],
                            [props.region.x + props.region.width, props.region.y + props.region.height],
                          ].map(([hx, hy], idx) => (
                            <rect
                              key={idx}
                              x={hx - 3}
                              y={hy - 3}
                              width="6"
                              height="6"
                              fill="#3ECF8E"
                              stroke="#121212"
                              strokeWidth="1"
                            />
                          ))}
                        </g>
                      )}

                      {props.tool === "element" && hoveredElement && (
                        <rect
                          x={hoveredElement.rect.x}
                          y={hoveredElement.rect.y}
                          width={hoveredElement.rect.width}
                          height={hoveredElement.rect.height}
                          fill="rgba(62,207,142,0.15)"
                          stroke="#3ECF8E"
                          strokeWidth="2"
                        />
                      )}

                      {props.pickedElement && (
                        <rect
                          x={props.pickedElement.rect.x}
                          y={props.pickedElement.rect.y}
                          width={props.pickedElement.rect.width}
                          height={props.pickedElement.rect.height}
                          fill="rgba(62,207,142,0.20)"
                          stroke="#3ECF8E"
                          strokeWidth="2"
                        />
                      )}
                    </svg>

                    {props.tool === "element" && hoveredElement && (
                      <div className="absolute top-2 left-2 bg-[#1C1C1C] border border-[#3ECF8E] text-[11px] font-mono text-[#3ECF8E] px-2 py-1 rounded shadow-lg pointer-events-none z-10">
                        {hoveredElement.selector}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selection Inspector Sidebar */}
            <div className="w-full lg:w-[320px] bg-[#1C1C1C] border border-[#2E2E2E] rounded-[8px] p-4 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#2E2E2E]">
                  <h3 className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider">
                    Selection Inspector
                  </h3>
                  <span className="text-[11px] font-mono text-[#3ECF8E]">
                    {props.tool === "region" ? "Area mode" : props.tool === "element" ? "Element mode" : "Browse mode"}
                  </span>
                </div>

                {props.tool === "region" && (
                  <div className="mt-3 space-y-2 text-xs">
                    <p className="text-[11px] text-[#A0A0A0]">Drag on the preview to set testing box:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-[#707070]">X</label>
                        <input
                          type="number"
                          value={props.region ? props.region.x : 0}
                          onChange={(e) =>
                            props.setRegion({
                              x: Number(e.target.value),
                              y: props.region?.y ?? 0,
                              width: props.region?.width ?? 100,
                              height: props.region?.height ?? 100,
                            })
                          }
                          className="w-full h-8 bg-[#121212] border border-[#363636] rounded px-2 font-mono text-[#EDEDED]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#707070]">Y</label>
                        <input
                          type="number"
                          value={props.region ? props.region.y : 0}
                          onChange={(e) =>
                            props.setRegion({
                              x: props.region?.x ?? 0,
                              y: Number(e.target.value),
                              width: props.region?.width ?? 100,
                              height: props.region?.height ?? 100,
                            })
                          }
                          className="w-full h-8 bg-[#121212] border border-[#363636] rounded px-2 font-mono text-[#EDEDED]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#707070]">Width</label>
                        <input
                          type="number"
                          value={props.region ? props.region.width : 0}
                          onChange={(e) =>
                            props.setRegion({
                              x: props.region?.x ?? 0,
                              y: props.region?.y ?? 0,
                              width: Number(e.target.value),
                              height: props.region?.height ?? 100,
                            })
                          }
                          className="w-full h-8 bg-[#121212] border border-[#363636] rounded px-2 font-mono text-[#EDEDED]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#707070]">Height</label>
                        <input
                          type="number"
                          value={props.region ? props.region.height : 0}
                          onChange={(e) =>
                            props.setRegion({
                              x: props.region?.x ?? 0,
                              y: props.region?.y ?? 0,
                              width: props.region?.width ?? 100,
                              height: Number(e.target.value),
                            })
                          }
                          className="w-full h-8 bg-[#121212] border border-[#363636] rounded px-2 font-mono text-[#EDEDED]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {props.tool === "element" && (
                  <div className="mt-3 space-y-2">
                    <span className="text-[11px] text-[#A0A0A0]">Picked element:</span>
                    {props.pickedElement ? (
                      <div className="p-2 rounded bg-[#121212] border border-[#3ECF8E]">
                        <code className="text-xs font-mono text-[#3ECF8E] break-all">
                          {props.pickedElement.selector}
                        </code>
                        <p className="text-[11px] text-[#A0A0A0] mt-1 font-mono">
                          {props.pickedElement.rect.width}×{props.pickedElement.rect.height}px
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 text-center border border-dashed border-[#2E2E2E] rounded text-xs text-[#707070]">
                        Click any element in the preview canvas to lock it
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-[11px] text-[#A0A0A0] mb-1 font-medium">
                    What looks wrong here?
                  </label>
                  <textarea
                    value={props.note}
                    onChange={(e) => props.setNote(e.target.value)}
                    placeholder="e.g. Unwanted horizontal scrollbar or clipping"
                    rows={2}
                    className="w-full bg-[#121212] border border-[#363636] rounded p-2 text-xs text-[#EDEDED] placeholder:text-[#707070] focus:outline-none focus:border-[#3ECF8E]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#2E2E2E]">
                <Btn
                  variant="secondary"
                  size="md"
                  onClick={handleCapture}
                  className="w-full"
                >
                  📸 Capture selection
                </Btn>
                <Btn
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    props.setRegion(null);
                    props.setPickedElement(null);
                  }}
                  className="w-full"
                >
                  Clear selection
                </Btn>
              </div>
            </div>
          </div>

          {/* Captures tray */}
          {props.captures.length > 0 && (
            <div className="pt-3 border-t border-[#2E2E2E]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider">
                  Saved Captures ({props.captures.length})
                </h4>
                <span className="text-[11px] text-[#707070]">
                  Supplied directly to Playwright & Gemma
                </span>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {props.captures.map((cap) => (
                  <div
                    key={cap.id}
                    className="flex-shrink-0 w-44 bg-[#1C1C1C] border border-[#2E2E2E] rounded-[6px] p-2 hover:border-[#363636] transition-colors"
                  >
                    <div
                      onClick={() => props.onZoom(cap.imageUrl || "")}
                      className="w-full h-20 bg-[#121212] rounded border border-[#2E2E2E] overflow-hidden flex items-center justify-center cursor-zoom-in"
                    >
                      <span className="text-xs font-mono text-[#3ECF8E]">
                        {cap.width}×{cap.height}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="truncate text-[#EDEDED] font-medium" title={cap.label}>
                        {cap.label}
                      </span>
                      <button
                        onClick={() => props.onDeleteCapture(cap.id)}
                        className="text-[#707070] hover:text-[#EF4444]"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#A0A0A0]">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cap.includedInTest}
                          onChange={() => props.onToggleCaptureInTest(cap.id)}
                          className="accent-[#3ECF8E]"
                        />
                        <span>Include</span>
                      </label>
                      <button
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = cap.imageUrl || "data:image/svg+xml;utf8,<svg></svg>";
                          a.download = `${cap.id}.png`;
                          a.click();
                        }}
                        className="hover:text-[#3ECF8E]"
                        title="Download"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
