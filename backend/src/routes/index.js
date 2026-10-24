import { Router } from 'express';
import { debugRouter } from './debugRoutes.js';

export const apiRouter = Router();

apiRouter.use('/', debugRouter);
