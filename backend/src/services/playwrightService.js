import { chromium } from 'playwright';
import { config } from '../config/env.js';
import { AppError } from '../errors/appError.js';

/**
 * Service handling trusted Playwright browser execution and layout measurements.
 */
export class PlaywrightService {

  /**
   * Opens the target URL in Chromium, waits for it to render, and captures
   * high-resolution screenshot and dimensions for user inspection.
   *
   * @param {string} url - Validated public website URL
   * @param {object} [options]
   * @param {boolean} [options.fullPage=false]
   * @returns {Promise<{ url: string, title: string, status: number, screenshot: string, viewport: object, scrollDimensions: object }>}
   */
  static async openAndCapturePage(url, options = {}) {
    let browser = null;

    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const context = await browser.newContext({
        viewport: config.playwright.desktopViewport,
      });

      const page = await context.newPage();

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: config.playwright.timeoutMs,
      });

      // Allow animations and fonts to settle
      await page.waitForTimeout(1200);

      const title = await page.title();

      const scrollDimensions = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          scrollWidth: root.scrollWidth,
          scrollHeight: root.scrollHeight,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          hasHorizontalOverflow: root.scrollWidth > window.innerWidth + 2,
        };
      });

      const screenshotBuffer = await page.screenshot({
        fullPage: Boolean(options.fullPage),
        type: 'png',
      });

      const screenshot = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;

      await context.close();

      return {
        url,
        title: title || url,
        status: response ? response.status() : 200,
        screenshot,
        viewport: config.playwright.desktopViewport,
        scrollDimensions,
      };
    } catch (err) {
      if (err.name === 'TimeoutError' || err.message?.includes('Timeout')) {
        throw AppError.badRequest(
          'Timeout while attempting to reach the website. Please verify the URL is online and responsive.',
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

