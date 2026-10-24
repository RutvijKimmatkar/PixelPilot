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
  static getModel(modelName) {
    if (!config.gemini.apiKey) {
      throw AppError.internal(
        'GEMINI_API_KEY is not configured on the server. Please set it in your backend .env file.',
        'MISSING_GEMINI_KEY'
      );
    }
    const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    return genAI.getGenerativeModel({ model: modelName || config.gemini.model });
  }

  /**
   * Generates content with automatic fallback to stable models using direct REST API
   */
  static async generateWithFallback(prompt) {
    if (!config.gemini.apiKey) {
      throw AppError.internal('GEMINI_API_KEY is not configured on the server.', 'MISSING_GEMINI_KEY');
    }

    const candidates = Array.from(new Set([
      config.gemini.model,
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
    ].filter(Boolean)));

    for (const modelName of candidates) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.gemini.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
            },
          }),
          signal: AbortSignal.timeout(10000),
        });

        const data = await res.json();
        if (res.ok && data.candidates?.[0]?.content?.parts) {
          const text = data.candidates[0].content.parts.map((p) => p.text || '').join('');
          return text;
        } else {
          console.warn(`[GeminiService] Model "${modelName}" error (${data.error?.message?.slice(0, 80) || res.statusText}). Trying next...`);
        }
      } catch (err) {
        console.warn(`[GeminiService] Model "${modelName}" request failed (${err.message.slice(0, 80)}). Trying next...`);
      }
    }
    throw new Error('All AI model attempts timed out or failed');
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

      const text = await this.generateWithFallback(prompt);
      const parsed = this.extractJson(text);
      if (parsed?.suggestedSelectors) {
        return parsed;
      }
      throw new Error('Invalid JSON structure');
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

    try {
      const text = await this.generateWithFallback(prompt);
      const parsed = this.extractJson(text);
      if (parsed && parsed.diagnosis) {
        return parsed;
      }
    } catch (err) {
      console.warn('[GeminiService] AI synthesis error, producing layout report from Playwright metrics:', err.message);
    }

    // Direct synthesis from Playwright evidence
    const hasOverflow = playwrightEvidence.mobileMetrics?.hasHorizontalOverflow;
    const scrollW = playwrightEvidence.mobileMetrics?.scrollWidth || 390;
    const viewW = playwrightEvidence.mobileMetrics?.viewportWidth || 390;
    const errCount = playwrightEvidence.consoleErrors?.length || 0;

    return {
      diagnosis: hasOverflow
        ? `Mobile layout overflow detected: content expands to ${scrollW}px on a ${viewW}px viewport.`
        : 'Layout fits mobile and desktop viewports with no severe horizontal overflows detected.',
      likelyReason: hasOverflow
        ? 'Elements inside container lack responsive width constraints or flex-wrap, causing horizontal document stretch.'
        : 'Page elements adapt appropriately to mobile dimensions without breaking viewport boundaries.',
      evidence: [
        `Desktop (1280px): scrollWidth is ${playwrightEvidence.desktopMetrics?.scrollWidth || 1280}px`,
        `Mobile (390px): scrollWidth is ${scrollW}px (${hasOverflow ? `+${scrollW - viewW}px overflow` : 'fits screen'})`,
        `Console errors observed: ${errCount}`,
      ],
      suggestedFix: hasOverflow
        ? `/* Responsive Overflow Fix */\nhtml, body {\n  overflow-x: hidden;\n  max-width: 100vw;\n}\n\n.container, section, div {\n  max-width: 100%;\n  box-sizing: border-box;\n}`
        : `/* No critical overflow detected */\n* {\n  box-sizing: border-box;\n}`,
      antigravityPrompt: `Task: Optimize responsive layout for ${url}\nIssue: ${issueDescription}\nMeasurements:\n- Desktop: ${playwrightEvidence.desktopMetrics?.scrollWidth || 1280}px\n- Mobile: ${scrollW}px on ${viewW}px viewport\n- Overflow: ${hasOverflow ? 'YES' : 'NO'}\n\nAction items:\n1. Ensure responsive container boundaries (max-width: 100%).\n2. Add flex-wrap: wrap to flex rows on viewports under 768px.\n3. Verify fixes at 390px, 768px, and 1280px.`,
    };
  }

  /**
   * Helper to extract clean JSON object from AI output
   */
  static extractJson(text) {
    if (!text) return null;
    try {
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }
}
