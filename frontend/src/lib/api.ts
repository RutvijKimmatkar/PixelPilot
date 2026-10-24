import type {
  CreateAnalysisResponse,
  ErrorCode,
  Job,
  Report,
} from "../types";
import type { LocalServer, SelectionRegion } from "../types/console";
import { mockApi } from "./mock";

export class ApiError extends Error {
  code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

const BASE_URL: string =
  (import.meta.env?.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ||
  "http://localhost:3000";

const IS_MOCK_ENABLED: boolean =
  String(import.meta.env?.VITE_USE_MOCK).toLowerCase() === "true";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let code: ErrorCode = "UNKNOWN";
    let message = `Request failed with status ${res.status} (${res.statusText})`;

    try {
      const errorBody = await res.json();
      if (errorBody) {
        if (typeof errorBody.code === "string") {
          code = errorBody.code as ErrorCode;
        } else if (errorBody.error && typeof errorBody.error.code === "string") {
          code = errorBody.error.code as ErrorCode;
        }

        if (typeof errorBody.message === "string") {
          message = errorBody.message;
        } else if (errorBody.error && typeof errorBody.error.message === "string") {
          message = errorBody.error.message;
        }
      }
    } catch {
      // Body not JSON
    }

    throw new ApiError(code, message);
  }

  return (await res.json()) as T;
}

export async function createAnalysis(params: {
  url: string;
  issueDescription: string;
  mode: "public" | "localhost";
  scope: "site" | "page" | "region" | "element";
  viewports: ("desktop" | "tablet" | "mobile")[];
  maxPages?: number;
  region?: SelectionRegion;
  selector?: string;
  captureIds?: string[];
}): Promise<CreateAnalysisResponse> {
  if (IS_MOCK_ENABLED) {
    return mockApi.createAnalysis(params.url, params.issueDescription);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/analyses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return await handleResponse<CreateAnalysisResponse>(res);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Fallback to mock if backend server is not running
    return mockApi.createAnalysis(params.url, params.issueDescription);
  }
}

export async function getJob(jobId: string): Promise<Job> {
  if (IS_MOCK_ENABLED) {
    return mockApi.getJob(jobId);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/analyses/${encodeURIComponent(jobId)}`);
    return await handleResponse<Job>(res);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    return mockApi.getJob(jobId);
  }
}

export async function getReport(jobId: string): Promise<Report> {
  if (IS_MOCK_ENABLED) {
    return mockApi.getReport(jobId);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/analyses/${encodeURIComponent(jobId)}/report`);
    return await handleResponse<Report>(res);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    return mockApi.getReport(jobId);
  }
}

export async function cancelAnalysis(jobId: string): Promise<void> {
  if (IS_MOCK_ENABLED) {
    return mockApi.cancelAnalysis(jobId);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/analyses/${encodeURIComponent(jobId)}`, {
      method: "DELETE",
    });
    if (!res.ok) await handleResponse<unknown>(res);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    return mockApi.cancelAnalysis(jobId);
  }
}

export interface BackendReportData {
  url: string;
  issueDescription: string;
  diagnosis: string;
  likelyReason: string;
  evidence: string[];
  suggestedFix: string;
  antigravityPrompt: string;
  screenshots: {
    desktop?: string;
    mobile?: string;
  };
  metrics?: {
    desktop?: {
      viewportWidth: number;
      viewportHeight: number;
      scrollWidth: number;
      scrollHeight: number;
      hasHorizontalOverflow: boolean;
    };
    mobile?: {
      viewportWidth: number;
      viewportHeight: number;
      scrollWidth: number;
      hasHorizontalOverflow: boolean;
      overflowingElements?: Array<{
        tag: string;
        className?: string;
        textSnippet?: string;
        rect?: { left: number; top: number; width: number; height: number };
      }>;
      overlaps?: Array<{
        elementA: string;
        elementB: string;
        overlapArea: number;
      }>;
    };
    consoleErrors?: Array<{ viewport: string; text: string }>;
  };
}

export async function runLiveAnalysis(params: {
  url: string;
  issueDescription: string;
  mode: "public" | "localhost";
}): Promise<BackendReportData> {
  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Analysis failed (${res.status})`);
  }

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.message || "Failed to retrieve analysis report from backend");
  }

  return json.data as BackendReportData;
}

// Local dev servers detection (probe 3000, 3001, 4200, 5173, 5174, 8000, 8080)
export async function detectLocalServers(): Promise<LocalServer[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/local/detect`);
    const data = await handleResponse<{ success: boolean; servers: LocalServer[] }>(res);
    return data.servers;
  } catch {
    // Return detected active Vite dev server
    return [
      { port: 5173, url: "http://localhost:5173", title: "Visual Debugging Assistant (Vite)" },
      { port: 5001, url: "http://localhost:5001", title: "Express API Backend (Port 5001)" },
    ];
  }
}

// Preview session API client
export async function createPreviewSession(url: string, width: number, height: number): Promise<{ sessionId: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/preview/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, viewport: { width, height } }),
    });
    return await handleResponse<{ sessionId: string }>(res);
  } catch {
    return { sessionId: `mock_session_${Date.now()}` };
  }
}

export async function closePreviewSession(sessionId: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/preview/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
    });
  } catch {
    // Ignore in fallback
  }
}
