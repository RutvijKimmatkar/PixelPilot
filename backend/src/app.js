import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './errors/appError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, '..', 'public');

export const app = express();

// Security & cross-origin middleware
app.use(
  cors({
    origin: config.allowedOrigin === '*' ? '*' : config.allowedOrigin,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing with safe size limit for base64 screenshots
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: false, limit: '25mb' }));

// Serve built-in Web UI
app.use(express.static(publicPath));

// Request logger
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// Mount API routes
app.use('/api', apiRouter);

// 404 Handler for undefined API routes
app.use('/api', (_req, _res, next) => {
  next(AppError.notFound('The requested endpoint does not exist.'));
});

// Fallback for non-API routes to index.html
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(publicPath, 'index.html'));
  }
  next(AppError.notFound('Resource not found.'));
});

// Centralized error handling
app.use(errorHandler);

