export type ConsoleState = 
  | "idle"
  | "validation_error"
  | "running"
  | "completed_issues"
  | "completed_clean"
  | "failed_blocked";

export interface PlaywrightAction {
  id: string;
  name: string;
  detail: string;
  duration: string;
  status: "done" | "running" | "failed" | "pending";
  output?: string;
}

export interface IssueItem {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  selector: string;
  measurement: string;
  viewport: string;
}

export interface SiteInfo {
  title: string;
  url: string;
  status: number;
  loadTime: string;
  pageWeight: string;
  domNodes: number;
  consoleErrors: number;
  viewports: string[];
}
