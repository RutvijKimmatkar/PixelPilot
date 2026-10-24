import { AppError } from '../errors/appError.js';

/**
 * Higher-order middleware to validate request body using a Zod schema.
 *
 * @param {import('zod').ZodSchema} schema
 */
export function validateRequestBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issues = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      const firstMessage = issues[0]?.message || 'Validation error';
      return next(AppError.unprocessable(firstMessage, 'VALIDATION_FAILED', issues));
    }

    req.body = result.data;
    next();
  };
}
