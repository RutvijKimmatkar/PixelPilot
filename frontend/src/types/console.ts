export type ConsoleState = 
  | "idle"
  | "validation_error"
  | "running"
  | "completed_issues"
  | "completed_clean"
  | "failed_blocked"
  | "preview_area_selected"
  | "whole_site_running";

export type TargetMode = "public" | "localhost";

export type TestScope = "site" | "page" | "region" | "element";

export type ViewportKey = "desktop" | "tablet" | "mobile";

export type PreviewTool = "browse" | "region" | "element";

export interface SelectionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PickedElement {
  selector: string;
  tagName: string;
  rect: SelectionRegion;
}

export interface CaptureItem {
  id: string;
  label: string;
  imageUrl: string;
  width: number;
  height: number;
  timestamp: number;
  mode: "region" | "element" | "viewport" | "fullpage";
  includedInTest: boolean;
  selector?: string;
  region?: SelectionRegion;
}

export interface LocalServer {
  port: number;
  url: string;
  title: string;
}

export interface PlaywrightAction {
  id: string;
  name: string;
  detail: string;
  duration: string;
  status: "done" | "running" | "failed" | "pending";
  output?: string;
  pageUrl?: string;
  pageIndex?: number;
}

export interface IssueItem {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  selector: string;
  measurement: string;
  viewport: string;
  pageUrl?: string;
  rect?: SelectionRegion;
}

export interface TestedPageSummary {
  url: string;
  title: string;
  status: number;
  issueCount: number;
  highestSeverity: "high" | "medium" | "low" | "none";
  loadTime: string;
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
  scope?: string;
  pagesTested?: number;
}
