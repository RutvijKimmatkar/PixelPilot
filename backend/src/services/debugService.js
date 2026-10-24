import { validatePublicUrl } from '../utils/urlValidator.js';
import { GeminiService } from './geminiService.js';
import { PlaywrightService } from './playwrightService.js';

/**
 * Orchestrator service for the Visual Debugging analysis pipeline.
 */
export class DebugService {

  /**
   * Validates and opens a webpage using Playwright, returning the rendered screenshot and page stats.
   *
   * @param {object} params
   * @param {string} params.url - Target URL to open
   * @param {boolean} [params.fullPage=false]
   * @returns {Promise<object>}
   */
  static async openUrl({ url, fullPage = false }) {
    const validatedUrl = validatePublicUrl(url);
    const result = await PlaywrightService.openAndCapturePage(validatedUrl, { fullPage });
    return result;
  }

  /**
   * Evaluates user-provided screenshot and query using multimodal Gemma/Gemini.
   *
   * @param {object} params
   * @param {string} params.screenshot - Base64 image
   * @param {string} params.query - What is broken / what to do
   * @param {string} [params.url] - Target URL (optional)
   * @returns {Promise<object>}
   */
  static async diagnoseVisual({ screenshot, query, url }) {
    let cleanUrl = url;
    if (url) {
      try {
        cleanUrl = validatePublicUrl(url);
      } catch {
        // Fall back to original url string if harmless or omit
      }
    }

    return GeminiService.analyzeVisualIssue({
      screenshot,
      query,
      url: cleanUrl,
    });
  }
}

