# Visual Debugging Assistant — Frontend

Frontend application for **Visual Debugging Assistant**, built for the GDGC Hackathon.  
Stack: React 19 + TypeScript + Vite + Tailwind CSS.

---

## 🚀 Quickstart & Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server (runs at http://localhost:5173)
npm run dev
```

---

## ⚙️ Environment Variables

Create or edit `.env` in the `/frontend` directory:

| Variable | Type | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | `string` | `http://localhost:3000` | Base URL of the Node/Express backend server |
| `VITE_USE_MOCK` | `boolean` | `true` | When `true`, enables the in-memory mock service and reveals the **"Demo mode"** toggle in the header |

### Example `.env`

```env
VITE_API_URL=http://localhost:3000
VITE_USE_MOCK=true
```

> **Note on Demo Mode**: When `VITE_USE_MOCK=true`, a quick toggle appears in the app top bar allowing judges and developers to flip between simulated in-memory analysis and the live backend API on the fly without restarting Vite.

---

## 🛠️ Available npm Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite` | Starts local dev server at `http://localhost:5173` with HMR |
| `npm run build` | `tsc -b && vite build` | Type-checks code and generates production bundle in `/dist` |
| `npm run lint` | `oxlint` | Runs fast Oxlint linter against all TypeScript/React source files |
| `npm run preview` | `vite preview` | Serves the production bundle locally for validation |

---

## 📡 Backend API Contract (Expected by Frontend)

The backend runs at `http://localhost:3000` (configurable via `VITE_API_URL`). All paths are prefixed with `/api`.

### 1. Create Analysis
- **Method / Path**: `POST /api/analyses`
- **Headers**: `Content-Type: application/json`

#### Request Body
```json
{
  "url": "https://shop-demo.example.com/checkout",
  "description": "Checkout CTA button is clipped and unresponsive on mobile screens."
}
```

#### Success Response (`201 Created` or `200 OK`)
```json
{
  "jobId": "job_98fa3bc"
}
```

#### Error Response (`400 Bad Request` or `422 Unprocessable`)
```json
{
  "code": "UNSAFE_URL",
  "message": "Only public http(s) pages are supported. Localhost and private loopback addresses are blocked."
}
```

---

### 2. Poll Job Status
- **Method / Path**: `GET /api/analyses/:jobId`
- **Polling interval**: The frontend polls this endpoint every `1500ms`.

#### Success Response (`200 OK`)
```json
{
  "id": "job_98fa3bc",
  "status": "running",
  "progress": 55,
  "currentMessage": "Emulating mobile device metrics and capturing 375x667 viewport snapshot...",
  "steps": [
    { "id": "validate", "label": "URL validated", "state": "done" },
    { "id": "launch", "label": "Opening isolated browser", "state": "done" },
    { "id": "desktop", "label": "Capturing desktop view", "state": "done" },
    { "id": "mobile", "label": "Capturing mobile view", "state": "active" },
    { "id": "inspect", "label": "Inspecting layout and browser logs", "state": "pending" },
    { "id": "analyze", "label": "Generating diagnosis with Gemma", "state": "pending" },
    { "id": "prompt", "label": "Preparing your Antigravity prompt", "state": "pending" }
  ]
}
```

#### Failure Status (`200 OK` with `status: "failed"`)
```json
{
  "id": "job_98fa3bc",
  "status": "failed",
  "progress": 14,
  "currentMessage": "Security check failed.",
  "steps": [
    { "id": "validate", "label": "URL validated", "state": "failed" },
    { "id": "launch", "label": "Opening isolated browser", "state": "pending" }
  ],
  "error": {
    "code": "UNSAFE_URL",
    "message": "Target refers to an internal loopback address."
  }
}
```

Supported `error.code` values:
- `UNSAFE_URL`
- `TIMEOUT`
- `UNREACHABLE`
- `ANALYSIS_FAILED`
- `UNKNOWN`

---

### 3. Retrieve Report
- **Method / Path**: `GET /api/analyses/:jobId/report`
- **Trigger**: Called automatically by the frontend when `job.status === "completed"`.

#### Success Response (`200 OK`)
```json
{
  "jobId": "job_98fa3bc",
  "url": "https://shop-demo.example.com/checkout",
  "issueDescription": "Checkout CTA button is clipped and unresponsive on mobile screens.",
  "summary": "Visual regression detected in checkout summary panel. A flex container overflow is clipping the primary CTA button on mobile viewports (< 480px), combined with an uncaught TypeError in the payment processing bundle.",
  "confidence": "high",
  "rootCause": "The .checkout-actions container has an explicit height of 60px with overflow: hidden, causing .btn-checkout to be pushed outside the visible bounding box when promo banners expand dynamically. Additionally, the event listener references window.StripeCheckout before async script load completion.",
  "evidence": [
    {
      "label": "Viewport Breakpoint Defect",
      "value": "Element #checkout-btn computed bounding rect height is 0px (clipped by parent .summary-card overflow:hidden at <= 420px width)",
      "severity": "error"
    },
    {
      "label": "DOM Element Z-Index Collision",
      "value": "Modal backdrop (.overlay-backdrop z-index: 90) overlaps button click zone (z-index: 10)",
      "severity": "warning"
    },
    {
      "label": "Mobile Layout Shift (CLS)",
      "value": "CLS score measured 0.42 during cart discount accordion animation",
      "severity": "warning"
    },
    {
      "label": "Console Exception",
      "value": "Uncaught TypeError: Cannot read properties of undefined (reading 'createPaymentMethod')",
      "severity": "error"
    },
    {
      "label": "Network Asset Status",
      "value": "Stripe SDK script chunk loaded in 1840ms (exceeded 1500ms timeout budget)",
      "severity": "info"
    }
  ],
  "consoleErrors": [
    "[Error] Uncaught TypeError: Cannot read properties of undefined (reading 'createPaymentMethod') at checkout.js:142:19",
    "[Error] Failed to load resource: net::ERR_BLOCKED_BY_CLIENT (https://analytics.example.com/telemetry.js)",
    "[Warning] Detected layout thrashing: Forced synchronous layout inside animateCart() at checkout.js:88:9"
  ],
  "fixSteps": [
    "1. Change .checkout-actions CSS from 'height: 60px; overflow: hidden;' to 'min-height: 60px; height: auto; overflow: visible; flex-wrap: wrap;'.",
    "2. Add guard check for payment SDK initialization: 'if (typeof window.StripeCheckout === \"undefined\") await loadStripeSDK();' before invoking createPaymentMethod.",
    "3. Update z-index layering on #checkout-btn to 'z-index: 100' or elevate button to sticky footer container.",
    "4. Test responsive layout at 375px (iPhone SE/13) and 1280px desktop breakpoints."
  ],
  "antigravityPrompt": "Fix the mobile viewport clipping and payment initialization bug in checkout:\n\n1. In `src/components/CheckoutSummary.tsx`:\n   - Remove fixed `height: 60px` and `overflow: hidden` on the container `.checkout-actions`.\n   - Apply `min-h-[60px] h-auto flex flex-col sm:flex-row gap-3` to ensure CTA visibility at viewport <= 480px.\n2. In `src/services/stripe.ts`:\n   - Ensure `initStripe()` resolves before invoking `createPaymentMethod()` to prevent undefined property errors.\n   - Add proper null check and loading spinner during SDK retrieval.\n3. Verify both desktop (1280px) and mobile (375px) viewports with zero CLS.",
  "screenshots": {
    "desktop": "/screenshots/job_98fa3bc/desktop.png",
    "mobile": "/screenshots/job_98fa3bc/mobile.png",
    "desktopWidth": 1280,
    "mobileWidth": 375
  }
}
```

> **Screenshot URLs**: The frontend supports relative paths (e.g. `/screenshots/...`), full HTTP(S) URLs, and base64 Data URIs (`data:image/...`).

---

### 4. Cancel Analysis
- **Method / Path**: `DELETE /api/analyses/:jobId`

#### Success Response (`200 OK` or `204 No Content`)
```json
{
  "status": "cancelled"
}
```

---

## 🎨 UI & Layout Specs

- **Theme**: Dark Slate theme (`bg-slate-950`, `bg-slate-900`, `border-slate-800`).
- **Responsive Breakpoints Verified**: `390px` (iPhone/Mobile), `768px` (iPad/Tablet), `1440px` (Desktop).
- **Accessibility**: Full keyboard focus visibility (`focus-visible:ring-2 focus-visible:ring-sky-500`), ARIA status announcer roles, and screen-reader labeled controls.
- **State Machine**: Single-page architecture with state transition flow: `"submit" -> "progress" -> "report"`.
