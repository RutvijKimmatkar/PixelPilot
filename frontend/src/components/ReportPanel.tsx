import { useState } from "react";
import { Panel, Btn, Badge, EmptyState } from "./ui";
import type { TestScope, SelectionRegion, PickedElement } from "../types/console";

interface ReportPanelProps {
  hasReport: boolean;
  scope?: TestScope;
  region?: SelectionRegion | null;
  element?: PickedElement | null;
  onGenerateReport: () => void;
  onExport: (format: "markdown" | "pdf" | "json") => void;
}

export function ReportPanel({
  hasReport,
  scope = "page",
  region,
  element,
  onGenerateReport,
  onExport,
}: ReportPanelProps) {
  const [exportOpen, setExportOpen] = useState(false);

  const testRows = [
    { check: "URL safety & Host verification", result: "passed", evidence: "Public host TLS 1.3 verified, loopback boundaries enforced" },
    { check: "Desktop render at 1280px", result: "passed", evidence: "Status 200, First Contentful Paint 0.8s, full viewport clear" },
    { check: "Mobile render at 375px", result: "failed", evidence: "Horizontal overflow detected (612px > 375px viewport)" },
    { check: "DOM overflow scan", result: "failed", evidence: "2 elements exceed clientWidth (header.navbar > ul.nav-links, img.hero-banner)" },
    { check: "Console errors", result: "warning", evidence: "2 runtime errors: Failed to load /assets/logo.svg (404)" },
    { check: "AI diagnosis (Gemma)", result: "completed", evidence: "Multimodal inference: root cause identified and fix compiled" },
  ] as const;

  const pagesTested = [
    { page: "/", issues: 2, severity: "high", status: 200 },
    { page: "/catalog", issues: 1, severity: "medium", status: 200 },
    { page: "/product/12", issues: 0, severity: "passed", status: 200 },
  ] as const;

  return (
    <Panel
      title="Test report"
      actions={
        <div className="flex items-center gap-2 relative">
          <Btn
            id="generate-report-btn"
            variant="secondary"
            onClick={onGenerateReport}
          >
            {hasReport ? "Regenerate report" : "Generate report"}
          </Btn>

          {hasReport && (
            <div className="relative">
              <Btn
                id="export-dropdown-btn"
                variant="outline"
                onClick={() => setExportOpen(!exportOpen)}
              >
                <span>Export</span>
                <span className="text-xs">▾</span>
              </Btn>

              {exportOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-40 bg-[#1C1C1C] border border-[#2E2E2E] rounded-[6px] shadow-xl py-1 z-20">
                  <button
                    onClick={() => {
                      onExport("markdown");
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#EDEDED] hover:bg-[#232323] transition-colors"
                  >
                    Markdown (.md)
                  </button>
                  <button
                    onClick={() => {
                      onExport("json");
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#EDEDED] hover:bg-[#232323] transition-colors"
                  >
                    JSON report (.json)
                  </button>
                  <button
                    onClick={() => {
                      onExport("pdf");
                      setExportOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#EDEDED] hover:bg-[#232323] transition-colors"
                  >
                    PDF document (.pdf)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      }
    >
      {!hasReport ? (
        <EmptyState>
          <div className="py-4">
            <p className="text-sm text-[#EDEDED] font-medium">No report generated yet</p>
            <p className="text-xs text-[#707070] mt-1">
              Generate a report to see everything this run checked.
            </p>
          </div>
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {/* Summary line */}
          <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-[#1C1C1C] rounded-[6px] border border-[#2E2E2E] text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3ECF8E]" />
              <span className="text-[#EDEDED]">
                9 actions · 3 issues · 1 high severity · finished in 11.4s
              </span>
            </div>
            <div className="text-[#3ECF8E] font-medium">
              Scope: {scope.toUpperCase()}
              {scope === "region" && region ? ` (${region.width}×${region.height}px)` : ""}
              {scope === "element" && element ? ` (${element.selector})` : ""}
            </div>
          </div>

          {/* Whole site: Pages tested table */}
          {scope === "site" && (
            <div>
              <h3 className="text-sm font-medium text-[#EDEDED] mb-3">Pages tested</h3>
              <div className="rounded-[8px] border border-[#2E2E2E] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#1C1C1C] border-b border-[#2E2E2E] text-[#A0A0A0]">
                      <th className="py-2 px-4 font-medium">Page</th>
                      <th className="py-2 px-4 font-medium">Issues</th>
                      <th className="py-2 px-4 font-medium">Highest severity</th>
                      <th className="py-2 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2E2E2E]">
                    {pagesTested.map((pt, i) => (
                      <tr key={i} className="hover:bg-[#1C1C1C]">
                        <td className="py-2.5 px-4 font-mono text-[#EDEDED]">{pt.page}</td>
                        <td className="py-2.5 px-4 font-mono">{pt.issues}</td>
                        <td className="py-2.5 px-4">
                          <Badge kind={pt.severity === "passed" ? "passed" : (pt.severity as any)} />
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#3ECF8E]">{pt.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Checklist table: What was tested */}
          <div>
            <h3 className="text-sm font-medium text-[#EDEDED] mb-3">What was tested</h3>
            <div className="rounded-[8px] border border-[#2E2E2E] overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1C1C1C] border-b border-[#2E2E2E] text-[#A0A0A0]">
                    <th className="py-2.5 px-4 font-medium">Check</th>
                    <th className="py-2.5 px-4 font-medium w-32">Result</th>
                    <th className="py-2.5 px-4 font-medium">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E2E2E]">
                  {testRows.map((row, i) => (
                    <tr key={i} className="hover:bg-[#1C1C1C] transition-colors">
                      <td className="py-3 px-4 font-medium text-[#EDEDED]">{row.check}</td>
                      <td className="py-3 px-4">
                        <Badge kind={row.result} />
                      </td>
                      <td className="py-3 px-4 font-mono text-[#A0A0A0]">{row.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Root cause and next steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-[8px] bg-[#1C1C1C] border border-[#2E2E2E]">
              <h4 className="text-xs font-medium text-[#A0A0A0] uppercase tracking-wider mb-2">
                Root cause
              </h4>
              <p className="text-sm text-[#EDEDED] leading-relaxed">
                The mobile navbar container enforces a strict nowrap flex layout with explicit margin gaps. At 375px viewport width, the combined elements span 612px, forcing horizontal window scrolling and overflowing the DOM boundary.
              </p>
            </div>

            <div className="p-4 rounded-[8px] bg-[#1C1C1C] border border-[#2E2E2E] flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-medium text-[#A0A0A0] uppercase tracking-wider mb-2">
                  Next step
                </h4>
                <p className="text-sm text-[#EDEDED] leading-relaxed">
                  Apply the flex-wrap responsive rule or replace the link row with a collapsible navigation drawer for mobile viewports under 640px.
                </p>
              </div>
              <p className="text-xs text-[#3ECF8E] mt-3 font-medium">
                → See the Suggested fix tab in Developed code workspace above.
              </p>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
