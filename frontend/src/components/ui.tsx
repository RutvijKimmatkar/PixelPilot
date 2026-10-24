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
      "bg-[#006239] border border-[#3ECF8E] text-[#EDEDED] hover:bg-[#00734A] focus-visible:outline-2 focus-visible:outline-[#3ECF8E] focus-visible:outline-offset-2",
    secondary:
      "bg-[#232323] border border-[#363636] text-[#EDEDED] hover:bg-[#2A2A2A] hover:border-[#454545] focus-visible:outline-2 focus-visible:outline-[#3ECF8E] focus-visible:outline-offset-2",
    ghost:
      "bg-transparent border border-transparent text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-[#232323] focus-visible:outline-2 focus-visible:outline-[#3ECF8E] focus-visible:outline-offset-2",
    outline:
      "bg-transparent border border-[#363636] text-[#EDEDED] hover:bg-[#232323] hover:border-[#454545] focus-visible:outline-2 focus-visible:outline-[#3ECF8E] focus-visible:outline-offset-2",
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
      className={`h-7 px-3 rounded-full text-xs font-medium transition-colors duration-150 border focus-visible:outline-2 focus-visible:outline-[#3ECF8E] focus-visible:outline-offset-2 ${
        on
          ? "bg-[rgba(62,207,142,0.10)] border-[#3ECF8E] text-[#3ECF8E]"
          : "bg-transparent border-[#363636] text-[#A0A0A0] hover:bg-[#232323] hover:text-[#EDEDED]"
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
    low: { bg: "bg-[#232323] text-[#A0A0A0]", text: "Low", icon: "▼" },
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
      className={`bg-[#171717] border border-[#2E2E2E] hover:border-[#363636] transition-colors rounded-[12px] ${className}`}
    >
      <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#2E2E2E] min-h-[52px]">
        <h2 className="text-base font-medium tracking-tight text-[#EDEDED]">{title}</h2>
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-[#2E2E2E] rounded-[8px] p-6 text-center text-sm text-[#707070]">
      {children}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-[#232323] rounded-[6px] animate-skeleton ${className}`} />;
}

export function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
