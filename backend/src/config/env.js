import dotenv from 'dotenv';

dotenv.config();

/**
 * Validated central configuration object.
 * Provides sensible defaults for development.
 */
export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },
  playwright: {
    timeoutMs: parseInt(process.env.BROWSER_TIMEOUT_MS || '20000', 10),
    desktopViewport: { width: 1280, height: 800 },
    mobileViewport: { width: 390, height: 844 }, // iPhone 12/13/14 standard mobile viewport
    mobileUserAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  },
};

/**
 * Validates critical environment variables at startup.
 */
export function validateEnv() {
  if (!config.gemini.apiKey) {
    console.warn(
      '[WARNING] GEMINI_API_KEY is not set in environment or .env file. AI diagnosis features will fail until an API key is provided.'
    );
  }
}
