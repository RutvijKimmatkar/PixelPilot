/**
 * Custom operational error class for standard HTTP error responses.
 */
export class AppError extends Error {
  /**
   * @param {string} message - User-facing error message
   * @param {number} statusCode - HTTP status code (e.g. 400, 403, 404, 500)
   * @param {string} [errorCode] - Machine-readable error code
   * @param {any} [details] - Additional diagnostic details (sanitized)
   */
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errorCode = 'BAD_REQUEST', details = null) {
    return new AppError(message, 400, errorCode, details);
  }

  static unauthorized(message = 'Unauthorized access', errorCode = 'UNAUTHORIZED') {
    return new AppError(message, 401, errorCode);
  }

  static forbidden(message = 'Forbidden action', errorCode = 'FORBIDDEN') {
    return new AppError(message, 403, errorCode);
  }

  static notFound(message = 'Resource not found', errorCode = 'NOT_FOUND') {
    return new AppError(message, 404, errorCode);
  }

  static unprocessable(message, errorCode = 'UNPROCESSABLE_ENTITY', details = null) {
    return new AppError(message, 422, errorCode, details);
  }

  static internal(message = 'An unexpected internal server error occurred', errorCode = 'INTERNAL_ERROR') {
    return new AppError(message, 500, errorCode);
  }
}
