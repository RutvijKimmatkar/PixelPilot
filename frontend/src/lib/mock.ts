import type {
  Job,
  JobStep,
  Report,
  StepId,
} from "../types";
import { ApiError } from "./api";

interface MockJobRecord {
  id: string;
  url: string;
  description: string;
  createdAt: number;
  isLocalhost: boolean;
  cancelled: boolean;
}

const mockJobs = new Map<string, MockJobRecord>();

const STEP_DEFINITIONS: { id: StepId; label: string; startMs: number; endMs: number; message: string }[] = [
  {
    id: "validate",
    label: "URL validated",
    startMs: 0,
    endMs: 1700,
    message: "Validating target URL accessibility and security boundaries...",
  },
  {
    id: "launch",
    label: "Opening isolated browser",
    startMs: 1700,
    endMs: 3400,
    message: "Launching sandboxed Chromium instance with headless instrumentation...",
  },
  {
    id: "desktop",
    label: "Capturing desktop view",
    startMs: 3400,
    endMs: 5200,
    message: "Rendering desktop DOM and capturing 1280x800 viewport snapshot...",
  },
  {
    id: "mobile",
    label: "Capturing mobile view",
    startMs: 5200,
    endMs: 7000,
    message: "Emulating mobile device metrics and capturing 375x667 viewport snapshot...",
  },
  {
    id: "inspect",
    label: "Inspecting layout and browser logs",
    startMs: 7000,
    endMs: 8800,
    message: "Collecting runtime console errors, network failures, and computed style anomalies...",
  },
  {
    id: "analyze",
    label: "Generating diagnosis with Gemma",
    startMs: 8800,
    endMs: 10500,
    message: "Analyzing DOM tree and visual defects with Gemma...",
  },
  {
    id: "prompt",
    label: "Preparing your Antigravity prompt",
    startMs: 10500,
    endMs: 12000,
    message: "Synthesizing root cause diagnosis and Antigravity IDE fix instructions...",
  },
];

const TOTAL_DURATION_MS = 12000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateDesktopSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
    <rect width="1280" height="800" fill="#0f172a"/>
    <rect x="0" y="0" width="1280" height="48" fill="#1e293b"/>
    <circle cx="24" cy="24" r="6" fill="#ef4444"/>
    <circle cx="44" cy="24" r="6" fill="#f59e0b"/>
    <circle cx="64" cy="24" r="6" fill="#10b981"/>
    <rect x="100" y="12" width="600" height="24" rx="6" fill="#334155"/>
    <text x="120" y="28" font-family="monospace" font-size="12" fill="#94a3b8">https://app.target-site.com/checkout</text>
    <rect x="80" y="90" width="700" height="630" rx="8" fill="#1e293b" stroke="#334155"/>
    <text x="110" y="140" font-family="sans-serif" font-size="22" font-weight="bold" fill="#f8fafc">Checkout Order #8921</text>
    <rect x="110" y="170" width="640" height="60" rx="6" fill="#0f172a"/>
    <rect x="110" y="250" width="640" height="120" rx="6" fill="#0f172a"/>
    <rect x="820" y="90" width="380" height="420" rx="8" fill="#1e293b" stroke="#334155"/>
    <text x="845" y="135" font-family="sans-serif" font-size="18" font-weight="bold" fill="#f8fafc">Order Summary</text>
    <rect x="845" y="160" width="330" height="2" fill="#334155"/>
    <text x="845" y="200" font-family="sans-serif" font-size="14" fill="#94a3b8">Subtotal: $149.00</text>
    <text x="845" y="230" font-family="sans-serif" font-size="14" fill="#94a3b8">Tax &amp; Shipping: $12.50</text>
    <text x="845" y="270" font-family="sans-serif" font-size="18" font-weight="bold" fill="#38bdf8">Total: $161.50</text>
    <rect x="845" y="310" width="330" height="52" rx="8" fill="#dc2626" opacity="0.2" stroke="#ef4444" stroke-width="2" stroke-dasharray="6,4"/>
    <text x="895" y="342" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ef4444">[Visual Bug] Overflow Clipped Action</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function generateMobileSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="375" height="667" viewBox="0 0 375 667">
    <rect width="375" height="667" fill="#0f172a"/>
    <rect x="0" y="0" width="375" height="44" fill="#1e293b"/>
    <text x="187" y="28" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#f8fafc">Checkout (Mobile)</text>
    <rect x="16" y="60" width="343" height="180" rx="8" fill="#1e293b" stroke="#334155"/>
    <text x="32" y="95" font-family="sans-serif" font-size="16" font-weight="bold" fill="#f8fafc">Cart Total: $161.50</text>
    <rect x="16" y="260" width="343" height="60" rx="8" fill="#7f1d1d" stroke="#ef4444" stroke-width="2"/>
    <text x="187" y="296" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#fecaca">&#9888; Primary CTA button hidden by overflow:hidden</text>
    <rect x="16" y="340" width="343" height="240" rx="8" fill="#1e293b"/>
    <text x="32" y="375" font-family="monospace" font-size="11" fill="#f87171">&gt; TypeError: Cannot read properties of undefined</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const mockApi = {
  async createAnalysis(url: string, description: string): Promise<{ jobId: string }> {
    await sleep(350);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      throw new ApiError("UNKNOWN", "URL is required to start an analysis.");
    }

    const isLocalhost =
      trimmedUrl.includes("localhost") ||
      trimmedUrl.includes("127.0.0.1") ||
      trimmedUrl.includes("0.0.0.0");

    const jobId = `job_${Math.random().toString(36).substring(2, 9)}`;

    mockJobs.set(jobId, {
      id: jobId,
      url: trimmedUrl,
      description,
      createdAt: Date.now(),
      isLocalhost,
      cancelled: false,
    });

    return { jobId };
  },

  async getJob(jobId: string): Promise<Job> {
    await sleep(150);

    const record = mockJobs.get(jobId);
    if (!record) {
      throw new ApiError("UNKNOWN", `Job with id "${jobId}" was not found.`);
    }

    if (record.cancelled) {
      return {
        id: jobId,
        status: "failed",
        progress: 0,
        currentMessage: "Analysis was cancelled by the user.",
        steps: STEP_DEFINITIONS.map((s) => ({
          id: s.id,
          label: s.label,
          state: "failed",
        })),
        error: {
          code: "UNKNOWN",
          message: "The analysis job was cancelled.",
        },
      };
    }

    const elapsed = Date.now() - record.createdAt;

    // Failure branch for localhost URLs
    if (record.isLocalhost) {
      if (elapsed < 1600) {
        return {
          id: jobId,
          status: "running",
          progress: 12,
          currentMessage: "Validating target URL security and reachability...",
          steps: STEP_DEFINITIONS.map((s, idx) => ({
            id: s.id,
            label: s.label,
            state: idx === 0 ? "active" : "pending",
          })),
        };
      }

      // Failed after validate step
      return {
        id: jobId,
        status: "failed",
        progress: 14,
        currentMessage: "Security violation: Localhost and internal network addresses are forbidden.",
        steps: STEP_DEFINITIONS.map((s, idx) => ({
          id: s.id,
          label: s.label,
          state: idx === 0 ? "failed" : "pending",
        })),
        error: {
          code: "UNSAFE_URL",
          message:
            "Target URL refers to localhost or an internal loopback address. Cloud debugging sandboxes cannot inspect private local environments.",
        },
      };
    }

    // Normal branch over ~12s
    if (elapsed >= TOTAL_DURATION_MS) {
      return {
        id: jobId,
        status: "completed",
        progress: 100,
        currentMessage: "Visual and runtime analysis completed successfully.",
        steps: STEP_DEFINITIONS.map((s) => ({
          id: s.id,
          label: s.label,
          state: "done",
        })),
      };
    }

    // Currently running: determine active step and progress
    const progress = Math.min(99, Math.max(5, Math.floor((elapsed / TOTAL_DURATION_MS) * 100)));
    let activeStepIndex = STEP_DEFINITIONS.findIndex(
      (s) => elapsed >= s.startMs && elapsed < s.endMs
    );
    if (activeStepIndex === -1) activeStepIndex = STEP_DEFINITIONS.length - 1;

    const currentStepDef = STEP_DEFINITIONS[activeStepIndex];

    const steps: JobStep[] = STEP_DEFINITIONS.map((s, idx) => {
      let state: JobStep["state"] = "pending";
      if (idx < activeStepIndex) state = "done";
      else if (idx === activeStepIndex) state = "active";
      return {
        id: s.id,
        label: s.label,
        state,
      };
    });

    return {
      id: jobId,
      status: "running",
      progress,
      currentMessage: currentStepDef.message,
      steps,
    };
  },

  async getReport(jobId: string): Promise<Report> {
    await sleep(200);

    const record = mockJobs.get(jobId);
    if (!record) {
      throw new ApiError("UNKNOWN", `Job with id "${jobId}" was not found.`);
    }

    if (record.isLocalhost) {
      throw new ApiError(
        "UNSAFE_URL",
        "Cannot generate report: Localhost URL analysis failed security validation."
      );
    }

    const elapsed = Date.now() - record.createdAt;
    if (elapsed < TOTAL_DURATION_MS) {
      throw new ApiError(
        "UNKNOWN",
        "Report is not ready yet. Please wait for the analysis to complete."
      );
    }

    return {
      jobId,
      url: record.url,
      issueDescription: record.description || "CTA button unresponsive and clipped on mobile viewport",
      summary:
        "Visual regression detected in checkout summary panel. A flex container overflow is clipping the primary CTA button on mobile viewports (< 480px), combined with an uncaught TypeError in the payment processing bundle.",
      confidence: "high",
      rootCause:
        "The `.checkout-actions` container has an explicit height of 60px with `overflow: hidden`, causing `.btn-checkout` to be pushed outside the visible bounding box when promo banners expand dynamically. Additionally, the event listener references `window.StripeCheckout` before async script load completion.",
      evidence: [
        {
          label: "Viewport Breakpoint Defect",
          value: "Element #checkout-btn computed bounding rect height is 0px (clipped by parent .summary-card overflow:hidden at <= 420px width)",
          severity: "error",
        },
        {
          label: "DOM Element Z-Index Collision",
          value: "Modal backdrop (.overlay-backdrop z-index: 90) overlaps button click zone (z-index: 10)",
          severity: "warning",
        },
        {
          label: "Mobile Layout Shift (CLS)",
          value: "CLS score measured 0.42 during cart discount accordion animation",
          severity: "warning",
        },
        {
          label: "Console Exception",
          value: "Uncaught TypeError: Cannot read properties of undefined (reading 'createPaymentMethod')",
          severity: "error",
        },
        {
          label: "Network Asset Status",
          value: "Stripe SDK script chunk loaded in 1840ms (exceeded 1500ms timeout budget)",
          severity: "info",
        },
      ],
      consoleErrors: [
        "[Error] Uncaught TypeError: Cannot read properties of undefined (reading 'createPaymentMethod') at checkout.js:142:19",
        "[Error] Failed to load resource: net::ERR_BLOCKED_BY_CLIENT (https://analytics.example.com/telemetry.js)",
        "[Warning] Detected layout thrashing: Forced synchronous layout inside animateCart() at checkout.js:88:9",
      ],
      fixSteps: [
        "1. Change .checkout-actions CSS from 'height: 60px; overflow: hidden;' to 'min-height: 60px; height: auto; overflow: visible; flex-wrap: wrap;'.",
        "2. Add guard check for payment SDK initialization: 'if (typeof window.StripeCheckout === \"undefined\") await loadStripeSDK();' before invoking createPaymentMethod.",
        "3. Update z-index layering on #checkout-btn to 'z-index: 100' or elevate button to sticky footer container.",
        "4. Test responsive layout at 375px (iPhone SE/13) and 1280px desktop breakpoints.",
      ],
      antigravityPrompt:
        "Fix the mobile viewport clipping and payment initialization bug in checkout:\n\n1. In `src/components/CheckoutSummary.tsx`:\n   - Remove fixed `height: 60px` and `overflow: hidden` on the container `.checkout-actions`.\n   - Apply `min-h-[60px] h-auto flex flex-col sm:flex-row gap-3` to ensure CTA visibility at viewport <= 480px.\n2. In `src/services/stripe.ts`:\n   - Ensure `initStripe()` resolves before invoking `createPaymentMethod()` to prevent undefined property errors.\n   - Add proper null check and loading spinner during SDK retrieval.\n3. Verify both desktop (1280px) and mobile (375px) viewports with zero CLS.",
      screenshots: {
        desktop: generateDesktopSvg(),
        mobile: generateMobileSvg(),
        desktopWidth: 1280,
        mobileWidth: 375,
      },
    };
  },

  async cancelAnalysis(jobId: string): Promise<void> {
    await sleep(150);
    const record = mockJobs.get(jobId);
    if (!record) {
      throw new ApiError("UNKNOWN", `Job with id "${jobId}" was not found.`);
    }
    record.cancelled = true;
  },
};
