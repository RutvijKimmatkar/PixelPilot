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
}
