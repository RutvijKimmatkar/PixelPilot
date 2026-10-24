import type {
  CreateAnalysisResponse,
  ErrorCode,
  Job,
  Report,
} from "../types";
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

const globalProcess = (
  globalThis as unknown as {
    process?: { env?: Record<string, string | undefined> };
  }
).process;

const env =
  typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env as unknown as Record<string, string | undefined>)
    : (globalProcess?.env ?? {});

const BASE_URL: string =
  (env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ||
  "http://localhost:3000";

const IS_MOCK_ENABLED: boolean =
  String(env.VITE_USE_MOCK).toLowerCase() === "true";

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
      // Body is not JSON, use status text
    }

    throw new ApiError(code, message);
  }

  return (await res.json()) as T;
}

export async function createAnalysis(
  url: string,
  description: string
): Promise<CreateAnalysisResponse> {
  if (IS_MOCK_ENABLED) {
    return mockApi.createAnalysis(url, description);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/analyses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, description }),
    });

    return await handleResponse<CreateAnalysisResponse>(res);
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      "UNREACHABLE",
      `Cannot connect to backend server at ${BASE_URL}. Ensure the backend is running.`
    );
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
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      "UNREACHABLE",
      `Cannot connect to backend server at ${BASE_URL}. Ensure the backend is running.`
    );
  }
}

export async function getReport(jobId: string): Promise<Report> {
  if (IS_MOCK_ENABLED) {
    return mockApi.getReport(jobId);
  }

  try {
    const res = await fetch(
      `${BASE_URL}/api/analyses/${encodeURIComponent(jobId)}/report`
    );
    return await handleResponse<Report>(res);
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      "UNREACHABLE",
      `Cannot connect to backend server at ${BASE_URL}. Ensure the backend is running.`
    );
  }
}

export async function cancelAnalysis(jobId: string): Promise<void> {
  if (IS_MOCK_ENABLED) {
    return mockApi.cancelAnalysis(jobId);
  }

  try {
    const res = await fetch(
      `${BASE_URL}/api/analyses/${encodeURIComponent(jobId)}`,
      {
        method: "DELETE",
      }
    );

    if (!res.ok) {
      await handleResponse<unknown>(res);
    }
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      "UNREACHABLE",
      `Cannot connect to backend server at ${BASE_URL}. Ensure the backend is running.`
    );
  }
}
