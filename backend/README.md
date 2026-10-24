# Visual Debugging Assistant - Backend

The backend service for the Visual Debugging Assistant. It orchestrates automated Chromium browser inspections (via Playwright) and AI-powered visual layout analysis (via Google Gemini / Gemma) to diagnose responsive frontend bugs and generate ready-to-use Antigravity prompts.

---

## 🛠️ Tech Stack & Architecture

- **Runtime:** Node.js (v20+) with ES Modules (`type: module`)
- **Framework:** Express.js 4
- **Browser Automation:** Playwright (Chromium headless)
- **AI Engine:** Google Generative AI (`@google/generative-ai`) — Gemini 1.5 Flash / Gemma 2
- **Validation:** Zod Schema Validation
- **Security:** Strict SSRF prevention blocking loopback and private IP subnets

### Pragmatic Layered Structure

```text
backend/
├── .env.example              # Template environment variables
├── .env                      # Local environment configuration
├── .gitignore                # Git ignore configuration
├── package.json              # Project dependencies and run scripts
├── README.md                 # Documentation
└── src/
    ├── app.js                # Express app configuration & middleware
    ├── server.js             # Server startup & graceful shutdown lifecycle
    ├── config/
    │   └── env.js            # Environment validation & constants
    ├── errors/
    │   └── appError.js       # Central operational error model
    ├── middleware/
    │   ├── errorHandler.js   # Global error handling middleware
    │   └── validateRequest.js# Zod body validation middleware
    ├── routes/
    │   ├── index.js          # API route aggregator (/api)
    │   └── debugRoutes.js    # Debugging & health endpoints
    ├── controllers/
    │   └── debugController.js# HTTP request & streaming controller
    ├── services/
    │   ├── debugService.js   # Master pipeline orchestrator
    │   ├── playwrightService.js # Trusted browser checks & DOM extraction
    │   └── geminiService.js  # Inspection planning & diagnosis synthesis
    ├── schemas/
    │   └── analyzeSchema.js  # Zod schema for URL and issue description
    └── utils/
        └── urlValidator.js   # SSRF defense & public URL validator
```

---

## 📦 Required Packages

### Production Dependencies
- `express`: Core web application framework
- `cors`: Cross-Origin Resource Sharing for frontend access
- `dotenv`: Environment configuration loader
- `playwright`: Headless browser automation for screenshots and layout metrics
- `@google/generative-ai`: Official Google Generative AI SDK for Gemini and Gemma models
- `zod`: Request schema validation

### Development Dependencies
- `nodemon`: Hot-reloading server during local development

---

## 🚀 Setup & Installation Instructions

### 1. Install Dependencies

In the `backend` directory, run:

```bash
npm install
```

### 2. Install Playwright Chromium

Playwright requires Chromium browser binaries to capture screenshots and evaluate the DOM:

```bash
npx playwright install chromium
```

### 3. Configure Environment Variables

Open `.env` (or copy `.env.example` to `.env`) and add your Gemini API key:

```env
PORT=5000
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:5173

GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
BROWSER_TIMEOUT_MS=20000
```

> **Note:** You can obtain a free API key at [Google AI Studio](https://aistudio.google.com/).

### 4. Start the Server

- **Development mode (with auto-reload):**
  ```bash
  npm run dev
  ```
- **Production mode:**
  ```bash
  npm start
  ```

---

## 📡 API Endpoints

### 1. `GET /api/health`
Health check endpoint.
- **Response:** `200 OK`
```json
{
  "status": "ok",
  "service": "visual-debugging-assistant-backend",
  "timestamp": "2026-10-24T06:30:00.000Z"
}
```

### 2. `POST /api/analyze`
Standard JSON analysis endpoint.
- **Request Body:**
```json
{
  "url": "https://example-portfolio.vercel.app",
  "issueDescription": "The project cards overlap and text gets cut off on mobile."
}
```
- **Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "url": "https://example-portfolio.vercel.app",
    "issueDescription": "The project cards overlap and text gets cut off on mobile.",
    "diagnosis": "The pricing cards overflow horizontally on mobile screens.",
    "likelyReason": "The page keeps a 3-column CSS grid with 280px min-width cards without a mobile breakpoint.",
    "evidence": [
      "Page scrollWidth is 982px on a 390px mobile viewport.",
      "Horizontal overflow detected (scrollWidth > clientWidth).",
      "Pricing container has grid-template-columns: repeat(3, minmax(280px, 1fr))."
    ],
    "suggestedFix": "Add a mobile media query (@media (max-width: 768px)) to switch the grid to single-column (1fr).",
    "antigravityPrompt": "...",
    "screenshots": {
      "desktop": "data:image/png;base64,...",
      "mobile": "data:image/png;base64,..."
    },
    "metrics": { ... }
  }
}
```

### 3. `GET /api/analyze/stream?url={url}&issueDescription={issue}`
Server-Sent Events (SSE) streaming endpoint for live progress feedback (Screen 2):
- Streams `event: progress` events:
  - `validating_url`
  - `planning_inspection`
  - `opening_browser`
  - `desktop_screenshot`
  - `mobile_screenshot`
  - `checking_layout`
  - `preparing_diagnosis`
- Streams `event: complete` with the full final debugging report.