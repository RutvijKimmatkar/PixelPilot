import type { SiteInfo, PlaywrightAction, IssueItem } from "../types/console";

export const DEMO_SITE_INFO: SiteInfo = {
  title: "Acme Shop – Home",
  url: "https://shop.acme-demo.dev",
  status: 200,
  loadTime: "1.8s",
  pageWeight: "1.4 MB",
  domNodes: 842,
  consoleErrors: 2,
  viewports: ["1280px", "375px"],
};

export const DEMO_ACTIONS: PlaywrightAction[] = [
  { id: "1", name: "Check URL safety", detail: "Public host, https", duration: "0.1s", status: "done", output: "Resolved DNS 104.21.48.12. Valid SSL certificate. Localhost check passed." },
  { id: "2", name: "Launch Chromium", detail: "headless: true", duration: "0.9s", status: "done", output: "Playwright v1.42 launched chromium with flags: --no-sandbox, --disable-dev-shm-usage" },
  { id: "3", name: "Open page at 1280×800", detail: "page.goto, waitUntil networkidle", duration: "1.8s", status: "done", output: "Navigated to https://shop.acme-demo.dev. Status 200. Load event fired in 1.2s." },
  { id: "4", name: "Capture desktop screenshot", detail: "desktop.png", duration: "0.4s", status: "done", output: "Saved full viewport screenshot (1280x800) to artifacts/job_demo/desktop.png" },
  { id: "5", name: "Switch to 375×812 and reload", detail: "page.setViewportSize", duration: "1.2s", status: "done", output: "Emulating iPhone 13 / mobile viewport (375x812, devicePixelRatio: 3)." },
  { id: "6", name: "Capture mobile screenshot", detail: "mobile.png", duration: "0.4s", status: "done", output: "Saved viewport screenshot (375x812) to artifacts/job_demo/mobile.png" },
  { id: "7", name: "Measure DOM overflow", detail: "page.evaluate: scrollWidth > clientWidth", duration: "0.3s", status: "done", output: "Found element `header.navbar > ul.nav-links` with scrollWidth=612px > clientWidth=375px (+237px overflow)." },
  { id: "8", name: "Collect console errors", detail: "page.on('console')", duration: "0.1s", status: "done", output: "Console [error]: Failed to load resource: the server responded with a status of 404 (/assets/logo.svg)" },
  { id: "9", name: "Run Gemma diagnosis", detail: "Root cause and fix", duration: "6.2s", status: "done", output: "Synthesized multi-modal diagnosis and Tailwind flex-wrap fix snippet." },
];

export const DEMO_ISSUES: IssueItem[] = [
  {
    id: "iss-1",
    severity: "high",
    title: "Horizontal overflow at 375px",
    selector: "header.navbar > ul.nav-links",
    measurement: "612px content in 375px viewport",
    viewport: "375px",
  },
  {
    id: "iss-2",
    severity: "medium",
    title: "Hero image wider than its container",
    selector: "img.hero-banner",
    measurement: "480px in a 343px container",
    viewport: "375px",
  },
  {
    id: "iss-3",
    severity: "low",
    title: "2 console errors",
    selector: "Failed to load resource: 404 /assets/logo.svg",
    measurement: "HTTP 404 on asset request",
    viewport: "Global",
  },
];

export const PLAYWRIGHT_SCRIPT_CODE = `import { test, expect, chromium } from '@playwright/test';

test('inspect visual bugs on live target', async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  // Desktop run (1280x800)
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('https://shop.acme-demo.dev', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'artifacts/desktop.png' });

  // Mobile run (375x812)
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: 'artifacts/mobile.png' });

  // Scan for horizontal DOM overflows
  const overflowElements = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    return Array.from(document.querySelectorAll('*'))
      .filter(el => el.scrollWidth > docWidth)
      .map(el => ({
        tag: el.tagName.toLowerCase(),
        className: el.className,
        scrollWidth: el.scrollWidth,
        clientWidth: docWidth
      }));
  });

  console.log('Overflow elements found:', overflowElements);
  await browser.close();
});`;

export const SUGGESTED_FIX_CODE = `/* Suggested Fix for header.navbar > ul.nav-links */

/* 1. Pure CSS Solution */
header.navbar > ul.nav-links {
  display: flex;
  flex-wrap: wrap;       /* Prevent rigid one-line overflow */
  max-width: 100%;
  overflow-x: hidden;    /* Disallow unintentional sideways scrolling */
}

@media (max-width: 640px) {
  header.navbar > ul.nav-links {
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem 0;
  }
}

/* 2. Tailwind CSS equivalent */
/* Before: <ul className="flex items-center space-x-6"> */
/* After:  <ul className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 sm:gap-6 max-w-full"> */

/* Fix for img.hero-banner */
img.hero-banner {
  max-width: 100%;
  height: auto;
  display: block;
}`;

export const ANTIGRAVITY_PROMPT = `Fix the mobile horizontal scrollbar caused by the navigation menu overflowing on viewport 375px.

Context:
Target: header.navbar > ul.nav-links
Problem: The nav link list has an unconstrained flex-row layout causing a width of 612px on mobile viewports (375px), forcing horizontal page scroll.

Instructions:
1. Update 'header.navbar > ul.nav-links' to wrap items or convert into a collapsible drawer/column layout on viewports below 640px.
2. Ensure 'overflow-x: hidden' is maintained on the root <html> and <body> tags.
3. Constrain 'img.hero-banner' with 'max-width: 100%' and 'height: auto' to prevent sub-container clipping.
4. Run tests in Playwright using mobile viewport (375x812) to verify scrollWidth === clientWidth.`;
