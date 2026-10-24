import { useState } from "react";
import type { AppView } from "./types";

export function App() {
  const [view, setView] = useState<AppView>("submit");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Visual Debugging Assistant
        </h1>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono">View State:</span>
          {(["submit", "progress", "report"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setView(v);
                if (v === "progress" && !activeJobId) {
                  setActiveJobId("demo-job-id");
                }
              }}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                view === v
                  ? "bg-sky-500 text-white font-medium"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {view === "submit" && (
          <div className="border border-dashed border-slate-800 rounded-lg p-8 text-center text-slate-400">
            Submit view placeholder
          </div>
        )}

        {view === "progress" && (
          <div className="border border-dashed border-slate-800 rounded-lg p-8 text-center text-slate-400">
            Progress view placeholder (Job: {activeJobId ?? "none"})
          </div>
        )}

        {view === "report" && (
          <div className="border border-dashed border-slate-800 rounded-lg p-8 text-center text-slate-400">
            Report view placeholder
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
