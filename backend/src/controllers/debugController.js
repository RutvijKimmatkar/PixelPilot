import { DebugService } from '../services/debugService.js';
import { AppError } from '../errors/appError.js';

export class DebugController {
  /**
   * Standard JSON endpoint for website analysis: POST /api/analyze
   */
  static async analyze(req, res, next) {
    try {
      const { url, issueDescription, description, mode } = req.body;
      const desc = issueDescription || description;

      const report = await DebugService.analyzeWebsite({
        url,
        issueDescription: desc,
        mode: mode || 'public',
      });

      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Server-Sent Events (SSE) streaming endpoint for live progress updates:
   * GET /api/analyze/stream?url=...&issueDescription=...
   */
  static async analyzeStream(req, res, next) {
    try {
      const url = req.query.url;
      const issueDescription = req.query.issueDescription;

      if (!url || !issueDescription) {
        throw AppError.badRequest('Both "url" and "issueDescription" query parameters are required for streaming analysis.');
      }

      // Set headers for Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const sendEvent = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      try {
        const report = await DebugService.analyzeWebsite({
          url,
          issueDescription,
          onProgress: (progress) => {
            sendEvent('progress', progress);
          },
        });

        sendEvent('complete', { success: true, data: report });
        res.end();
      } catch (err) {
        sendEvent('error', {
          code: err.errorCode || 'ANALYSIS_ERROR',
          message: err.message || 'Analysis failed',
        });
        res.end();
      }
    } catch (err) {
      next(err);
    }
  }

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

  /**
   * Detect running local dev servers on common developer ports
   * GET /api/local/detect
   */
  static async detectLocalServers(_req, res) {
    const net = await import('net');
    const portsToProbe = [5173, 5174, 3000, 3001, 4200, 8000, 8080];
    const results = [];

    await Promise.all(
      portsToProbe.map((port) => {
        return new Promise((resolve) => {
          const socket = new net.Socket();
          socket.setTimeout(250);
          socket.on('connect', () => {
            results.push({
              port,
              url: `http://localhost:${port}`,
              title: port === 5173 ? 'Vite Frontend (Active)' : `Local Server :${port}`,
            });
            socket.destroy();
            resolve();
          });
          socket.on('error', () => resolve());
          socket.on('timeout', () => {
            socket.destroy();
            resolve();
          });
          socket.connect(port, '127.0.0.1');
        });
      })
    );

    results.sort((a, b) => a.port - b.port);
    return res.status(200).json({ success: true, servers: results });
  }

  /**
   * Proxies webpage HTML and strips X-Frame-Options & CSP so it can render safely in interactive canvas
   * GET /api/proxy?url=...
   */
  static async proxy(req, res) {
    try {
      const targetUrl = req.query.url;
      if (!targetUrl) {
        return res.status(400).send('Missing url query parameter');
      }

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      const contentType = response.headers.get('content-type') || 'text/html';
      let html = await response.text();

      // Ensure base URL is set so assets, stylesheets and images resolve correctly
      const baseTag = `<base href="${targetUrl}">`;
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}`);
      } else if (html.includes('<html')) {
        html = html.replace(/<html[^>]*>/, `$&<head>${baseTag}</head>`);
      } else {
        html = `${baseTag}${html}`;
      }

      res.setHeader('Content-Type', contentType);
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      return res.status(200).send(html);
    } catch (err) {
      return res.status(502).send(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;background:#FAF6EE;color:#181716;"><h3>Live Preview Error</h3><p>Could not load URL directly: ${err.message}</p></body></html>`);
    }
  }
}

