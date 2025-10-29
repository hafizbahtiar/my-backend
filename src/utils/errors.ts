/**
 * Custom Error Classes
 * 
 * Used for standardized error handling across the application
 */

/**
 * Base application error
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication errors (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization errors (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends AppError {
  public fields?: Record<string, string[]>;

  constructor(message: string, fields?: Record<string, string[]>) {
    super(message, 400);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

/**
 * Not found errors (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict errors (409)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit errors (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: Error | string) {
  const message = typeof error === 'string' ? error : error.message;
  const name = typeof error === 'string' ? 'Error' : error.name;

  if (typeof error !== 'string' && error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.name,
        ...(error instanceof ValidationError && error.fields ? { fields: error.fields } : {}),
      },
    };
  }

  // Unknown error or string error
  return {
    success: false,
    error: {
      message,
      code: name,
    },
  };
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    message,
    data,
  };
}

