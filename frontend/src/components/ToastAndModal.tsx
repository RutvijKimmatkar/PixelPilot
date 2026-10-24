import { useEffect } from "react";

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#181716] border border-[#282624] text-[#FAF6EE] text-xs font-medium px-4 py-2.5 rounded-[8px] shadow-[0_12px_36px_rgba(24,23,22,0.3)] flex items-center gap-2.5 z-50 animate-slide-in backdrop-blur-md"
    >
      <span className="w-4 h-4 rounded-full bg-[rgba(5,150,105,0.2)] text-[#34D399] flex items-center justify-center font-bold text-[10px]">
        ✓
      </span>
      <span>{message}</span>
    </div>
  );
}

interface ZoomModalProps {
  src: string | null;
  onClose: () => void;
}

export function ZoomModal({ src, onClose }: ZoomModalProps) {
  useEffect(() => {
    if (!src) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 bg-[#181716]/80 backdrop-blur-xs z-50 flex items-center justify-center p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl max-h-[90vh] bg-[#FAF6EE] border border-[#DAD2C1] rounded-[12px] p-2 overflow-hidden shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label="Close zoom modal"
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#F2ECE0] text-[#181716] hover:bg-[#E8E0D0] border border-[#DAD2C1] flex items-center justify-center text-sm font-bold transition-colors shadow-md"
        >
          ✕
        </button>
        <img
          src={src}
          alt="Zoomed test screenshot inspection"
          className="max-h-[82vh] w-auto mx-auto object-contain rounded-[8px]"
        />
        <div className="p-3 text-center text-xs text-[#6E7F99] font-mono">
          Press Esc or click outside to dismiss
        </div>
      </div>
    </div>
  );
}
