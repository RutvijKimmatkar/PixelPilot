import { useState, useRef } from "react";
import type {
  ViewportKey,
  PreviewTool,
  SelectionRegion,
  PickedElement,
  CaptureItem,
} from "../types/console";
import { Panel, Btn, EmptyState, Skeleton } from "./ui";

interface LivePreviewProps {
  url: string;
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

export function LivePreviewPanel({
  url,
  viewport,
  setViewport,
  tool,
  setTool,
  region,
  setRegion,
  pickedElement,
  setPickedElement,
  note,
  setNote,
  captures,
  onAddCapture,
  onDeleteCapture,
  onToggleCaptureInTest,
  onZoom,
  isLoading,
  onReload,
  previewError,
}: LivePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredElement, setHoveredElement] = useState<{
    selector: string;
    rect: SelectionRegion;
  } | null>(null);

  // Target viewport dimensions
  const dims = {
    desktop: { w: 1280, h: 800 },
    tablet: { w: 768, h: 1024 },
    mobile: { w: 375, h: 812 },
  }[viewport];

  // Mouse interaction handlers for rectangle drawing and element picking
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool !== "region" || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = dims.w / rect.width;
    const x = Math.round((e.clientX - rect.left) * scale);
    const y = Math.round((e.clientY - rect.top) * scale);
    setIsDrawing(true);
    setStartPos({ x, y });
    setRegion({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = dims.w / rect.width;
    const currentX = Math.round((e.clientX - rect.left) * scale);
    const currentY = Math.round((e.clientY - rect.top) * scale);

    if (tool === "region" && isDrawing && startPos) {
      const minX = Math.min(startPos.x, currentX);
      const minY = Math.min(startPos.y, currentY);
      const w = Math.abs(currentX - startPos.x);
      const h = Math.abs(currentY - startPos.y);
      setRegion({ x: minX, y: minY, width: w, height: h });
    } else if (tool === "element") {
      // Emulate element hover highlight over simulated page DOM targets
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
    if (tool === "region" && isDrawing) {
      setIsDrawing(false);
      setStartPos(null);
    }
  };

  const handleClick = () => {
    if (tool === "element" && hoveredElement) {
      setPickedElement({
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
        tool === "region" && region
          ? `Region ${region.width}×${region.height}px`
          : tool === "element" && pickedElement
          ? `Element: ${pickedElement.selector}`
          : `Full Viewport (${dims.w}px)`,
      imageUrl: "",
      width: region ? region.width : dims.w,
      height: region ? region.height : dims.h,
      timestamp: Date.now(),
      mode: tool === "region" ? "region" : tool === "element" ? "element" : "viewport",
      includedInTest: true,
      selector: pickedElement?.selector,
      region: region ?? undefined,
    };
    onAddCapture(newCap);
  };

  return (
    <Panel
      id="preview-section"
      title="Live preview (Playwright session)"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Viewport switch */}
          <div className="flex items-center bg-[#1C1C1C] rounded-[6px] border border-[#2E2E2E] p-0.5">
            {(["desktop", "tablet", "mobile"] as const).map((vp) => (
              <button
                key={vp}
                onClick={() => setViewport(vp)}
                className={`px-2.5 py-1 text-xs rounded-[4px] capitalize transition-colors ${
                  viewport === vp
                    ? "bg-[#006239] text-[#3ECF8E] font-medium"
                    : "text-[#A0A0A0] hover:text-[#EDEDED]"
                }`}
              >
                {vp}
              </button>
            ))}
          </div>

          <Btn variant="ghost" size="md" onClick={onReload} title="Reload page">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </Btn>

          {/* Current URL mono strip */}
          <div className="hidden md:flex items-center gap-1.5 h-8 px-3 rounded-[6px] bg-[#121212] border border-[#2E2E2E] text-xs font-mono text-[#A0A0A0] max-w-xs truncate">
            <span className="text-[#3ECF8E]">●</span>
            <span className="truncate">{url || "No target loaded"}</span>
          </div>

          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#A0A0A0] hover:text-[#3ECF8E] transition-colors font-mono"
            >
              <span>Open in tab</span>
              <span>↗</span>
            </a>
          )}
        </div>
      }
    >
      {/* Toolbar row: tool switch */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-[#2E2E2E] flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#A0A0A0] font-medium">Tool mode:</span>
          <div className="flex items-center bg-[#1C1C1C] rounded-[6px] border border-[#2E2E2E] p-0.5">
            <button
              onClick={() => setTool("browse")}
              className={`px-3 py-1 text-xs rounded-[4px] flex items-center gap-1.5 transition-colors ${
                tool === "browse"
                  ? "bg-[#006239] text-[#EDEDED] font-medium border border-[#3ECF8E]"
                  : "text-[#A0A0A0] hover:text-[#EDEDED]"
              }`}
            >
              <span>✋</span> Browse
            </button>
            <button
              onClick={() => setTool("region")}
              className={`px-3 py-1 text-xs rounded-[4px] flex items-center gap-1.5 transition-colors ${
                tool === "region"
                  ? "bg-[#006239] text-[#EDEDED] font-medium border border-[#3ECF8E]"
                  : "text-[#A0A0A0] hover:text-[#EDEDED]"
              }`}
            >
              <span>⌖</span> Select area
            </button>
            <button
              onClick={() => setTool("element")}
              className={`px-3 py-1 text-xs rounded-[4px] flex items-center gap-1.5 transition-colors ${
                tool === "element"
                  ? "bg-[#006239] text-[#EDEDED] font-medium border border-[#3ECF8E]"
                  : "text-[#A0A0A0] hover:text-[#EDEDED]"
              }`}
            >
              <span>↖</span> Pick element
            </button>
          </div>
        </div>

        <div className="text-xs text-[#707070] font-mono">
          Canvas: {dims.w}×{dims.h}px ({viewport})
        </div>
      </div>

      {/* Main Preview Container & Selection Sidebar */}
      {!url ? (
        <EmptyState>
          <div className="py-8">
            <p className="text-sm font-medium text-[#EDEDED]">No preview active</p>
            <p className="text-xs text-[#707070] mt-1">
              Enter a URL or port and click "Load preview" to view and interact with your site here.
            </p>
          </div>
        </EmptyState>
      ) : previewError ? (
        <div className="p-6 rounded-[8px] bg-[rgba(239,68,68,0.1)] border border-[#EF4444] text-center space-y-2">
          <p className="text-sm font-medium text-[#EF4444]">Failed to load preview</p>
          <p className="text-xs text-[#A0A0A0] max-w-md mx-auto">{previewError}</p>
          <Btn variant="secondary" size="md" onClick={onReload} className="mt-2">
            Retry loading
          </Btn>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Framed Canvas Area */}
          <div className="flex-1 w-full bg-[#121212] border border-[#2E2E2E] rounded-[8px] p-4 flex flex-col items-center justify-center min-h-[460px] overflow-hidden relative">
            {isLoading ? (
              <div className="w-full space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div
                className={`relative transition-all duration-300 ${
                  viewport === "mobile"
                    ? "w-[280px] rounded-[32px] border-[8px] border-[#1C1C1C] p-1 shadow-2xl bg-[#171717]"
                    : viewport === "tablet"
                    ? "w-[520px] rounded-[16px] border-[6px] border-[#1C1C1C] p-1 shadow-xl bg-[#171717]"
                    : "w-full max-w-[840px] rounded-[8px] border border-[#2E2E2E] bg-[#171717]"
                }`}
              >
                {viewport === "mobile" && (
                  <div className="mx-auto w-12 h-1.5 rounded-full bg-[#232323] my-1" />
                )}

                {/* Rendered frame container with SVG interaction overlay */}
                <div
                  ref={containerRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onClick={handleClick}
                  className={`relative select-none aspect-[16/10] overflow-hidden rounded-[4px] ${
                    tool === "region"
                      ? "cursor-crosshair"
                      : tool === "element"
                      ? "cursor-pointer"
                      : "cursor-default"
                  }`}
                >
                  {/* High fidelity simulation mock site DOM view */}
                  <div className="w-full h-full bg-[#171717] p-4 text-[#EDEDED] flex flex-col justify-between pointer-events-none">
                    <header className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
                      <div className="font-bold text-sm tracking-tight text-[#3ECF8E]">
                        Acme Live
                      </div>
                      <div className="flex gap-3 text-xs text-[#A0A0A0]">
                        <span>Home</span>
                        <span>Shop</span>
                        <span>Sale</span>
                        <span>About</span>
                      </div>
                    </header>
                    <div className="my-auto p-4 rounded bg-[#1C1C1C] border border-[#2E2E2E] space-y-2">
                      <h3 className="font-medium text-base text-[#EDEDED]">
                        Live Interactive Target
                      </h3>
                      <p className="text-xs text-[#A0A0A0]">
                        Target URL: {url}
                      </p>
                      <div className="h-8 w-28 bg-[#006239] rounded text-[11px] text-[#3ECF8E] font-medium flex items-center justify-center">
                        Active Sandbox
                      </div>
                    </div>
                    <footer className="text-[10px] text-[#707070] pt-2 border-t border-[#2E2E2E] flex justify-between">
                      <span>Responsive Viewport: {dims.w}px</span>
                      <span>Playwright Isolated Process</span>
                    </footer>
                  </div>

                  {/* SVG Overlay: Selection Region & Hovered Element */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox={`0 0 ${dims.w} ${dims.h}`}
                    preserveAspectRatio="none"
                  >
                    {/* Drawn rectangle for Selected Area */}
                    {region && (
                      <g>
                        <rect
                          x={region.x}
                          y={region.y}
                          width={region.width}
                          height={region.height}
                          fill="rgba(62,207,142,0.10)"
                          stroke="#3ECF8E"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                        />
                        {/* 8 resize handle anchors */}
                        {[
                          [region.x, region.y],
                          [region.x + region.width / 2, region.y],
                          [region.x + region.width, region.y],
                          [region.x, region.y + region.height / 2],
                          [region.x + region.width, region.y + region.height / 2],
                          [region.x, region.y + region.height],
                          [region.x + region.width / 2, region.y + region.height],
                          [region.x + region.width, region.y + region.height],
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

                    {/* Element hover or picked highlight */}
                    {tool === "element" && hoveredElement && (
                      <g>
                        <rect
                          x={hoveredElement.rect.x}
                          y={hoveredElement.rect.y}
                          width={hoveredElement.rect.width}
                          height={hoveredElement.rect.height}
                          fill="rgba(62,207,142,0.15)"
                          stroke="#3ECF8E"
                          strokeWidth="2"
                        />
                      </g>
                    )}

                    {pickedElement && (
                      <g>
                        <rect
                          x={pickedElement.rect.x}
                          y={pickedElement.rect.y}
                          width={pickedElement.rect.width}
                          height={pickedElement.rect.height}
                          fill="rgba(62,207,142,0.20)"
                          stroke="#3ECF8E"
                          strokeWidth="2"
                        />
                      </g>
                    )}
                  </svg>

                  {/* Element Hover Tooltip */}
                  {tool === "element" && hoveredElement && (
                    <div
                      className="absolute top-2 left-2 bg-[#1C1C1C] border border-[#3ECF8E] text-[11px] font-mono text-[#3ECF8E] px-2 py-1 rounded shadow-lg pointer-events-none z-10"
                    >
                      {hoveredElement.selector}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Selection Details (320px) */}
          <div className="w-full lg:w-[320px] bg-[#1C1C1C] border border-[#2E2E2E] rounded-[8px] p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#2E2E2E]">
                <h3 className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider">
                  Selection Inspector
                </h3>
                <span className="text-[11px] font-mono text-[#3ECF8E]">
                  {tool === "region" ? "Area mode" : tool === "element" ? "Element mode" : "Browse mode"}
                </span>
              </div>

              {/* Area mode: Editable numeric coordinates */}
              {tool === "region" && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] text-[#A0A0A0]">X (px)</label>
                      <input
                        type="number"
                        value={region ? region.x : 0}
                        onChange={(e) =>
                          setRegion({
                            x: Number(e.target.value),
                            y: region?.y ?? 0,
                            width: region?.width ?? 100,
                            height: region?.height ?? 100,
                          })
                        }
                        className="w-full h-8 bg-[#121212] border border-[#363636] rounded px-2 font-mono text-[#EDEDED]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#A0A0A0]">Y (px)</label>
                      <input
                        type="number"
                        value={region ? region.y : 0}
                        onChange={(e) =>
                          setRegion({
                            x: region?.x ?? 0,
                            y: Number(e.target.value),
                            width: region?.width ?? 100,
                            height: region?.height ?? 100,
                          })
                        }
                        className="w-full h-8 bg-[#121212] border border-[#363636] rounded px-2 font-mono text-[#EDEDED]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#A0A0A0]">Width</label>
                      <input
                        type="number"
                        value={region ? region.width : 0}
                        onChange={(e) =>
                          setRegion({
                            x: region?.x ?? 0,
                            y: region?.y ?? 0,
                            width: Number(e.target.value),
                            height: region?.height ?? 100,
                          })
                        }
                        className="w-full h-8 bg-[#121212] border border-[#363636] rounded px-2 font-mono text-[#EDEDED]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#A0A0A0]">Height</label>
                      <input
                        type="number"
                        value={region ? region.height : 0}
                        onChange={(e) =>
                          setRegion({
                            x: region?.x ?? 0,
                            y: region?.y ?? 0,
                            width: region?.width ?? 100,
                            height: Number(e.target.value),
                          })
                        }
                        className="w-full h-8 bg-[#121212] border border-[#363636] rounded px-2 font-mono text-[#EDEDED]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Element mode: Selector chip */}
              {tool === "element" && (
                <div className="mt-3 space-y-2">
                  <span className="text-[11px] text-[#A0A0A0]">Target element:</span>
                  {pickedElement ? (
                    <div className="p-2 rounded bg-[#121212] border border-[#3ECF8E]">
                      <code className="text-xs font-mono text-[#3ECF8E] break-all">
                        {pickedElement.selector}
                      </code>
                      <p className="text-[11px] text-[#A0A0A0] mt-1 font-mono">
                        {pickedElement.rect.width}×{pickedElement.rect.height}px
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 text-center border border-dashed border-[#2E2E2E] rounded text-xs text-[#707070]">
                      Click any element in the preview canvas to lock it
                    </div>
                  )}
                </div>
              )}

              {/* Note field */}
              <div className="mt-4">
                <label className="block text-[11px] text-[#A0A0A0] mb-1 font-medium">
                  What looks wrong here? (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Unwanted horizontal scrollbar or clipping"
                  rows={2}
                  className="w-full bg-[#121212] border border-[#363636] rounded p-2 text-xs text-[#EDEDED] placeholder:text-[#707070] focus:outline-none focus:border-[#3ECF8E]"
                />
              </div>
            </div>

            {/* Sidebar actions: Capture & Clear */}
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
                  setRegion(null);
                  setPickedElement(null);
                }}
                className="w-full"
              >
                Clear selection
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Captures tray under the preview */}
      {captures.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[#2E2E2E]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-[#EDEDED] uppercase tracking-wider">
              Saved Captures ({captures.length})
            </h4>
            <span className="text-[11px] text-[#707070]">
              Checked captures are supplied to Playwright & Gemma
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {captures.map((cap) => (
              <div
                key={cap.id}
                className="flex-shrink-0 w-48 bg-[#1C1C1C] border border-[#2E2E2E] rounded-[6px] p-2 hover:border-[#363636] transition-colors"
              >
                <div
                  onClick={() => onZoom(cap.imageUrl || "")}
                  className="w-full h-24 bg-[#121212] rounded border border-[#2E2E2E] overflow-hidden flex items-center justify-center cursor-zoom-in"
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
                    onClick={() => onDeleteCapture(cap.id)}
                    className="text-[#707070] hover:text-[#EF4444] transition-colors"
                    title="Delete capture"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-[#A0A0A0]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cap.includedInTest}
                      onChange={() => onToggleCaptureInTest(cap.id)}
                      className="accent-[#3ECF8E]"
                    />
                    <span>Include in test</span>
                  </label>
                  <button
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = cap.imageUrl || "data:image/svg+xml;utf8,<svg></svg>";
                      a.download = `${cap.id}.png`;
                      a.click();
                    }}
                    className="hover:text-[#3ECF8E]"
                    title="Download capture"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
