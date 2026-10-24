import { DebugService } from '../services/debugService.js';

export class DebugController {

  /**
   * Health check endpoint: GET /api/health
   */
  static healthCheck(_req, res) {
    return res.status(200).json({
      status: 'ok',
      service: 'visual-debugging-assistant-backend',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Opens webpage via Playwright and returns screenshot: POST /api/open-url
   */
  static async openUrl(req, res, next) {
    try {
      const { url, fullPage } = req.body;
      const data = await DebugService.openUrl({ url, fullPage });
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Evaluates user cropped screenshot and query via Gemma: POST /api/diagnose-visual
   */
  static async diagnoseVisual(req, res, next) {
    try {
      const { screenshot, query, url } = req.body;
      const data = await DebugService.diagnoseVisual({ screenshot, query, url });
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

