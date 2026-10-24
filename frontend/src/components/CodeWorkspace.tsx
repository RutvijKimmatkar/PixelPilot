import { useState } from "react";
import { Panel, Btn } from "./ui";
import { PLAYWRIGHT_SCRIPT_CODE, SUGGESTED_FIX_CODE, ANTIGRAVITY_PROMPT } from "../data/demoData";

interface CodeWorkspaceProps {
  onCopy: (text: string, label: string) => void;
}

export function CodeWorkspace({ onCopy }: CodeWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"script" | "fix" | "prompt">("fix");

  const tabs = [
    { id: "script", label: "Playwright script", filename: "tests/visual-overflow.spec.ts" },
    { id: "fix", label: "Suggested fix", filename: "styles/navbar.css" },
    { id: "prompt", label: "Antigravity prompt", filename: "cursor-copilot-prompt.txt" },
  ] as const;

  const currentTab = tabs.find((t) => t.id === activeTab)!;

  const getContent = () => {
    switch (activeTab) {
      case "script":
        return PLAYWRIGHT_SCRIPT_CODE;
      case "fix":
        return SUGGESTED_FIX_CODE;
      case "prompt":
        return ANTIGRAVITY_PROMPT;
    }
  };

  const codeText = getContent();
  const lines = codeText.split("\n");

  const handleCopy = () => {
    onCopy(codeText, activeTab === "prompt" ? "Prompt copied to clipboard" : "Code copied to clipboard");
  };

  // Syntax highlighting helper for CSS/TS/Prompt
  const renderHighlightedLine = (line: string) => {
    if (activeTab === "prompt") {
      return <span>{line}</span>;
    }

    // Basic regex based token coloring
    // keywords: #C4B5FD, properties: #7DD3FC, strings: #3ECF8E, numbers: #F5A524, comments: #707070
    if (line.trim().startsWith("//") || line.trim().startsWith("/*") || line.trim().startsWith("*")) {
      return <span style={{ color: "#707070" }}>{line}</span>;
    }

    const parts = line.split(/(\b(?:import|export|const|await|async|test|expect|return|from|display|flex|flex-direction|flex-wrap|max-width|overflow-x|width|height|gap|padding|tag|className|scrollWidth|clientWidth)\b|'[^']*'|"[^"]*"|`[^`]*`|\d+px|\d+ms|\b\d+\b)/g);

    return (
      <>
        {parts.map((p, idx) => {
          if (
            /^(import|export|const|await|async|test|expect|return|from)$/.test(p)
          ) {
            return (
              <span key={idx} style={{ color: "#C4B5FD" }}>
                {p}
              </span>
            );
          }
          if (
            /^(display|flex|flex-direction|flex-wrap|max-width|overflow-x|width|height|gap|padding|tag|className|scrollWidth|clientWidth)$/.test(
              p
            )
          ) {
            return (
              <span key={idx} style={{ color: "#7DD3FC" }}>
                {p}
              </span>
            );
          }
          if (/^('.*'|".*"|`.*`)$/.test(p)) {
            return (
              <span key={idx} style={{ color: "#3ECF8E" }}>
                {p}
              </span>
            );
          }
          if (/^(\d+px|\d+ms|\d+)$/.test(p)) {
            return (
              <span key={idx} style={{ color: "#F5A524" }}>
                {p}
              </span>
            );
          }
          return <span key={idx}>{p}</span>;
        })}
      </>
    );
  };

  return (
    <Panel
      title="Developed code"
      actions={
        <div className="flex gap-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`text-sm pb-1 transition-colors border-b-2 font-medium ${
                activeTab === t.id
                  ? "border-[#3ECF8E] text-[#EDEDED]"
                  : "border-transparent text-[#A0A0A0] hover:text-[#EDEDED]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="rounded-[8px] border border-[#2E2E2E] bg-[#171717] overflow-hidden">
        {/* Header bar 40px */}
        <div className="h-10 px-4 bg-[#1C1C1C] border-b border-[#2E2E2E] flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 font-mono text-[#A0A0A0]">
            <span className="text-[#3ECF8E]">●</span>
            <span className="text-[#EDEDED] font-medium">{currentTab.filename}</span>
            <span className="text-[#707070]">{lines.length} lines</span>
          </div>
          <Btn variant="ghost" size="md" onClick={handleCopy}>
            <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {activeTab === "prompt" ? "Copy prompt" : "Copy code"}
          </Btn>
        </div>

        {/* Code viewing area */}
        <div className="p-4 overflow-x-auto text-[13px] leading-[22px] font-mono bg-[#171717] max-h-[380px]">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`flex items-start ${
                activeTab === "prompt" ? "whitespace-pre-wrap" : "whitespace-pre"
              }`}
            >
              <span className="w-10 text-right pr-4 text-[#707070] select-none flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-[#EDEDED]">{renderHighlightedLine(line)}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
