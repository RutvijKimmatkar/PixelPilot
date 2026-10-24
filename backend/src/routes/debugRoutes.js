import { Router } from 'express';
import { DebugController } from '../controllers/debugController.js';
import { validateRequestBody } from '../middleware/validateRequest.js';
import { analyzeRequestSchema } from '../schemas/analyzeSchema.js';

export const debugRouter = Router();

// Health check endpoint
debugRouter.get('/health', DebugController.healthCheck);

// Standard JSON analysis endpoint
debugRouter.post('/analyze', validateRequestBody(analyzeRequestSchema), DebugController.analyze);

// Live progress streaming endpoint (SSE)
debugRouter.get('/analyze/stream', DebugController.analyzeStream);
