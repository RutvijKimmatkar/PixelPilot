import { AppError } from '../errors/appError.js';
import { config } from '../config/env.js';

/**
 * Centralized Express error-handling middleware.
 * Formats standard error responses and prevents leaking internal stack traces.
 */
export function errorHandler(err, _req, res, _next) {
  // Check if it's our known operational AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details || undefined,
      },
    });
  }

  // Handle Playwright browser timeout or navigation errors
  if (err?.name === 'TimeoutError' || err?.message?.includes('Timeout')) {
    return res.status(504).json({
      error: {
        code: 'BROWSER_TIMEOUT',
        message: 'The website took too long to load or respond during browser analysis. Please verify the URL is online.',
      },
    });
  }

  if (err?.message?.includes('net::ERR_NAME_NOT_RESOLVED') || err?.message?.includes('net::ERR_CONNECTION_REFUSED')) {
    return res.status(400).json({
      error: {
        code: 'WEBSITE_UNREACHABLE',
        message: 'Could not resolve or connect to the target website. Please verify that the URL is correct and currently accessible.',
      },
    });
  }


  // Unhandled / Unexpected server error
  console.error('[UNHANDLED_EXCEPTION]', err);

  const isDev = config.nodeEnv === 'development';
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDev ? err.message : 'An unexpected error occurred during visual analysis.',
      stack: isDev ? err.stack : undefined,
    },
  });
}
