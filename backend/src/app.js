import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './errors/appError.js';

export const app = express();

// Security & cross-origin middleware
app.use(
  cors({
    origin: config.allowedOrigin === '*' ? '*' : config.allowedOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing with safe size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// Mount API routes
app.use('/api', apiRouter);

// 404 Handler for undefined routes
app.use((_req, _res, next) => {
  next(AppError.notFound('The requested endpoint does not exist.'));
});

// Centralized error handling
app.use(errorHandler);
