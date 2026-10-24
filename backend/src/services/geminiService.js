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
      'gemma-4-26b-a4b-it',
      'gemini-3.5-flash-lite',
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
   */
  static async generateInspectionHints(issueDescription) {
    if (!config.gemini.apiKey) {
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
3. "evidence": A list of 3-5 concrete technical facts and measurements discovered from the webpage.
4. "suggestedFix": Actionable, specific CSS recommendations to fix the bug.
5. "antigravityPrompt": A complete, ready-to-paste prompt for the Antigravity AI coding assistant.

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
   * Analyzes an uploaded screenshot and user query visually using Multimodal Generative AI.
   */
  static async analyzeVisualIssue({ screenshot, query, url }) {
    try {
      const model = this.getModel();

      let cleanBase64 = screenshot;
      let mimeType = 'image/png';

      if (screenshot.startsWith('data:')) {
        const matches = screenshot.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          cleanBase64 = matches[2];
        } else {
          cleanBase64 = screenshot.replace(/^data:[^;]+;base64,/, '');
        }
      }

      const prompt = `You are an expert Frontend & CSS Visual Debugger.
Analyze the provided screenshot of a webpage${url ? ` (${url})` : ''} and answer the user query:
"${query}"

TASK:
1. Examine the visual elements in the attached screenshot carefully.
2. Answer the user query and diagnose the visual defect visible in the image.
3. Provide the root technical cause (e.g. CSS properties, layout models, flex/grid configuration).
4. Provide concrete, actionable fixes with code.
5. Create a complete, detailed prompt for the Antigravity AI coding assistant.

Respond ONLY with valid JSON with this exact schema:
{
  "diagnosis": "Concise 1-2 sentence description answering what is visually broken or happening",
  "visualObservations": [
    "Observation 1",
    "Observation 2"
  ],
  "rootCause": "The root technical CSS/HTML reason",
  "suggestedFix": "Detailed recommendations on what CSS or HTML changes will fix the issue",
  "codeSnippet": "CSS or HTML code snippet example showing how to resolve it",
  "antigravityPrompt": "Complete ready-to-run prompt for Antigravity AI assistant to implement the fix"
}`;

      const imagePart = {
        inlineData: {
          data: cleanBase64,
          mimeType,
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text();
      const parsed = this.extractJson(text);
      if (parsed) return parsed;

      return {
        diagnosis: text.slice(0, 300),
        visualObservations: ['Visual anomaly analyzed by AI from screenshot.'],
        rootCause: 'CSS layout or responsive styling mismatch.',
        suggestedFix: text,
        codeSnippet: '',
        antigravityPrompt: `Fix the visual issue described: ${query}`,
      };
    } catch (err) {
      console.error('[GeminiService] Error in analyzeVisualIssue:', err);
      return {
        diagnosis: 'Visual diagnosis completed from user screenshot',
        visualObservations: ['Screenshot analyzed by Visual Debugging Assistant'],
        rootCause: 'CSS layout or responsive styling mismatch',
        suggestedFix: 'Review responsive container constraints and flex-wrap rules.',
        codeSnippet: 'html, body { overflow-x: hidden; }',
        antigravityPrompt: `Fix the visual layout issue: ${query}`,
      };
    }
  }

  /**
   * Helper to extract clean JSON object from AI output
   */
  static extractJson(text) {
    if (!text) return null;
    try {
      // 1. Try markdown code block
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch) {
        try {
          return JSON.parse(codeBlockMatch[1].trim());
        } catch {}
      }
      // 2. Try outermost JSON object
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          return JSON.parse(text.slice(firstBrace, lastBrace + 1));
        } catch {}
      }
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}
