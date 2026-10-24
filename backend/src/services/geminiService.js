import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { AppError } from '../errors/appError.js';

/**
 * Service managing interactions with Google Generative AI (Gemini / Gemma).
 */
export class GeminiService {
  /**
   * Lazily initializes and returns the Generative AI model instance.
   * @private
   */
  static getModel() {
    if (!config.gemini.apiKey) {
      throw AppError.internal(
        'GEMINI_API_KEY is not configured on the server. Please set it in your backend .env file.',
        'MISSING_GEMINI_KEY'
      );
    }
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    return genAI.getGenerativeModel({ model: config.gemini.model });
  }

  /**
   * Generates targeted inspection hints from the user's issue description.
   * Helps Playwright focus its DOM/CSS inspection on the relevant elements.
   *
   * @param {string} issueDescription
   * @returns {Promise<{ suggestedSelectors: string[], suspectedProperties: string[] }>}
   */
  static async generateInspectionHints(issueDescription) {
    if (!config.gemini.apiKey) {
      // Graceful fallback to default keywords if API key is not yet provided
      return {
        suggestedSelectors: ['card', 'pricing', 'grid', 'flex', 'container', 'nav', 'header', 'button'],
        suspectedProperties: ['width', 'min-width', 'grid-template-columns', 'flex-wrap', 'overflow'],
      };
    }

    try {
      const model = this.getModel();
      const prompt = `You are a frontend CSS debugging planner.
A developer reported this visual layout issue on their website:
"${issueDescription}"

Extract:
1. Up to 8 likely HTML class/tag/id keywords to inspect (e.g. "card", "pricing", "grid", "hero", "nav", "menu", "modal").
2. Up to 5 suspected CSS properties that might cause this (e.g. "min-width", "grid-template-columns", "flex-wrap", "overflow-x", "position").

Respond ONLY in valid JSON with this exact format:
{
  "suggestedSelectors": ["string"],
  "suspectedProperties": ["string"]
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.warn('[GeminiService] Failed to generate targeted inspection hints, using defaults:', err.message);
      return {
        suggestedSelectors: ['card', 'pricing', 'grid', 'flex', 'container', 'nav', 'header', 'button'],
        suspectedProperties: ['width', 'min-width', 'grid-template-columns', 'flex-wrap', 'overflow'],
      };
    }
  }

  /**
   * Synthesizes Playwright browser evidence and user description into a final debugging report.
   *
   * @param {object} params
   * @param {string} params.url - Website URL
   * @param {string} params.issueDescription - User's stated problem
   * @param {object} params.playwrightEvidence - Collected metrics, overflows, styles, and console errors
   * @returns {Promise<object>} Structured diagnosis and Antigravity prompt
   */
  static async synthesizeDiagnosis({ url, issueDescription, playwrightEvidence }) {
    const model = this.getModel();

    const prompt = `You are an expert Frontend & Visual Layout Debugger (Visual Debugging Assistant).
Your job is to analyze real browser measurements from a website and explain the visual layout issue clearly.

WEBSITE URL: ${url}
USER REPORTED ISSUE:
"${issueDescription}"

PLAYWRIGHT BROWSER EVIDENCE COLLECTED:
1. Desktop Viewport (1280px wide):
   - Horizontal Overflow: ${playwrightEvidence.desktopMetrics?.hasHorizontalOverflow ? 'YES (overflow detected)' : 'NO (fits screen)'}
   - Page scrollWidth: ${playwrightEvidence.desktopMetrics?.scrollWidth}px

2. Mobile Viewport (390px wide - iPhone standard):
   - Horizontal Overflow: ${playwrightEvidence.mobileMetrics?.hasHorizontalOverflow ? 'YES (unwanted horizontal scroll detected)' : 'NO'}
   - Page scrollWidth: ${playwrightEvidence.mobileMetrics?.scrollWidth}px (Screen is ${playwrightEvidence.mobileMetrics?.viewportWidth}px wide)
   - Detected Sibling Overlaps: ${JSON.stringify(playwrightEvidence.mobileMetrics?.overlaps || [])}
   - Overflowing Elements:
${JSON.stringify(playwrightEvidence.mobileMetrics?.overflowingElements || [], null, 2)}
   - Suspicious Component Styles:
${JSON.stringify(playwrightEvidence.mobileMetrics?.suspiciousElements || [], null, 2)}
   - Browser Console Errors:
${JSON.stringify(playwrightEvidence.consoleErrors || [], null, 2)}

TASK:
Generate a clear, high-quality visual debugging report in JSON format.
You must provide:
1. "diagnosis": A concise 1-2 sentence explanation answering "What is wrong?" in plain, user-friendly language.
2. "likelyReason": The root technical cause explained simply (e.g. why the CSS or layout behaves this way on mobile).
3. "evidence": A list of 3-5 concrete technical facts and measurements discovered from the webpage (e.g. "The pricing grid width is 982px on a 390px screen", "repeat(3, minmax(280px, 1fr)) is active without a mobile media query", etc.).
4. "suggestedFix": Actionable, specific CSS recommendations to fix the bug (e.g. responsive breakpoints, flex-wrap, 1fr column rules).
5. "antigravityPrompt": A complete, ready-to-paste prompt for the Antigravity AI coding assistant. The prompt should detail:
   - The user's original issue
   - Target website URL
   - Observed layout metrics and CSS evidence
   - Exact files/CSS properties to inspect and fix
   - Recommended responsive breakpoints and shrinkage rules
   - Verification instructions (testing at 390px, 768px, and 1280px)

Respond ONLY with valid JSON with this exact schema:
{
  "diagnosis": "string",
  "likelyReason": "string",
  "evidence": ["string"],
  "suggestedFix": "string",
  "antigravityPrompt": "string"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      throw AppError.internal('Failed to parse AI diagnosis response as JSON. Please try again.', 'AI_PARSE_ERROR');
    }
  }
}
