import type { ReactNode, ButtonHTMLAttributes } from "react";

export function Btn({
  variant = "ghost",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "md" | "lg";
}) {
  const v = {
    primary:
      "bg-[#181716] border border-[#181716] text-[#FAF6EE] font-semibold hover:bg-[#282624] hover:border-[#282624] shadow-[0_2px_8px_rgba(24,23,22,0.18)] focus-visible:outline-2 focus-visible:outline-[#181716] focus-visible:outline-offset-2 transition-all active:scale-[0.98]",
    secondary:
      "bg-[#FAF6EE] border border-[#D8CEBC] text-[#181716] font-medium hover:bg-[#F0E8DA] hover:border-[#C7BBA2] shadow-xs focus-visible:outline-2 focus-visible:outline-[#181716] focus-visible:outline-offset-2 transition-all",
    ghost:
      "bg-transparent border border-transparent text-[#45423E] hover:text-[#181716] hover:bg-[#F0E8DA] focus-visible:outline-2 focus-visible:outline-[#181716] focus-visible:outline-offset-2 transition-colors",
    outline:
      "bg-transparent border border-[#D8CEBC] text-[#181716] hover:bg-[#F0E8DA] hover:border-[#C7BBA2] focus-visible:outline-2 focus-visible:outline-[#181716] focus-visible:outline-offset-2 transition-all",
  }[variant];

  const s = size === "lg" ? "h-11 px-5 text-sm" : "h-9 px-3 text-xs";

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-[6px] font-medium transition-colors duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed ${s} ${v} ${className}`}
      {...props}
    />
  );
}

export function Chip({
  on,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      className={`h-7 px-3 rounded-full text-xs font-medium transition-all duration-150 border focus-visible:outline-2 focus-visible:outline-[#181716] focus-visible:outline-offset-2 ${
        on
          ? "bg-[#181716] border-[#181716] text-[#FAF6EE] shadow-sm"
          : "bg-[#FAF6EE] border-[#D8CEBC] text-[#54504C] hover:bg-[#F0E8DA] hover:text-[#181716]"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  kind,
  label,
}: {
  kind: "high" | "medium" | "low" | "passed" | "failed" | "warning" | "completed";
  label?: string;
}) {
  const map = {
    high: { bg: "bg-[rgba(220,38,38,0.12)] text-[#DC2626] border border-[rgba(220,38,38,0.25)]", text: "High", icon: "▲" },
    medium: { bg: "bg-[rgba(217,119,6,0.12)] text-[#D97706] border border-[rgba(217,119,6,0.25)]", text: "Medium", icon: "●" },
    low: { bg: "bg-[#F0E8DA] text-[#45423E] border border-[#D8CEBC]", text: "Low", icon: "▼" },
    passed: { bg: "bg-[rgba(5,150,105,0.12)] text-[#059669] border border-[rgba(5,150,105,0.25)]", text: "Passed", icon: "✓" },
    failed: { bg: "bg-[rgba(220,38,38,0.12)] text-[#DC2626] border border-[rgba(220,38,38,0.25)]", text: "Failed", icon: "✕" },
    warning: { bg: "bg-[rgba(217,119,6,0.12)] text-[#D97706] border border-[rgba(217,119,6,0.25)]", text: "Warning", icon: "!" },
    completed: { bg: "bg-[rgba(5,150,105,0.12)] text-[#059669] border border-[rgba(5,150,105,0.25)]", text: "Completed", icon: "✓" },
  }[kind];

  return (
    <span
      className={`inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-xs font-medium ${map.bg}`}
    >
      <span aria-hidden="true" className="text-[10px]">{map.icon}</span>
      <span>{label ?? map.text}</span>
    </span>
  );
}

export function Panel({
  title,
  actions,
  children,
  className = "",
  id,
}: {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`bg-[#FAF6EE] border border-[#E2D7C5] hover:border-[#D8CEBC] transition-all rounded-[12px] shadow-[0_2px_12px_rgba(24,23,22,0.04)] h-full flex flex-col ${className}`}
    >
      <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#E2D7C5] min-h-[52px] flex-shrink-0">
        <h2 className="text-base font-semibold tracking-tight text-[#181716]">{title}</h2>
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      </header>
      <div className="p-5 flex-1 flex flex-col">{children}</div>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-[#D8CEBC] bg-[#F0E8DA]/60 rounded-[8px] p-6 text-center text-sm text-[#76716B]">
      {children}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-[#E5DBC7] rounded-[6px] animate-skeleton ${className}`} />;
}

export function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
