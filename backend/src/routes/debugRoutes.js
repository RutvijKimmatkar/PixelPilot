import { Router } from 'express';
import { DebugController } from '../controllers/debugController.js';
import { validateRequestBody } from '../middleware/validateRequest.js';
import {
  openUrlRequestSchema,
  diagnoseVisualRequestSchema,
} from '../schemas/analyzeSchema.js';

export const debugRouter = Router();

// Health check endpoint
debugRouter.get('/health', DebugController.healthCheck);

// Open target website via Playwright and return rendered screenshot
debugRouter.post('/open-url', validateRequestBody(openUrlRequestSchema), DebugController.openUrl);

// Multimodal visual analysis for user-captured screenshot and query
debugRouter.post(
  '/diagnose-visual',
  validateRequestBody(diagnoseVisualRequestSchema),
  DebugController.diagnoseVisual
);


