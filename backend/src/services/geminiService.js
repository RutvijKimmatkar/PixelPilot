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
   * Performs multimodal visual debugging on user-provided screenshot and query.
   * Sends both image and text to Gemma/Gemini model.
   *
   * @param {object} params
   * @param {string} params.screenshot - Base64 image data URI or raw base64 string
   * @param {string} params.query - User description / query of what is broken
   * @param {string} [params.url] - Optional website URL
   * @returns {Promise<object>}
   */
  static async analyzeVisualIssue({ screenshot, query, url }) {
    if (!config.gemini.apiKey) {
      return {
        diagnosis: `Visual inspection for query: "${query}". (Demo mode: set GEMINI_API_KEY in .env for live AI diagnosis)`,
        visualObservations: [
          'Screenshot successfully received and captured by client.',
          'Identified user focus area based on query description.',
        ],
        rootCause: 'Likely viewport overflow, missing responsive CSS constraints, or unconstrained width/margin.',
        suggestedFix: 'Review CSS container widths, apply max-width: 100%, and verify media queries at mobile and desktop breakpoints.',
        codeSnippet: `/* Recommended CSS hardening */\n.container {\n  max-width: 100%;\n  overflow-x: hidden;\n  box-sizing: border-box;\n}`,
        antigravityPrompt: `Inspect the visual layout for ${url || 'the website'}. Fix the following issue: "${query}". Check responsive rules and ensure no horizontal overflow occurs.`,
      };
    }

    try {
      const model = this.getModel();

      // Extract base64 and mimeType
      let mimeType = 'image/png';
      let cleanBase64 = screenshot;

      if (screenshot.startsWith('data:')) {
        const matches = screenshot.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/s);
        if (matches) {
          mimeType = matches[1];
          cleanBase64 = matches[2];
        } else {
          cleanBase64 = screenshot.replace(/^data:[^;]+;base64,/, '');
        }
      }

      const prompt = `You are an expert Frontend & Visual Layout Debugger (Visual Debugging Assistant).
A user has loaded a website and captured the attached screenshot showing a visual layout or styling problem.

USER ISSUE & QUERY:
"${query}"
${url ? `TARGET URL: ${url}` : ''}

TASK:
1. Examine the visual elements in the attached screenshot carefully (focusing on alignment, spacing, sizing, overlaps, clipping, and responsive behavior).
2. Answer the user's query and diagnose the visual defect visible in the image.
3. Provide the root technical cause (e.g. CSS properties, layout models, flex/grid configuration).
4. Provide concrete, actionable fixes with code.
5. Create a complete, detailed prompt for the Antigravity AI coding assistant.

Respond ONLY with valid JSON with this exact schema:
{
  "diagnosis": "Concise 1-2 sentence description answering what is visually broken or happening",
  "visualObservations": [
    "Observation 1 (concrete visual detail seen in screenshot)",
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
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();

      try {
        return JSON.parse(cleaned);
      } catch {
        return {
          diagnosis: text.slice(0, 300),
          visualObservations: ['Visual anomaly analyzed by AI from screenshot.'],
          rootCause: 'CSS layout or responsive styling mismatch.',
          suggestedFix: text,
          codeSnippet: '',
          antigravityPrompt: `Fix the visual issue described: ${query}`,
        };
      }
    } catch (err) {
      console.error('[GeminiService] Error in analyzeVisualIssue:', err);
      throw AppError.internal(
        `AI visual analysis failed: ${err.message || 'Unknown error from Generative AI service'}`,
        'AI_ANALYSIS_FAILED'
      );
    }
  }
}

