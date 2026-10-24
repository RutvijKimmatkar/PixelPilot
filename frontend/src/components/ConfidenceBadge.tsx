import type React from "react";

interface ConfidenceBadgeProps {
  confidence: "low" | "medium" | "high";
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, className = "" }) => {
  const config = {
    high: {
      label: "High Confidence",
      bg: "bg-emerald-950/70",
      text: "text-emerald-400",
      border: "border-emerald-800/80",
      dot: "bg-emerald-400",
    },
    medium: {
      label: "Medium Confidence",
      bg: "bg-sky-950/70",
      text: "text-sky-400",
      border: "border-sky-800/80",
      dot: "bg-sky-400",
    },
    low: {
      label: "Low Confidence",
      bg: "bg-amber-950/70",
      text: "text-amber-400",
      border: "border-amber-800/80",
      dot: "bg-amber-400",
    },
  }[confidence] || {
    label: `${confidence} Confidence`,
    bg: "bg-slate-900",
    text: "text-slate-300",
    border: "border-slate-800",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border shadow-sm ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default ConfidenceBadge;
