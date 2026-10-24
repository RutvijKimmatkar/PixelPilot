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
  desktopShot?: string;
  mobileShot?: string;
}

function createSvgThumbnail(
  region: SelectionRegion | null,
  dims: { w: number; h: number },
  url: string,
  selector?: string
): string {
  const w = region?.width || dims.w;
  const h = region?.height || dims.h;
  let host = "target";
  try {
    host = new URL(url).hostname;
  } catch {
    // fallback
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240" fill="#FAF6EE">
    <rect width="100%" height="100%" fill="#FAF6EE" stroke="#DAD2C1" stroke-width="2"/>
    <rect x="20" y="20" width="360" height="200" rx="8" fill="#F7F4EB" stroke="#181716" stroke-dasharray="4 2"/>
    <text x="35" y="60" font-family="monospace" font-size="14" font-weight="bold" fill="#181716">${host}</text>
    <text x="35" y="90" font-family="monospace" font-size="12" fill="#3B4D66">${w}×${h}px ${region ? "Region Crop" : "Viewport"}</text>
    ${selector ? `<text x="35" y="120" font-family="monospace" font-size="11" fill="#059669">${selector.slice(0, 35)}</text>` : ""}
    <rect x="35" y="150" width="90" height="26" rx="4" fill="#181716"/>
    <text x="46" y="167" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FAF7F0">CAPTURED</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function generateCropImage(
  shot: string | undefined,
  region: SelectionRegion | null,
  dims: { w: number; h: number },
  url: string,
  selector?: string
): Promise<string> {
  return new Promise((resolve) => {
    if (shot && region && region.width > 0 && region.height > 0) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(20, region.width);
          canvas.height = Math.max(20, region.height);
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const scaleX = img.naturalWidth / dims.w;
            const scaleY = img.naturalHeight / dims.h;
            ctx.drawImage(
              img,
              region.x * scaleX,
              region.y * scaleY,
              region.width * scaleX,
              region.height * scaleY,
              0,
              0,
              canvas.width,
              canvas.height
            );
            resolve(canvas.toDataURL("image/png"));
            return;
          }
        } catch {
          // fallback
        }
        resolve(createSvgThumbnail(region, dims, url, selector));
      };
      img.onerror = () => {
        resolve(createSvgThumbnail(region, dims, url, selector));
      };
      img.src = shot;
    } else {
      resolve(createSvgThumbnail(region, dims, url, selector));
    }
  });
}

export function CombinedTargetAndPreview(props: CombinedTargetAndPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredElement, setHoveredElement] = useState<{
    selector: string;
    rect: SelectionRegion;
  } | null>(null);

  const [previewMode, setPreviewMode] = useState<"interactive" | "snapshot">("interactive");
  const [useProxy, setUseProxy] = useState<boolean>(true);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Target viewport pixel dimensions
  const dims = {
    desktop: { w: 1280, h: 800 },
    tablet: { w: 768, h: 1024 },
    mobile: { w: 375, h: 812 },
  }[props.viewport];

  const isLocalhost =
    props.previewUrl.startsWith("http://localhost") ||
    props.previewUrl.startsWith("http://127.0.0.1") ||
    props.previewUrl.startsWith("http://0.0.0.0");

  const iframeSrc =
    isLocalhost || !useProxy
      ? props.previewUrl
      : `http://localhost:5001/api/proxy?url=${encodeURIComponent(props.previewUrl)}`;

  const activeSnapshot =
    props.viewport === "mobile"
      ? props.mobileShot || props.desktopShot
      : props.desktopShot || props.mobileShot;

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

  const handleCapture = async () => {
    const currentShot = props.viewport === "mobile" ? props.mobileShot : props.desktopShot;
    const imgData = await generateCropImage(
      currentShot,
      props.region,
      dims,
      props.previewUrl,
      props.pickedElement?.selector
    );

    const newCap: CaptureItem = {
      id: `cap_${Date.now()}`,
      label:
        props.tool === "region" && props.region
          ? `Region ${props.region.width}×${props.region.height}px`
          : props.tool === "element" && props.pickedElement
          ? `Element: ${props.pickedElement.selector}`
          : `Full Viewport (${dims.w}px)`,
      imageUrl: imgData,
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
      <section className="relative bg-[#FAF6EE] border border-[#E8E1D3] rounded-[12px] p-6 hover:border-[#DAD2C1] transition-all space-y-6 shadow-[0_2px_12px_rgba(10,25,47,0.04)]">
        {/* HEADER & TARGET MODE */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[28px] sm:text-[32px] leading-tight font-semibold tracking-tight text-[#181716]">
              Test & Preview Live Page
            </h1>
            <p className="text-sm text-[#3B4D66] mt-1 max-w-2xl">
              Inspect your target live, interact or select regions, and run automated Playwright testing.
            </p>
          </div>

          {/* Mode Switch: Public URL | Localhost */}
          <div className="flex items-center p-1 bg-[#F2ECE0] rounded-[8px] border border-[#DAD2C1]">
            <button
              type="button"
              onClick={() => props.setMode("public")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-all ${
                props.mode === "public"
                  ? "bg-[#181716] text-[#FAF7F0] shadow-sm"
                  : "text-[#3B4D66] hover:text-[#181716]"
              }`}
            >
              Public URL
            </button>
            <button
              type="button"
              onClick={() => props.setMode("localhost")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-all ${
                props.mode === "localhost"
                  ? "bg-[#181716] text-[#FAF7F0] shadow-sm"
                  : "text-[#3B4D66] hover:text-[#181716]"
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
                <label htmlFor="url-input" className="block text-xs text-[#3B4D66] mb-1.5 font-medium">
                  Page URL
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-[#6E7F99] pointer-events-none">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </span>
                  <input
                    id="url-input"
                    type="url"
                    value={props.url}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      let val = e.target.value.trim();
                      const matches = val.match(/https?:\/\/[^\s]+/g);
                      if (matches && matches.length > 1) {
                        val = matches[matches.length - 1];
                      }
                      props.setUrl(val);
                    }}
                    placeholder="https://my-site.dev"
                    aria-invalid={!!props.error}
                    className={`w-full h-11 bg-[#F7F4EB] rounded-[6px] pl-10 pr-12 text-sm text-[#181716] font-mono placeholder:text-[#8E9FBA] border transition-colors focus:outline-none focus:border-[#181716] focus:ring-2 focus:ring-[rgba(10,25,47,0.15)] ${
                      props.error ? "border-[#DC2626]" : "border-[#DAD2C1]"
                    }`}
                  />
                  {props.url && (
                    <button
                      type="button"
                      onClick={() => props.setUrl("")}
                      className="absolute right-3 top-3 text-[#6E7F99] hover:text-[#181716] text-xs font-bold px-1.5 py-0.5 rounded hover:bg-[#E8E1D3]"
                      title="Clear URL"
                    >
                      ✕
                    </button>
                  )}
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
                    className="text-xs text-[#181716] font-semibold hover:underline flex items-center gap-1 font-mono"
                  >
                    {props.detectingServers ? <Spinner className="w-3 h-3 text-[#181716]" /> : "⚡"}
                    Detect apps
                  </button>
                </div>
                <div className="flex items-center h-11 bg-[#F7F4EB] rounded-[6px] border border-[#DAD2C1] px-3 font-mono text-sm">
                  <span className="text-[#6E7F99] select-none">http://localhost:</span>
                  <input
                    id="localhost-port"
                    type="number"
                    min="1"
                    max="65535"
                    value={props.port}
                    onChange={(e) => props.setPort(e.target.value)}
                    placeholder="5173"
                    className="w-16 bg-transparent text-[#181716] focus:outline-none px-1"
                  />
                  <span className="text-[#8E9FBA]">/</span>
                  <input
                    type="text"
                    value={props.path}
                    onChange={(e) => props.setPath(e.target.value)}
                    placeholder="path (optional)"
                    className="flex-1 bg-transparent text-[#181716] focus:outline-none px-1 text-xs"
                  />
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
                        className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] bg-[#FAF6EE] border border-[#DAD2C1] text-[#181716] hover:border-[#181716]"
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

          {/* Description */}
          <div className="lg:col-span-4 min-w-0">
            <label htmlFor="desc-input" className="block text-xs text-[#3B4D66] mb-1.5 font-medium">
              What looks wrong?
            </label>
            <input
              id="desc-input"
              type="text"
              value={props.desc}
              onChange={(e) => props.setDesc(e.target.value)}
              placeholder="Navbar overflows on mobile and scrolls sideways"
              className="w-full h-11 bg-[#F7F4EB] rounded-[6px] px-3.5 text-sm text-[#181716] placeholder:text-[#8E9FBA] border border-[#DAD2C1] transition-colors focus:outline-none focus:border-[#181716] focus:ring-2 focus:ring-[rgba(10,25,47,0.15)]"
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
                <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block bg-[#181716] border border-[#282624] text-[11px] text-[#FAF7F0] px-2.5 py-1 rounded shadow-lg whitespace-nowrap z-30">
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
        <div className="p-3.5 rounded-[8px] bg-[#F7F4EB] border border-[#E8E1D3] flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
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
                  onClick={() => {
                    props.setScope(sKey);
                    if (sKey === "region") props.setTool("region");
                    else if (sKey === "element") props.setTool("element");
                    else props.setTool("browse");
                  }}
                  className={`px-2.5 py-1 text-xs rounded-[6px] transition-all font-medium ${
                    props.scope === sKey
                      ? "bg-[#181716] text-[#FAF7F0] shadow-sm font-semibold"
                      : "text-[#3B4D66] hover:bg-[#F2ECE0] hover:text-[#181716]"
                  }`}
                >
                  {sLabel}
                </button>
              ))}
            </div>

            {props.scope === "site" && (
              <div className="flex items-center gap-1.5 text-xs text-[#3B4D66] ml-2">
                <span>Max pages:</span>
                <div className="flex items-center border border-[#DAD2C1] rounded-[6px] overflow-hidden bg-[#FAF6EE]">
                  <button
                    type="button"
                    onClick={() => props.setMaxPages(Math.max(1, props.maxPages - 1))}
                    className="px-2 py-0.5 hover:bg-[#F2ECE0] text-[#181716]"
                  >
                    -
                  </button>
                  <span className="px-2 font-mono text-[#181716]">{props.maxPages}</span>
                  <button
                    type="button"
                    onClick={() => props.setMaxPages(Math.min(25, props.maxPages + 1))}
                    className="px-2 py-0.5 hover:bg-[#F2ECE0] text-[#181716]"
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
            <div className="h-4 w-px bg-[#DAD2C1]" />
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
        <div className="pt-2 border-t border-[#E8E1D3] space-y-4">
          {/* Preview Toolbar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#181716] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#059669] shadow-[0_0_8px_rgba(5,150,105,0.4)]" />
                Live interactive canvas
              </span>

              {/* View Mode: Live Web vs Playwright Snapshot */}
              <div className="flex items-center bg-[#F2ECE0] rounded-[6px] border border-[#DAD2C1] p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewMode("interactive")}
                  className={`px-2.5 py-1 text-xs rounded-[4px] font-medium transition-all ${
                    previewMode === "interactive"
                      ? "bg-[#181716] text-[#FAF7F0] font-semibold shadow-sm"
                      : "text-[#3B4D66] hover:text-[#181716]"
                  }`}
                >
                  🌐 Live Web
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("snapshot")}
                  className={`px-2.5 py-1 text-xs rounded-[4px] font-medium transition-all ${
                    previewMode === "snapshot"
                      ? "bg-[#181716] text-[#FAF7F0] font-semibold shadow-sm"
                      : "text-[#3B4D66] hover:text-[#181716]"
                  }`}
                  title={activeSnapshot ? "View Playwright rendered snapshot" : "Run test to capture Playwright screenshot"}
                >
                  📸 Snapshot
                </button>
              </div>

              {/* Viewport switch */}
              <div className="flex items-center bg-[#F2ECE0] rounded-[6px] border border-[#DAD2C1] p-0.5">
                {(["desktop", "tablet", "mobile"] as const).map((vp) => (
                  <button
                    key={vp}
                    onClick={() => props.setViewport(vp)}
                    className={`px-2.5 py-1 text-xs rounded-[4px] capitalize transition-all ${
                      props.viewport === vp
                        ? "bg-[#181716] text-[#FAF7F0] font-semibold shadow-sm"
                        : "text-[#3B4D66] hover:text-[#181716]"
                    }`}
                  >
                    {vp}
                  </button>
                ))}
              </div>

              {!isLocalhost && previewMode === "interactive" && (
                <button
                  type="button"
                  onClick={() => setUseProxy(!useProxy)}
                  className={`text-[11px] font-mono px-2 py-1 rounded-[4px] border transition-all ${
                    useProxy
                      ? "bg-[#FAF6EE] border-[#DAD2C1] text-[#059669] font-medium"
                      : "bg-[#FAF6EE] border-[#DAD2C1] text-[#6E7F99]"
                  }`}
                  title="Toggle X-Frame-Options & CSP bypass proxy"
                >
                  Proxy: {useProxy ? "On" : "Direct"}
                </button>
              )}

              <Btn
                variant="ghost"
                size="md"
                onClick={() => {
                  setReloadKey((k) => k + 1);
                  props.onReload();
                }}
                title="Reload page"
              >
                <svg className="w-3.5 h-3.5 text-[#181716]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </Btn>

              <a
                href={props.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#6E7F99] hover:text-[#181716] p-1 font-mono flex items-center gap-0.5"
                title="Open target in new tab"
              >
                <span>Open</span>
                <span>↗</span>
              </a>
            </div>

            {/* Interaction Tools */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6E7F99]">Tool:</span>
              <div className="flex items-center bg-[#F2ECE0] rounded-[6px] border border-[#DAD2C1] p-0.5">
                <button
                  onClick={() => props.setTool("browse")}
                  className={`px-3 py-1 text-xs rounded-[4px] flex items-center gap-1.5 transition-all ${
                    props.tool === "browse"
                      ? "bg-[#181716] text-[#FAF7F0] font-semibold shadow-sm"
                      : "text-[#3B4D66] hover:text-[#181716]"
                  }`}
                >
                  <span>✋</span> Browse
                </button>
                <button
                  onClick={() => {
                    props.setTool("region");
                    props.setScope("region");
                  }}
                  className={`px-3 py-1 text-xs rounded-[4px] flex items-center gap-1.5 transition-all ${
                    props.tool === "region"
                      ? "bg-[#181716] text-[#FAF7F0] font-semibold shadow-sm"
                      : "text-[#3B4D66] hover:text-[#181716]"
                  }`}
                >
                  <span>⌖</span> Select area
                </button>
                <button
                  onClick={() => {
                    props.setTool("element");
                    props.setScope("element");
                  }}
                  className={`px-3 py-1 text-xs rounded-[4px] flex items-center gap-1.5 transition-all ${
                    props.tool === "element"
                      ? "bg-[#181716] text-[#FAF7F0] font-semibold shadow-sm"
                      : "text-[#3B4D66] hover:text-[#181716]"
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
            <div className="flex-1 w-full bg-[#F7F4EB] border border-[#DAD2C1] rounded-[8px] p-4 flex flex-col items-center justify-center min-h-[460px] overflow-hidden relative shadow-inner">
              {props.isLoading ? (
                <div className="w-full space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <div
                  className={`relative transition-all duration-300 ${
                    props.viewport === "mobile"
                      ? "w-[300px] h-[580px] rounded-[32px] border-[8px] border-[#181716] p-1 shadow-2xl bg-[#FAF6EE] flex flex-col"
                      : props.viewport === "tablet"
                      ? "w-[520px] h-[600px] rounded-[16px] border-[6px] border-[#181716] p-1 shadow-xl bg-[#FAF6EE] flex flex-col"
                      : "w-full max-w-[840px] h-[520px] rounded-[8px] border border-[#DAD2C1] bg-[#FAF6EE] shadow-sm flex flex-col"
                  }`}
                >
                  {props.viewport === "mobile" && (
                    <div className="mx-auto w-12 h-1.5 rounded-full bg-[#282624] my-1 shrink-0" />
                  )}

                  <div
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onClick={handleClick}
                    className={`relative select-none flex-1 w-full overflow-hidden rounded-[4px] bg-white ${
                      props.tool === "region"
                        ? "cursor-crosshair"
                        : props.tool === "element"
                        ? "cursor-pointer"
                        : "cursor-default"
                    }`}
                  >
                    {/* View Mode: Interactive Iframe vs Playwright Snapshot */}
                    {previewMode === "snapshot" && activeSnapshot ? (
                      <div className="w-full h-full bg-[#FAF6EE] flex items-center justify-center overflow-hidden">
                        <img
                          src={activeSnapshot}
                          alt="Playwright live snapshot"
                          className="w-full h-full object-contain pointer-events-none select-none"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full relative bg-white overflow-hidden">
                        <iframe
                          key={`${props.previewUrl}-${reloadKey}-${useProxy}`}
                          src={iframeSrc}
                          title="Live Target Preview"
                          className={`w-full h-full border-0 bg-white transition-opacity ${
                            props.tool === "browse" ? "pointer-events-auto" : "pointer-events-none"
                          }`}
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        />
                      </div>
                    )}


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
                            fill="rgba(10,25,47,0.12)"
                            stroke="#181716"
                            strokeWidth="2"
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
                              fill="#181716"
                              stroke="#FAF7F0"
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
                          fill="rgba(10,25,47,0.15)"
                          stroke="#181716"
                          strokeWidth="2"
                        />
                      )}

                      {props.pickedElement && (
                        <rect
                          x={props.pickedElement.rect.x}
                          y={props.pickedElement.rect.y}
                          width={props.pickedElement.rect.width}
                          height={props.pickedElement.rect.height}
                          fill="rgba(10,25,47,0.22)"
                          stroke="#181716"
                          strokeWidth="2"
                        />
                      )}
                    </svg>

                    {props.tool === "element" && hoveredElement && (
                      <div className="absolute top-2 left-2 bg-[#181716] border border-[#282624] text-[11px] font-mono text-[#FAF7F0] px-2 py-1 rounded shadow-lg pointer-events-none z-10">
                        {hoveredElement.selector}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selection Inspector Sidebar */}
            <div className="w-full lg:w-[320px] bg-[#FAF6EE] border border-[#DAD2C1] rounded-[8px] p-4 flex flex-col justify-between space-y-4 shadow-sm">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E8E1D3]">
                  <h3 className="text-xs font-bold text-[#181716] uppercase tracking-wider">
                    Selection Inspector
                  </h3>
                  <span className="text-[11px] font-mono font-medium text-[#181716]">
                    {props.tool === "region" ? "Area mode" : props.tool === "element" ? "Element mode" : "Browse mode"}
                  </span>
                </div>

                {props.tool === "region" && (
                  <div className="mt-3 space-y-2 text-xs">
                    <p className="text-[11px] text-[#3B4D66]">Drag on the preview to set testing box:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-[#6E7F99]">X</label>
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
                          className="w-full h-8 bg-[#F7F4EB] border border-[#DAD2C1] rounded px-2 font-mono text-[#181716] focus:outline-none focus:border-[#181716]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#6E7F99]">Y</label>
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
                          className="w-full h-8 bg-[#F7F4EB] border border-[#DAD2C1] rounded px-2 font-mono text-[#181716] focus:outline-none focus:border-[#181716]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#6E7F99]">Width</label>
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
                          className="w-full h-8 bg-[#F7F4EB] border border-[#DAD2C1] rounded px-2 font-mono text-[#181716] focus:outline-none focus:border-[#181716]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#6E7F99]">Height</label>
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
                          className="w-full h-8 bg-[#F7F4EB] border border-[#DAD2C1] rounded px-2 font-mono text-[#181716] focus:outline-none focus:border-[#181716]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {props.tool === "element" && (
                  <div className="mt-3 space-y-2">
                    <span className="text-[11px] text-[#3B4D66]">Picked element:</span>
                    {props.pickedElement ? (
                      <div className="p-2 rounded bg-[#F7F4EB] border border-[#181716] shadow-xs">
                        <code className="text-xs font-mono font-medium text-[#181716] break-all">
                          {props.pickedElement.selector}
                        </code>
                        <p className="text-[11px] text-[#3B4D66] mt-1 font-mono">
                          {props.pickedElement.rect.width}×{props.pickedElement.rect.height}px
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 text-center border border-dashed border-[#DAD2C1] rounded text-xs text-[#6E7F99]">
                        Click any element in the preview canvas to lock it
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-[11px] text-[#3B4D66] mb-1 font-medium">
                    What looks wrong here?
                  </label>
                  <textarea
                    value={props.note}
                    onChange={(e) => props.setNote(e.target.value)}
                    placeholder="e.g. Unwanted horizontal scrollbar or clipping"
                    rows={2}
                    className="w-full bg-[#F7F4EB] border border-[#DAD2C1] rounded p-2 text-xs text-[#181716] placeholder:text-[#8E9FBA] focus:outline-none focus:border-[#181716]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#E8E1D3]">
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
            <div className="pt-3 border-t border-[#E8E1D3]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-[#181716] uppercase tracking-wider">
                  Saved Captures ({props.captures.length})
                </h4>
                <span className="text-[11px] text-[#6E7F99]">
                  Supplied directly to Playwright & Gemma
                </span>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {props.captures.map((cap) => (
                  <div
                    key={cap.id}
                    className="flex-shrink-0 w-44 bg-[#FAF6EE] border border-[#DAD2C1] rounded-[6px] p-2 hover:border-[#181716] transition-colors shadow-xs"
                  >
                    <div
                      onClick={() => props.onZoom(cap.imageUrl || "")}
                      className="w-full h-20 bg-[#F7F4EB] rounded border border-[#E8E1D3] overflow-hidden flex items-center justify-center cursor-zoom-in relative"
                    >
                      {cap.imageUrl ? (
                        <img
                          src={cap.imageUrl}
                          alt={cap.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-mono font-medium text-[#181716]">
                          {cap.width}×{cap.height}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="truncate text-[#181716] font-semibold" title={cap.label}>
                        {cap.label}
                      </span>
                      <button
                        onClick={() => props.onDeleteCapture(cap.id)}
                        className="text-[#6E7F99] hover:text-[#DC2626]"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#3B4D66]">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cap.includedInTest}
                          onChange={() => props.onToggleCaptureInTest(cap.id)}
                          className="accent-[#181716]"
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
                        className="hover:text-[#181716] font-medium"
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
