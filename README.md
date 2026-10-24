# Visual Debugging Assistant

An automated frontend layout and visual responsiveness diagnosis platform powered by Playwright headless browser checks and Google Gemini/Gemma multimodal AI models. Built for the GDGC Hackathon.

## Overview

Modern web applications frequently break across viewports due to fixed pixel widths, overflowing elements, improper CSS flex/grid configurations, or unexpected clipping. Debugging these responsive layout defects manually across multiple screen sizes is time-consuming.

The Visual Debugging Assistant bridges automated browser telemetry and large language models:

1. Runs automated headless browser inspections across desktop (1280 × 800) and mobile (390 × 844) viewports using Playwright.
2. Detects real-world DOM defects, including horizontal overflow, overlapping elements, touch target violations, and browser console errors.
3. Analyzes browser metrics and screenshots using Google Gemini/Gemma models to generate concise root-cause explanations, concrete CSS fixes, and ready-to-use Antigravity IDE prompts.

## Key Features

- **Dual Viewport Auditing:** Captures desktop and mobile screenshots for side-by-side analysis.
- **Automated Metric Extraction:** Identifies horizontal scroll triggers (`scrollWidth > clientWidth`), computed bounding-box collisions, and out-of-bounds DOM elements.
- **Targeted AI Inspection Planning:** Uses AI to identify relevant CSS selectors and high-risk layout properties based on developer problem descriptions.
- **Synthesized Diagnosis and Actionable Fixes:** Produces plain-language explanations, root causes, CSS patch recommendations, and AI agent-ready prompt templates.
- **Real-Time Progress Streaming:** Uses Server-Sent Events (SSE) to provide live updates during browser execution and AI analysis.
- **Multimodal Screenshot Diagnosis:** Supports image-based visual analysis of developer-uploaded screenshots and canvas snippets.
- **Local Server Auto-Detection:** Automatically probes common local development ports, including 3000, 5173, and 8080.
- **Built-In Demo Mode:** Provides simulated analysis for testing and judging without requiring live browser execution or active API keys.

## Architecture and Workflow

Developer Input: URL and Issue Description

↓

Backend / Express Orchestrator

↓

Parallel Processing:

- AI Inspection Planner: Uses Gemma/Gemini to identify relevant inspection targets.
- Playwright Chromium: Performs desktop and mobile audits, collects DOM metrics and bounding boxes, captures screenshots, and records console errors.

↓

AI Synthesis Engine: Uses Gemini/Gemma to analyze collected evidence.

↓

Structured JSON / SSE Response:

- Issue diagnosis
- Root technical cause
- Evidence and measurements
- Actionable CSS code patch
- Antigravity AI agent prompt

## Technology Stack

### Backend

- Node.js with ES modules
- Express 4.x
- Playwright for headless Chromium browser automation
- Google Generative AI SDK (`@google/generative-ai`)
- Zod for schema validation
- Server-Sent Events (SSE) for progress streaming

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Oxlint for fast linting

## Repository Structure

```text
gdgcHacktober/
├── backend/
│   ├── public/              # Static assets and embedded web UI
│   ├── src/
│   │   ├── config/          # Central configuration and environment validation
│   │   ├── controllers/     # Request controllers (DebugController)
│   │   ├── errors/          # Custom error classes and handlers
│   │   ├── middleware/      # Request validation and error handling
│   │   ├── routes/          # Express route definitions
│   │   ├── schemas/         # Zod validation schemas
│   │   ├── services/        # PlaywrightService, GeminiService, DebugService
│   │   ├── utils/           # URL validation and SSRF guards
│   │   ├── app.js           # Express app setup and middleware
│   │   └── server.js        # Server entry point and graceful shutdown
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components for metrics, previews, and diagnoses
│   │   ├── data/            # Mock dataset for offline demonstration mode
│   │   ├── hooks/           # Custom React hooks for polling and streaming
│   │   ├── lib/             # API client and utility helpers
│   │   ├── types/           # TypeScript interfaces and response schemas
│   │   ├── App.tsx          # Main application dashboard
│   │   └── main.tsx         # React application entry point
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── package.json             # Root monorepo scripts
└── README.md
```

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Google Gemini API key, available through Google AI Studio

## Installation

Clone the repository and install the dependencies for the root project, backend, and frontend.

```bash
git clone https://github.com/RutvijKimmatkar/gdgcHacktober.git
cd gdgcHacktober

npm run install:all
```

Install the Playwright Chromium browser binaries:

```bash
npx playwright install chromium
```

## Configuration

### Backend Configuration

Create a `.env` file in the `backend/` directory.

```env
# Server Port
PORT=5000

# Environment Mode
NODE_ENV=development

# Allowed CORS Origin
ALLOWED_ORIGIN=http://localhost:5173

# Google Gemini / Gemma API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemma-4-31b-it

# Browser Execution Settings
BROWSER_TIMEOUT_MS=20000
```

### Frontend Configuration

Create a `.env` file in the `frontend/` directory.

```env
# Backend API Base URL
VITE_API_URL=http://localhost:5000

# Enable in-memory mock demo mode
VITE_USE_MOCK=true
```

## Running the Application

### Development Mode

Run the backend and frontend concurrently or in separate terminals.

Terminal 1: Start the backend service.

```bash
npm run dev:backend
```

Backend URL: `http://localhost:5000`

Terminal 2: Start the frontend development server.

```bash
npm run dev:frontend
```

Frontend URL: `http://localhost:5173`

### Production Build

Build the frontend bundle:

```bash
npm run build:frontend
```

Start the production backend server:

```bash
npm run start:backend
```

## API Reference

All backend API routes are mounted under the `/api` prefix.

### 1. Health Check

**Method:** `GET /api/health`

**Description:** Verifies backend server availability.

**Example Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-10-24T17:00:00.000Z"
}
```

### 2. Full Visual Analysis

**Method:** `POST /api/analyze` or `POST /api/analyses`

**Headers:** `Content-Type: application/json`

**Example Request:**

```json
{
  "url": "https://example.com",
  "issueDescription": "Horizontal scroll appears on mobile screens and card layout breaks.",
  "mode": "public"
}
```

**Example Response:**

```json
{
  "url": "https://example.com",
  "issueDescription": "Horizontal scroll appears on mobile screens...",
  "diagnosis": "Card grid container exceeds viewport width due to fixed min-width rules.",
  "likelyReason": "The .pricing-grid element enforces min-width: 450px on viewports under 390px.",
  "evidence": [
    "Mobile document scrollWidth is 470px against a 390px viewport width",
    "Element .pricing-grid overflows the right boundary by 80px",
    "Missing flex-wrap or responsive media queries on the container"
  ],
  "suggestedFix": ".pricing-grid {\n  min-width: 0;\n  width: 100%;\n  grid-template-columns: 1fr;\n}",
  "antigravityPrompt": "Fix the mobile layout overflow in .pricing-grid by replacing fixed width constraints with responsive flex/grid declarations.",
  "screenshots": {
    "desktop": "data:image/png;base64,...",
    "mobile": "data:image/png;base64,..."
  },
  "metrics": {
    "desktop": {
      "scrollWidth": 1280,
      "hasHorizontalOverflow": false
    },
    "mobile": {
      "scrollWidth": 470,
      "hasHorizontalOverflow": true,
      "overflowingElements": []
    },
    "consoleErrors": []
  }
}
```

### 3. Real-Time Analysis Stream

**Method:** `GET /api/analyze/stream?url=<encoded_url>&issueDescription=<encoded_text>`

**Protocol:** Server-Sent Events (SSE)

**Description:** Streams progress updates during the analysis process.

**Example Events:**

- `validating_url`
- `opening_browser`
- `mobile_screenshot`
- `checking_layout`
- `completed`

The stream concludes with the final diagnosis payload.

### 4. Multimodal Direct Visual Diagnosis

**Method:** `POST /api/diagnose-visual`

**Headers:** `Content-Type: application/json`

**Example Request:**

```json
{
  "screenshot": "data:image/png;base64,...",
  "query": "Identify why the navigation bar elements are overlapping.",
  "url": "https://example.com"
}
```

**Description:** Analyzes an uploaded screenshot to identify visual defects and explain their likely causes.

### 5. Local Development Server Detection

**Method:** `GET /api/local/detect`

**Description:** Scans common local development ports on localhost and reports running development servers.

### 6. Interactive Preview Proxy

**Method:** `GET /api/proxy?url=<target_url>`

**Description:** Serves proxied HTML for inline iframe preview rendering.

## Code Quality and Verification

Run frontend linting with Oxlint:

```bash
npm --prefix frontend run lint
```

Run TypeScript compilation and create a production build:

```bash
npm --prefix frontend run build
```

## License

This project is open source and available under the MIT License. See the [LICENSE](LICENSE) file for details.
