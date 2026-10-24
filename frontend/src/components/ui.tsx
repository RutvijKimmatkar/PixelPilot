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
      "bg-[#FAF7F0] border border-[#E7DCB9] text-[#141414] font-semibold hover:bg-white hover:border-white shadow-[0_2px_14px_rgba(250,247,240,0.2),inset_0_1px_0_0_rgba(255,255,255,0.8)] focus-visible:outline-2 focus-visible:outline-[#FAF7F0] focus-visible:outline-offset-2 transition-all active:scale-[0.98]",
    secondary:
      "bg-[#1C1B19] border border-[#36332E] text-[#FAF8F5] hover:bg-[#252320] hover:border-[#4A463F] shadow-[inset_0_1px_0_0_rgba(253,248,241,0.05)] focus-visible:outline-2 focus-visible:outline-[#FAF7F0] focus-visible:outline-offset-2 transition-all",
    ghost:
      "bg-transparent border border-transparent text-[#B8B2A7] hover:text-[#FAF8F5] hover:bg-[#1C1B19] focus-visible:outline-2 focus-visible:outline-[#FAF7F0] focus-visible:outline-offset-2 transition-colors",
    outline:
      "bg-transparent border border-[#36332E] text-[#FAF8F5] hover:bg-[#1C1B19] hover:border-[#4A463F] focus-visible:outline-2 focus-visible:outline-[#FAF7F0] focus-visible:outline-offset-2 transition-all",
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
      className={`h-7 px-3 rounded-full text-xs font-medium transition-all duration-150 border focus-visible:outline-2 focus-visible:outline-[#FAF7F0] focus-visible:outline-offset-2 ${
        on
          ? "bg-[rgba(250,247,240,0.10)] border-[#FAF7F0] text-[#FAF8F5] shadow-[0_0_10px_rgba(250,247,240,0.18)]"
          : "bg-transparent border-[#36332E] text-[#B8B2A7] hover:bg-[#1C1B19] hover:text-[#FAF8F5]"
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
    high: { bg: "bg-[rgba(239,68,68,0.14)] text-[#EF4444]", text: "High", icon: "▲" },
    medium: { bg: "bg-[rgba(245,165,36,0.14)] text-[#F5A524]", text: "Medium", icon: "●" },
    low: { bg: "bg-[#201E1B] text-[#B8B2A7]", text: "Low", icon: "▼" },
    passed: { bg: "bg-[rgba(62,207,142,0.12)] text-[#3ECF8E]", text: "Passed", icon: "✓" },
    failed: { bg: "bg-[rgba(239,68,68,0.14)] text-[#EF4444]", text: "Failed", icon: "✕" },
    warning: { bg: "bg-[rgba(245,165,36,0.14)] text-[#F5A524]", text: "Warning", icon: "!" },
    completed: { bg: "bg-[rgba(62,207,142,0.12)] text-[#3ECF8E]", text: "Completed", icon: "✓" },
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
      className={`bg-[#161514] border border-[#2A2825] hover:border-[#36332E] transition-all rounded-[12px] shadow-[inset_0_1px_0_0_rgba(253,248,241,0.05),0_8px_24px_rgba(0,0,0,0.4)] h-full flex flex-col ${className}`}
    >
      <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#2A2825] min-h-[52px] flex-shrink-0">
        <h2 className="text-base font-medium tracking-tight text-[#FAF8F5]">{title}</h2>
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      </header>
      <div className="p-5 flex-1 flex flex-col">{children}</div>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-[#2A2825] bg-[#141312]/60 rounded-[8px] p-6 text-center text-sm text-[#8C8578]">
      {children}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-[#201E1B] rounded-[6px] animate-skeleton ${className}`} />;
}

export function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
