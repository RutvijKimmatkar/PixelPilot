# gdgcHacktober

# Visual Debugging Assistant

An AI-powered visual debugging tool for indie developers.

Enter a public website URL, describe what looks wrong, and get a browser-backed report with screenshots, live DOM/CSS evidence, likely causes, suggested fixes, and a copy-ready prompt for Antigravity.

Built for a hackathon using React, Tailwind CSS, Node.js, Express, Playwright, and Gemma through the event-provided Gemini API.

## The problem

Frontend bugs are often easy to see but difficult to explain.

Examples:

- Cards overlap on mobile.
- Text is cut off.
- A page has unwanted horizontal scrolling.
- A button falls outside the screen.
- A layout looks fine on desktop but breaks on a phone.

Developers normally need to resize the browser, inspect elements, check CSS, read errors, and guess which component caused the issue.

Visual Debugging Assistant does these first checks automatically and turns them into a clear debugging report.

## What it does

```text
User enters public URL + visual issue
              │
              ▼
Local backend opens the page with Playwright
              │
              ├── Captures desktop/mobile screenshots
              ├── Checks browser console messages
              ├── Detects overflow and possible overlap
              ├── Reads element size and position
              └── Extracts relevant live DOM/CSS details
              │
              ▼
Gemma analyzes the collected evidence
              │
              ▼
User receives report + Antigravity fix prompt
```

The tool does not blindly ask an AI to guess. It first collects evidence from the actual rendered webpage.

## What the user provides

The user needs:

1. A publicly accessible website URL

   ```text
   https://my-site.vercel.app/pricing
   ```

2. A short description of the issue

   ```text
   The pricing cards overlap and text gets cut off on mobile.
   ```

3. Internet access

The person running the project locally also needs Node.js, Playwright Chromium, and a Gemini API key supplied by the hackathon/event.

## What the user sees

### 1. Submit issue page

The user enters a public URL and explains the visual problem.

```text
┌──────────────────────────────────────────────────────┐
│  Visual Debugging Assistant                           │
│                                                      │
│  Website URL                                         │
│  [ https://my-site.com/pricing                    ]  │
│                                                      │
│  What looks wrong?                                  │
│  [ Cards overlap and text gets cut off on mobile. ]  │
│                                                      │
│               [ Analyze visual issue → ]             │
└──────────────────────────────────────────────────────┘
```

### 2. Analysis progress page

The user sees which checks are currently being performed.

```text
✓ URL validated
✓ Opening isolated browser
✓ Capturing desktop screenshot
● Capturing mobile screenshot
○ Inspecting layout, DOM, and CSS
○ Generating diagnosis
```

### 3. Final report page

The user sees:

- A short explanation of the issue
- Desktop and mobile screenshots
- Evidence collected from the webpage
- The likely cause
- Suggested fix steps
- A prompt to paste into Antigravity

```text
Issue found: Pricing cards overflow on mobile.

Likely cause:
The pricing grid stays in three columns at mobile width.

Evidence:
- Grid width: 982px
- Mobile viewport width: 390px
- Horizontal overflow detected
- grid-template-columns: repeat(3, minmax(280px, 1fr))

[ Copy Antigravity prompt ]
```

## Live webpage code analysis

A public website does not expose its original source repository, component files, or folder names. For example, the tool cannot reliably know whether the correct source file is named `PricingGrid.tsx`.

However, Playwright can inspect the **rendered webpage**.

It can collect:

- Rendered HTML/DOM
- Class names and attributes
- Visible text
- Element dimensions and positions
- Computed CSS values
- Grid and Flexbox configuration
- Overflow and clipping information
- Browser console errors
- Loaded CSS information when available

Example evidence extracted from a page:

```json
{
  "selector": ".pricing-grid",
  "viewport": {
    "width": 390,
    "height": 844
  },
  "boundingBox": {
    "x": 0,
    "y": 420,
    "width": 982,
    "height": 510
  },
  "computedStyles": {
    "display": "grid",
    "gridTemplateColumns": "280px 280px 280px",
    "overflowX": "visible"
  },
  "finding": "The element is wider than the mobile viewport."
}
```

This gives Gemma meaningful evidence to analyze, instead of only a screenshot.

## How Gemma is used

Gemma does not get unrestricted browser control.

The backend owns Playwright and runs only safe, predefined checks. Gemma can prioritize or interpret those checks, but cannot execute arbitrary browser scripts or access private systems.

The review is limited to a small number of passes:

```text
Pass 1: Standard desktop/mobile checks
        │
        ▼
Gemma analyzes evidence
        │
        ▼
Pass 2: Optional targeted allowed checks
        │
        ▼
Final report
```

This prevents endless loops and keeps analysis fast enough for a hackathon demo.

## What the report gives back

Each completed analysis includes:

### Simple diagnosis

```text
The pricing cards are too wide for the mobile screen, causing horizontal overflow.
```

### Evidence

```text
- Screenshot shows the third card extending beyond the viewport.
- Pricing grid is 982px wide at a 390px viewport.
- The grid remains three columns wide on mobile.
```

### Suggested fix

```text
Add a responsive breakpoint that switches the pricing grid to one column on smaller screens.
```

### Antigravity prompt

The prompt does not invent source file names. Instead, it tells Antigravity what rendered section and styling behavior to locate in the user’s codebase.

```text
You are fixing a responsive visual issue in this web project.

Observed page:
https://example.com/pricing

User-reported issue:
Pricing cards overlap and text is cut off on mobile.

Evidence:
- At a 390px viewport, the pricing grid is 982px wide.
- Horizontal overflow was detected.
- The rendered grid uses three columns with a 280px minimum width.

Please locate the component and styles that render the pricing section.
Reproduce the issue near 390px width and implement the smallest responsive fix.
Preserve the desktop layout and verify the result at both 390px and 1440px widths.
Do not refactor unrelated code.
```

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, TypeScript, Express |
| Browser automation | Playwright with Chromium |
| AI analysis | Gemma via the event-approved Gemini API |
| Temporary storage | Local filesystem |

## Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                      Local machine                        │
│                                                          │
│  React frontend                                          │
│  http://localhost:5173                                  │
│           │                                              │
│           │ REST API                                     │
│           ▼                                              │
│  Node.js + Express backend                               │
│  http://localhost:3000                                  │
│           │                                              │
│     ┌─────┴────────┐                                     │
│     ▼              ▼                                     │
│  Playwright     Gemini API                               │
│  Chromium       Gemma analysis                           │
│     │              │                                     │
│     ▼              ▼                                     │
│  Screenshots + live DOM/CSS → debugging report           │
└──────────────────────────────────────────────────────────┘
```

Playwright is part of the backend. The project is not browser-only because browser security does not allow a normal frontend application to freely inspect arbitrary external websites.

## Project structure

```text
visual-debugging-assistant/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── SubmitPage.tsx
│   │   │   ├── ProgressPage.tsx
│   │   │   └── ReportPage.tsx
│   │   ├── lib/api.ts
│   │   └── App.tsx
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── checks/
│   │   │   ├── screenshots.ts
│   │   │   ├── consoleErrors.ts
│   │   │   ├── overflow.ts
│   │   │   ├── geometry.ts
│   │   │   ├── computedStyles.ts
│   │   │   └── domSnapshot.ts
│   │   ├── routes/
│   │   │   └── analyses.ts
│   │   ├── services/
│   │   │   ├── analysisOrchestrator.ts
│   │   │   ├── gemmaClient.ts
│   │   │   ├── jobStore.ts
│   │   │   ├── playwrightRunner.ts
│   │   │   └── urlSafety.ts
│   │   ├── types/
│   │   │   ├── analysis.ts
│   │   │   └── evidence.ts
│   │   └── app.ts
│   ├── artifacts/
│   ├── .env.example
│   └── package.json
│
├── package.json
├── .gitignore
└── README.md
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Gemini API key supplied by the event/hackathon
- Internet access

### Installation

```bash
git clone <your-repository-url>
cd visual-debugging-assistant
npm install
npx playwright install chromium
```

### Configure environment variables

Create `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Add your API key:

```env
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_event_api_key_here
```

Do not commit the actual `.env` file.

### Run the project

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

## API overview

### Create a review

`POST /api/analyses`

```json
{
  "url": "https://example.com/pricing",
  "issueDescription": "The pricing cards overlap and text is cut off on mobile."
}
```

Response:

```json
{
  "jobId": "ana_01HX123",
  "status": "queued"
}
```

### Read review progress or result

`GET /api/analyses/:jobId`

```json
{
  "jobId": "ana_01HX123",
  "status": "completed",
  "report": {
    "summary": "The pricing grid remains three columns wide at mobile width, causing overflow and clipped text.",
    "confidence": "high",
    "likelyCause": "No responsive breakpoint collapses the pricing grid on small screens.",
    "recommendedFix": [
      "Use a one-column grid below the tablet breakpoint.",
      "Ensure inner content can shrink using min-width: 0 where needed."
    ],
    "antigravityPrompt": "..."
  }
}
```

## Safety

Users submit arbitrary URLs, so the backend includes protections.

### Unsafe URL blocking

The app blocks:

- `localhost`
- `127.0.0.1`
- `::1`
- Private ranges such as `10.x.x.x`, `192.168.x.x`, and `172.16.x.x`
- Link-local and reserved IP ranges
- `file:`, `data:`, and unsupported URL schemes
- Redirects leading to unsafe targets

### Browser isolation

Every review uses:

- A new Playwright browser context
- No saved cookies
- No login information
- No browser extensions
- No downloads
- Navigation and total-job timeouts
- Browser cleanup after every request

### API-key protection

- Gemini credentials are stored only in `backend/.env`.
- The frontend never receives the Gemini API key.
- Generated screenshots and artifacts are stored locally.
- Model output cannot run arbitrary browser commands.

## MVP scope

The MVP supports:

- One public page at a time
- Desktop and mobile visual checks
- Screenshots
- Overflow, clipping, and possible-overlap checks
- Browser console messages
- Rendered DOM/CSS evidence
- Gemma diagnosis and Antigravity prompt generation

The MVP does not support:

- Login-protected websites
- Direct code editing
- Original source-file discovery
- Repository access
- Multi-page journeys
- Full website crawling
- Safari/Firefox browser comparison
- Persistent user accounts or report history

## Future improvements

- Optional GitHub repository connection
- Upload selected source files for more exact fix suggestions
- Click a screenshot area to inspect that element
- Cross-browser testing
- Visual regression history
- Accessibility and performance checks
- Pull-request generation after user approval

## Team split

| Role | Ownership |
|---|---|
| Frontend Developer 1 | URL submission and progress screens |
| Frontend Developer 2 | Report screen, screenshots, evidence UI, copy prompt |
| Backend Developer 1 | Playwright, screenshots, DOM/CSS extraction, browser safety |
| Backend Developer 2 | Express APIs, job orchestration, Gemma integration, final reports |

## License

Built as a hackathon MVP. Add an appropriate license before public release.