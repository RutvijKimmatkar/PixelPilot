import { chromium } from 'playwright';
import { config } from '../config/env.js';
import { AppError } from '../errors/appError.js';

/**
 * Service handling trusted Playwright browser execution and layout measurements.
 */
export class PlaywrightService {
  /**
   * Run desktop and mobile inspections on the target URL.
   *
   * @param {string} url - Validated public website URL
   * @param {object} [targetedPlan] - Optional hints from Gemma for elements to inspect
   * @param {function} [onProgress] - Optional callback for reporting step progress
   * @returns {Promise<object>} Collected layout evidence and screenshots
   */
  static async inspectWebpage(url, targetedPlan = null, onProgress = () => {}) {
    let browser = null;

    try {
      onProgress({ step: 'opening_browser', message: 'Opening browser' });

      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const consoleErrors = [];

      // -------------------------------------------------------------
      // 1. DESKTOP RUN
      // -------------------------------------------------------------
      onProgress({ step: 'desktop_screenshot', message: 'Capturing desktop screenshot' });

      const desktopContext = await browser.newContext({
        viewport: config.playwright.desktopViewport,
      });

      const desktopPage = await desktopContext.newPage();

      desktopPage.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push({ viewport: 'desktop', text: msg.text() });
        }
      });
      desktopPage.on('pageerror', (err) => {
        consoleErrors.push({ viewport: 'desktop', text: err.message });
      });

      await desktopPage.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: config.playwright.timeoutMs,
      });

      // Allow animations and fonts to settle briefly
      await desktopPage.waitForTimeout(1000);

      const desktopScreenshotBuffer = await desktopPage.screenshot({
        fullPage: false,
        type: 'png',
      });
      const desktopScreenshot = `data:image/png;base64,${desktopScreenshotBuffer.toString('base64')}`;

      const desktopMetrics = await desktopPage.evaluate(() => {
        const root = document.documentElement;
        return {
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          scrollWidth: root.scrollWidth,
          scrollHeight: root.scrollHeight,
          hasHorizontalOverflow: root.scrollWidth > window.innerWidth + 2,
        };
      });

      await desktopContext.close();

      // -------------------------------------------------------------
      // 2. MOBILE RUN
      // -------------------------------------------------------------
      onProgress({ step: 'mobile_screenshot', message: 'Capturing mobile screenshot' });

      const mobileContext = await browser.newContext({
        viewport: config.playwright.mobileViewport,
        userAgent: config.playwright.mobileUserAgent,
        isMobile: true,
        hasTouch: true,
      });

      const mobilePage = await mobileContext.newPage();

      mobilePage.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push({ viewport: 'mobile', text: msg.text() });
        }
      });
      mobilePage.on('pageerror', (err) => {
        consoleErrors.push({ viewport: 'mobile', text: err.message });
      });

      await mobilePage.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: config.playwright.timeoutMs,
      });

      await mobilePage.waitForTimeout(1000);

      const mobileScreenshotBuffer = await mobilePage.screenshot({
        fullPage: false,
        type: 'png',
      });
      const mobileScreenshot = `data:image/png;base64,${mobileScreenshotBuffer.toString('base64')}`;

      // -------------------------------------------------------------
      // 3. MOBILE DOM & CSS DIAGNOSTIC EXTRACTION
      // -------------------------------------------------------------
      onProgress({ step: 'checking_layout', message: 'Checking layout and CSS' });

      const targetKeywords = targetedPlan?.suggestedSelectors || [
        'card',
        'grid',
        'pricing',
        'flex',
        'container',
        'button',
        'section',
        'article',
      ];

      const mobileMetrics = await mobilePage.evaluate((keywords) => {
        const root = document.documentElement;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollWidth = root.scrollWidth;
        const hasHorizontalOverflow = scrollWidth > viewportWidth + 2;

        const overflowingElements = [];
        const suspiciousElements = [];
        const overlaps = [];

        // Scan all visible elements on page
        const allElements = Array.from(document.querySelectorAll('body *'));

        for (const el of allElements) {
          const style = window.getComputedStyle(el);
          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            parseFloat(style.opacity || '1') === 0
          ) {
            continue;
          }

          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) continue;

          // Check if element extends past the right edge
          if (rect.right > viewportWidth + 5 && rect.left < viewportWidth) {
            overflowingElements.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              className: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
              textSnippet: el.innerText ? el.innerText.trim().slice(0, 60) : '',
              rect: {
                left: Math.round(rect.left),
                top: Math.round(rect.top),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              },
              computedStyles: {
                width: style.width,
                minWidth: style.minWidth,
                maxWidth: style.maxWidth,
                display: style.display,
                overflow: style.overflow,
                overflowX: style.overflowX,
                position: style.position,
                gridTemplateColumns: style.gridTemplateColumns,
                flexWrap: style.flexWrap,
                boxSizing: style.boxSizing,
              },
            });
          }

          // Check if element matches keywords (e.g., card, pricing, grid)
          const classOrId = `${el.className || ''} ${el.id || ''}`.toLowerCase();
          const matchesKeyword = keywords.some((kw) => classOrId.includes(kw.toLowerCase()));

          if (matchesKeyword && suspiciousElements.length < 15) {
            suspiciousElements.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || null,
              className: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
              rect: {
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              },
              computedStyles: {
                width: style.width,
                minWidth: style.minWidth,
                maxWidth: style.maxWidth,
                display: style.display,
                gridTemplateColumns: style.gridTemplateColumns,
                flexDirection: style.flexDirection,
                flexWrap: style.flexWrap,
                position: style.position,
              },
            });
          }
        }

        // Check for sibling overlaps in containers (e.g. cards overlapping)
        const candidateContainers = Array.from(
          document.querySelectorAll('div, section, main, ul, ol')
        ).slice(0, 50);

        for (const container of candidateContainers) {
          const children = Array.from(container.children).filter((c) => {
            const s = window.getComputedStyle(c);
            return (
              s.display !== 'none' &&
              s.visibility !== 'hidden' &&
              s.position !== 'absolute' &&
              s.position !== 'fixed'
            );
          });

          if (children.length >= 2 && children.length <= 10) {
            for (let i = 0; i < children.length - 1; i++) {
              const r1 = children[i].getBoundingClientRect();
              const r2 = children[i + 1].getBoundingClientRect();

              // Calculate bounding box overlap
              const overlapX = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
              const overlapY = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));

              // If significant intersection occurs between static/relative siblings
              if (overlapX > 20 && overlapY > 20) {
                overlaps.push({
                  elementA: children[i].tagName.toLowerCase() + (children[i].className ? `.${children[i].className.split(' ')[0]}` : ''),
                  elementB: children[i + 1].tagName.toLowerCase() + (children[i + 1].className ? `.${children[i + 1].className.split(' ')[0]}` : ''),
                  overlapArea: Math.round(overlapX * overlapY),
                });
              }
            }
          }
        }

        return {
          viewportWidth,
          viewportHeight,
          scrollWidth,
          hasHorizontalOverflow,
          overflowingElements: overflowingElements.slice(0, 10),
          suspiciousElements: suspiciousElements.slice(0, 10),
          overlaps: overlaps.slice(0, 5),
        };
      }, targetKeywords);

      await mobileContext.close();

      return {
        screenshots: {
          desktop: desktopScreenshot,
          mobile: mobileScreenshot,
        },
        desktopMetrics,
        mobileMetrics,
        consoleErrors: consoleErrors.slice(0, 10),
      };
    } catch (err) {
      if (err.name === 'TimeoutError') {
        throw AppError.badRequest(
          'Timeout while attempting to reach the page. Please ensure the website is fast and publicly accessible.',
          'BROWSER_NAVIGATION_TIMEOUT'
        );
      }
      throw err;
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }
}
