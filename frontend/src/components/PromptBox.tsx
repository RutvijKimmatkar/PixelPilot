import { useState } from "react";
import type React from "react";
import { copyToClipboard } from "../lib/clipboard";

export interface PromptBoxProps {
  prompt: string;
  reportUrl?: string;
}

export const PromptBox: React.FC<PromptBoxProps> = ({ prompt, reportUrl }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(prompt);
    if (success) {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  const handleDownload = () => {
    const header = `# Antigravity Fix Prompt\nTarget URL: ${reportUrl || "Web Application"}\nGenerated at: ${new Date().toISOString()}\n\n---\n\n`;
    const markdownContent = `${header}${prompt}\n`;
    const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `antigravity-fix-prompt-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-300">
              Antigravity IDE Fix Prompt
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Paste directly into Antigravity or AI agent terminal to apply autonomous fixes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Download as .md */}
          <button
            type="button"
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
            title="Download prompt as markdown file"
          >
            <span>↓</span>
            <span>Download .md</span>
          </button>

          {/* Prominent Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-md focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
              copied
                ? "bg-emerald-600 text-white shadow-emerald-500/20"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
            }`}
          >
            {copied ? (
              <>
                <span>✓</span>
                <span>Copied ✓</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>Copy prompt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monospace Scrollable Text Box */}
      <div className="relative group">
        <pre className="font-mono text-xs sm:text-[13px] text-slate-200 bg-slate-950 p-5 rounded-xl border border-slate-800/90 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto selection:bg-indigo-500 selection:text-white scrollbar-thin scrollbar-thumb-slate-800">
          {prompt}
        </pre>
      </div>
    </div>
  );
};

export default PromptBox;
