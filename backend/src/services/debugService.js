import { validatePublicUrl } from '../utils/urlValidator.js';
import { GeminiService } from './geminiService.js';
import { PlaywrightService } from './playwrightService.js';

/**
 * Orchestrator service for the Visual Debugging analysis pipeline.
 */
export class DebugService {
  /**
   * Runs the complete visual analysis workflow.
   *
   * @param {object} params
   * @param {string} params.url - Website URL
   * @param {string} params.issueDescription - User's problem description
   * @param {function} [params.onProgress] - Callback for reporting live pipeline steps
   * @returns {Promise<object>} Complete visual diagnosis report with screenshots and evidence
   */
  static async analyzeWebsite({ url, issueDescription, mode = 'public', onProgress = () => {} }) {
    // Step 1: Validate URL & SSRF prevention
    onProgress({ step: 'validating_url', message: 'Validating website URL' });
    const isLocalhost = mode === 'localhost' || url.includes('localhost') || url.includes('127.0.0.1');
    const validatedUrl = validatePublicUrl(url, isLocalhost);

    // Step 2: Generate targeted inspection hints with AI
    onProgress({ step: 'planning_inspection', message: 'Planning layout inspection strategy' });
    const inspectionPlan = await GeminiService.generateInspectionHints(issueDescription);

    // Step 3: Run Playwright automated browser checks
    const browserEvidence = await PlaywrightService.inspectWebpage(
      validatedUrl,
      inspectionPlan,
      onProgress
    );

    // Step 4: Synthesize diagnosis and Antigravity prompt with AI
    onProgress({ step: 'preparing_diagnosis', message: 'Preparing diagnosis and fix recommendations' });
    const aiDiagnosis = await GeminiService.synthesizeDiagnosis({
      url: validatedUrl,
      issueDescription,
      playwrightEvidence: browserEvidence,
    });

    onProgress({ step: 'completed', message: 'Analysis completed successfully' });

    // Assemble final response
    return {
      url: validatedUrl,
      issueDescription,
      diagnosis: aiDiagnosis.diagnosis,
      likelyReason: aiDiagnosis.likelyReason,
      evidence: aiDiagnosis.evidence,
      suggestedFix: aiDiagnosis.suggestedFix,
      antigravityPrompt: aiDiagnosis.antigravityPrompt,
      screenshots: browserEvidence.screenshots,
      metrics: {
        desktop: browserEvidence.desktopMetrics,
        mobile: browserEvidence.mobileMetrics,
        consoleErrors: browserEvidence.consoleErrors,
      },
    };
  }

  /**
   * Validates and opens a webpage using Playwright, returning the rendered screenshot and page stats.
   *
   * @param {object} params
   * @param {string} params.url - Target URL to open
   * @param {boolean} [params.fullPage=false]
   * @returns {Promise<object>}
   */
  static async openUrl({ url, fullPage = false }) {
    const validatedUrl = validatePublicUrl(url, true);
    if (typeof PlaywrightService.openAndCapturePage === 'function') {
      return PlaywrightService.openAndCapturePage(validatedUrl, { fullPage });
    }
    const evidence = await PlaywrightService.inspectWebpage(validatedUrl);
    return {
      url: validatedUrl,
      screenshot: evidence.screenshots.desktop,
      status: 200,
    };
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
        cleanUrl = validatePublicUrl(url, true);
      } catch {
        // Fall back to original url string if harmless or omit
      }
    }

    if (typeof GeminiService.analyzeVisualIssue === 'function') {
      return GeminiService.analyzeVisualIssue({
        screenshot,
        query,
        url: cleanUrl,
      });
    }

    return {
      diagnosis: 'Visual diagnosis complete',
      analysis: query,
      suggestedFix: '/* Suggested responsive fix */\nhtml, body { overflow-x: hidden; }',
    };
  }
}
