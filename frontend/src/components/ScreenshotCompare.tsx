import { useEffect, useState } from "react";
import type React from "react";

export interface ScreenshotCompareProps {
  screenshots: {
    desktop: string;
    mobile: string;
    desktopWidth: number;
    mobileWidth: number;
  };
}

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ||
  "http://localhost:3000";

function resolveImageUrl(rawPath: string): string {
  if (!rawPath) return "";
  if (
    rawPath.startsWith("data:") ||
    rawPath.startsWith("http://") ||
    rawPath.startsWith("https://")
  ) {
    return rawPath;
  }
  const cleanPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  return `${API_BASE_URL}${cleanPath}`;
}

interface ImagePanelProps {
  title: string;
  url: string;
  onOpenLightbox: () => void;
}

const ImagePanel: React.FC<ImagePanelProps> = ({ title, url, onOpenLightbox }) => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  return (
    <div className="flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-lg group">
      {/* Panel Top Bar */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>{title}</span>
        </div>

        <button
          type="button"
          onClick={onOpenLightbox}
          className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
        >
          <span>🔍 View Fullscreen</span>
        </button>
      </div>

      {/* Scrollable Viewport Container */}
      <div className="relative max-h-[480px] min-h-[260px] overflow-y-auto bg-slate-950 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Loading Skeleton */}
        {!loaded && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 animate-pulse text-slate-500 gap-2 p-8">
            <span className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-sky-400 animate-spin" />
            <span className="text-xs font-mono">Loading viewport capture...</span>
          </div>
        )}

        {/* Failure Message */}
        {hasError ? (
          <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center min-h-[240px] space-y-2">
            <span className="text-2xl text-amber-400 select-none">⚠</span>
            <p className="font-semibold text-slate-300">Screenshot preview unavailable</p>
            <p className="text-slate-500 max-w-xs">
              Unable to load image asset. The target sandbox may not have produced a visible render frame.
            </p>
          </div>
        ) : (
          <div
            onClick={onOpenLightbox}
            className="cursor-zoom-in relative block w-full transition-transform duration-200"
          >
            <img
              src={url}
              alt={title}
              onLoad={() => setLoaded(true)}
              onError={() => {
                setLoaded(true);
                setHasError(true);
              }}
              className={`w-full h-auto block object-top transition-opacity duration-300 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
            />
            {/* Subtle Hover Overlay Hint */}
            <div className="absolute inset-0 bg-sky-950/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
              <span className="bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-full border border-slate-700 shadow-xl font-medium">
                Click to expand lightbox
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ScreenshotCompare: React.FC<ScreenshotCompareProps> = ({ screenshots }) => {
  const [activeLightbox, setActiveLightbox] = useState<{
    title: string;
    url: string;
  } | null>(null);

  const desktopUrl = resolveImageUrl(screenshots.desktop);
  const mobileUrl = resolveImageUrl(screenshots.mobile);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveLightbox(null);
      }
    };
    if (activeLightbox) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeLightbox]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Visual Screenshot Comparison
        </h3>
        <span className="text-[11px] text-slate-500 font-mono">
          Scroll inside panels for full page height
        </span>
      </div>

      {/* Two panels side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <ImagePanel
          title={`Desktop - ${screenshots.desktopWidth}px`}
          url={desktopUrl}
          onOpenLightbox={() =>
            setActiveLightbox({
              title: `Desktop Viewport (${screenshots.desktopWidth}px)`,
              url: desktopUrl,
            })
          }
        />

        <ImagePanel
          title={`Mobile - ${screenshots.mobileWidth}px`}
          url={mobileUrl}
          onOpenLightbox={() =>
            setActiveLightbox({
              title: `Mobile Viewport (${screenshots.mobileWidth}px)`,
              url: mobileUrl,
            })
          }
        />
      </div>

      {/* Full-screen Lightbox Modal */}
      {activeLightbox && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveLightbox(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-fade-in cursor-zoom-out"
        >
          {/* Lightbox Header Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between pb-3 text-white border-b border-slate-800 cursor-default"
          >
            <div className="flex items-center gap-2">
              <span className="text-sky-400 font-bold">◈</span>
              <span className="font-semibold text-sm">{activeLightbox.title}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Press Esc or click backdrop to close
              </span>
              <button
                type="button"
                onClick={() => setActiveLightbox(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
                aria-label="Close lightbox"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Lightbox Image Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 cursor-default"
          >
            <img
              src={activeLightbox.url}
              alt={activeLightbox.title}
              className="max-h-[85vh] max-w-full w-auto h-auto object-contain rounded-lg shadow-2xl border border-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenshotCompare;
