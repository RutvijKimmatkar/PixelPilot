import { useState } from "react";
import { Panel } from "./ui";
import {
  PLAYWRIGHT_SCRIPT_CODE,
  SUGGESTED_FIX_CODE,
  ANTIGRAVITY_PROMPT,
} from "../data/demoData";
import type { TestScope, SelectionRegion, PickedElement } from "../types/console";

interface CodeWorkspaceProps {
  onCopy: (text: string, label: string) => void;
  scope?: TestScope;
  region?: SelectionRegion | null;
  element?: PickedElement | null;
}

export function CodeWorkspace({
  onCopy,
  scope = "page",
  region,
  element,
}: CodeWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"script" | "fix" | "prompt">("fix");

  const tabs = [
    { id: "script", label: "Playwright script", filename: "tests/visual-overflow.spec.ts" },
    { id: "fix", label: "Suggested fix", filename: "styles/navbar.css" },
    { id: "prompt", label: "Antigravity prompt", filename: "cursor-copilot-prompt.txt" },
  ] as const;

  const currentTab = tabs.find((t) => t.id === activeTab)!;

  const getScriptCode = () => {
    if (scope === "site") {
      return `import { test, expect, chromium } from '@playwright/test';

// Whole-site crawl loop up to maxPages (same origin)
test('crawl and test whole site for layout defects', async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const visited = new Set<string>();
  const queue = ['https://shop.acme-demo.dev'];
  const maxPages = 10;

  while (queue.length > 0 && visited.size < maxPages) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.setViewportSize({ width: 375, height: 812 });

    // Collect internal links
    const links = await page.$$eval('a[href]', anchors =>
      anchors.map(a => a.href).filter(h => h.startsWith(location.origin))
    );
    links.forEach(l => { if (!visited.has(l)) queue.push(l); });

    // Measure horizontal DOM overflow
    const overflows = await page.evaluate(() =>
      Array.from(document.querySelectorAll('*'))
        .filter(el => el.scrollWidth > document.documentElement.clientWidth)
        .map(el => ({ tag: el.tagName, class: el.className }))
    );
    console.log(\`[\${url}] Found \${overflows.length} overflow elements\`);
  }

  await browser.close();
});`;
    }

    if (scope === "region" && region) {
      return `import { test, chromium } from '@playwright/test';

test('inspect selected area region clip', async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('https://shop.acme-demo.dev', { waitUntil: 'networkidle' });

  // Cropped area screenshot with explicit bounding box
  await page.screenshot({
    path: 'artifacts/region.png',
    clip: {
      x: ${region.x},
      y: ${region.y},
      width: ${region.width},
      height: ${region.height}
    }
  });

  // Evaluate elements intersecting this coordinate region
  const regionElements = await page.evaluate(({ rx, ry, rw, rh }) => {
    return Array.from(document.querySelectorAll('*')).filter(el => {
      const b = el.getBoundingClientRect();
      return b.left < rx + rw && b.right > rx && b.top < ry + rh && b.bottom > ry;
    }).map(el => el.tagName.toLowerCase());
  }, { rx: ${region.x}, ry: ${region.y}, rw: ${region.width}, rh: ${region.height} });

  console.log('Elements inside selection:', regionElements);
  await browser.close();
});`;
    }

    if (scope === "element" && element) {
      return `import { test, chromium } from '@playwright/test';

test('inspect target element subtree', async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('https://shop.acme-demo.dev', { waitUntil: 'networkidle' });

  // Target element locator screenshot
  const locator = page.locator('${element.selector}');
  await locator.screenshot({ path: 'artifacts/element.png' });

  // Measure element bounding box and computed properties
  const metrics = await locator.evaluate(el => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    overflowX: window.getComputedStyle(el).overflowX,
    flexWrap: window.getComputedStyle(el).flexWrap
  }));

  console.log('Element metrics:', metrics);
  await browser.close();
});`;
    }

    return PLAYWRIGHT_SCRIPT_CODE;
  };

  const getPromptCode = () => {
    if (scope === "region" && region) {
      return `Fix layout bug inside bounded region (x: ${region.x}, y: ${region.y}, ${region.width}×${region.height}px) on https://shop.acme-demo.dev.

Context:
Bounding Box: { x: ${region.x}, y: ${region.y}, width: ${region.width}, height: ${region.height} }
Symptom: Overflow and misalignment within the specified area.

Instructions:
1. Examine elements contained within the (x: ${region.x}, y: ${region.y}) clip area.
2. Check padding, flex-wrap, and max-width boundaries on container elements.
3. Validate with Playwright clip screenshot to ensure no overflow outside the rectangle.`;
    }

    if (scope === "element" && element) {
      return `Fix visual layout bug on specific element '${element.selector}' on https://shop.acme-demo.dev.

Context:
Selector: ${element.selector}
Tag: <${element.tagName}>
Dimensions: ${element.rect.width}px × ${element.rect.height}px

Instructions:
1. Locate '${element.selector}' in the frontend stylesheet.
2. Ensure flex-wrap: wrap is applied and flex items collapse neatly on mobile viewports.
3. Verify using 'page.locator("${element.selector}").screenshot()' that contents do not overflow clientWidth.`;
    }

    if (scope === "site") {
      return `Fix recurring visual overflow patterns across multiple site pages on https://shop.acme-demo.dev.

Scope: Whole site crawl (10 pages)
Issues Detected: 3 pages have navigation bars and banner hero images that break horizontal boundaries.

Instructions:
1. Apply a global layout rule in globals.css setting 'html, body { overflow-x: hidden; }'.
2. Normalize all navbar lists to wrap on screens under 768px.
3. Constrain all <img> tags with 'max-width: 100%; height: auto;'.`;
    }

    return ANTIGRAVITY_PROMPT;
  };

  const getContent = () => {
    switch (activeTab) {
      case "script":
        return getScriptCode();
      case "fix":
        return SUGGESTED_FIX_CODE;
      case "prompt":
        return getPromptCode();
    }
  };

  const codeText = getContent();
  const lines = codeText.split("\n");

  const handleCopy = () => {
    onCopy(
      codeText,
      activeTab === "prompt" ? "Prompt copied to clipboard" : "Code copied to clipboard"
    );
  };

  const renderHighlightedLine = (line: string) => {
    if (activeTab === "prompt") {
      return <span>{line}</span>;
    }

    if (line.trim().startsWith("//") || line.trim().startsWith("/*") || line.trim().startsWith("*")) {
      return <span style={{ color: "#738CA8" }}>{line}</span>;
    }

    const parts = line.split(
      /(\b(?:import|export|const|let|while|await|async|test|expect|return|from|display|flex|flex-direction|flex-wrap|max-width|overflow-x|width|height|gap|padding|tag|className|scrollWidth|clientWidth)\b|'[^']*'|"[^"]*"|`[^`]*`|\d+px|\d+ms|\b\d+\b)/g
    );

    return (
      <>
        {parts.map((p, idx) => {
          if (/^(import|export|const|let|while|await|async|test|expect|return|from)$/.test(p)) {
            return (
              <span key={idx} style={{ color: "#C4B5FD" }}>
                {p}
              </span>
            );
          }
          if (
            /^(display|flex|flex-direction|flex-wrap|max-width|overflow-x|width|height|gap|padding|tag|className|scrollWidth|clientWidth)$/.test(
              p
            )
          ) {
            return (
              <span key={idx} style={{ color: "#7DD3FC" }}>
                {p}
              </span>
            );
          }
          if (/^('.*'|".*"|`.*`)$/.test(p)) {
            return (
              <span key={idx} style={{ color: "#34D399" }}>
                {p}
              </span>
            );
          }
          if (/^(\d+px|\d+ms|\d+)$/.test(p)) {
            return (
              <span key={idx} style={{ color: "#FBBF24" }}>
                {p}
              </span>
            );
          }
          return <span key={idx}>{p}</span>;
        })}
      </>
    );
  };

  return (
    <Panel
      title="Developed code"
      actions={
        <div className="flex gap-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`text-sm pb-1 transition-all border-b-2 font-semibold ${
                activeTab === t.id
                  ? "border-[#181716] text-[#181716]"
                  : "border-transparent text-[#76716B] hover:text-[#181716]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="rounded-[8px] border border-[#181716] bg-[#141312] overflow-hidden shadow-md">
        <div className="h-10 px-4 bg-[#1C1B1A] border-b border-[#2B2927] flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 font-mono text-[#D8D2C8]">
            <span className="text-[#34D399]">●</span>
            <span className="text-[#FAF6EE] font-semibold">{currentTab.filename}</span>
            <span className="text-[#C2B280]">({scope} scope)</span>
            <span className="text-[#8A847E]">{lines.length} lines</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[5px] bg-[#FAF6EE] text-[#181716] hover:bg-[#F0E8DA] font-semibold text-xs transition-colors shadow-xs"
          >
            <svg className="w-3.5 h-3.5 text-[#181716]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>{activeTab === "prompt" ? "Copy prompt" : "Copy code"}</span>
          </button>
        </div>

        <div className="p-4 overflow-x-auto text-[13px] leading-[22px] font-mono bg-[#141312] max-h-[380px]">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`flex items-start ${
                activeTab === "prompt" ? "whitespace-pre-wrap" : "whitespace-pre"
              }`}
            >
              <span className="w-10 text-right pr-4 text-[#5E5953] select-none flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-[#FAF6EE]">{renderHighlightedLine(line)}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
