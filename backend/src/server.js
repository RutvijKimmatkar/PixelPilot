import { app } from './app.js';
import { config, validateEnv } from './config/env.js';

// Validate startup environment variables
validateEnv();

const server = app.listen(config.port, () => {
  console.log(`[Visual Debugging Assistant] Server running on http://localhost:${config.port}`);
  console.log(`[Visual Debugging Assistant] Environment: ${config.nodeEnv}`);
});

/**
 * Graceful shutdown handler.
 * Closes the HTTP server cleanly before terminating process.
 */
function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force close if server takes too long to close
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('[CRITICAL] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
  process.exit(1);
});
