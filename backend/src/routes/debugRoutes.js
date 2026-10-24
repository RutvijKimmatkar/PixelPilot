import { Router } from 'express';
import { DebugController } from '../controllers/debugController.js';
import { validateRequestBody } from '../middleware/validateRequest.js';
import {
  analyzeRequestSchema,
  openUrlRequestSchema,
  diagnoseVisualRequestSchema,
} from '../schemas/analyzeSchema.js';

export const debugRouter = Router();

// Health check endpoint
debugRouter.get('/health', DebugController.healthCheck);

// Standard JSON analysis endpoint (supports both /analyze and /analyses)
debugRouter.post('/analyze', validateRequestBody(analyzeRequestSchema), DebugController.analyze);
debugRouter.post('/analyses', validateRequestBody(analyzeRequestSchema), DebugController.analyze);

// Live progress streaming endpoint (SSE)
debugRouter.get('/analyze/stream', DebugController.analyzeStream);
debugRouter.get('/analyses/stream', DebugController.analyzeStream);

// Detect running local dev servers
debugRouter.get('/local/detect', DebugController.detectLocalServers);

// Open target website via Playwright and return rendered screenshot
debugRouter.post('/open-url', validateRequestBody(openUrlRequestSchema), DebugController.openUrl);

// Multimodal visual analysis for user-captured screenshot and query
debugRouter.post(
  '/diagnose-visual',
  validateRequestBody(diagnoseVisualRequestSchema),
  DebugController.diagnoseVisual
);
