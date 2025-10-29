import type { Context, Next } from 'hono';

/**
 * Rate Limit Store Interface
 * 
 * In-memory store for rate limiting
 * For production, consider using Redis
 */
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

/**
 * In-memory rate limit store
 * ⚠️ This is shared across all requests in the same process
 * For multi-process/production, use Redis
 */
const rateLimitStore: RateLimitStore = {};

/**
 * Clean up expired entries periodically
 */
function cleanupStore() {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupStore, 5 * 60 * 1000);
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(c: Context): string {
  // Try to get user ID from authenticated context (if available)
  const userId = (c as any).user?.userId;
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address
  const ip = c.req.header('x-forwarded-for') || 
             c.req.header('x-real-ip') || 
             c.req.header('cf-connecting-ip') ||
             'unknown';
  
  return `ip:${ip.split(',')[0].trim()}`;
}

/**
 * Rate Limit Configuration
 */
export interface RateLimitOptions {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Maximum requests per window
  message?: string;        // Error message
  skipIf?: (c: Context) => boolean; // Skip rate limiting condition
}

/**
 * Generic Rate Limiting Middleware
 * 
 * @param options - Rate limit configuration
 * @returns Hono middleware function
 * 
 * @example
 * ```ts
 * import { rateLimit } from '@/middleware/rate-limit';
 * 
 * // Limit to 10 requests per 15 minutes
 * app.post('/api/login', rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10 }), ...);
 * ```
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = `Rate limit exceeded. Try again in ${Math.ceil(windowMs / 1000)} seconds.`,
    skipIf,
  } = options;

  return async (c: Context, next: Next) => {
    // Skip if condition is met
    if (skipIf && skipIf(c)) {
      return next();
    }

    const identifier = getClientIdentifier(c);
    const now = Date.now();
    const key = `rate-limit:${identifier}`;

    // Get or create rate limit entry
    let entry = rateLimitStore[key];

    // Check if entry exists and is still valid
    if (entry && entry.resetTime > now) {
      // Entry is still valid, check count
      if (entry.count >= maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        
        // Return error response with headers
        return c.json({
          success: false,
          error: {
            message,
            code: 'RateLimitError',
          },
        }, 429, {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
          'Retry-After': retryAfter.toString(),
        });
      }

      // Increment count
      entry.count += 1;
    } else {
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore[key] = entry;
    }

    // Continue to next middleware first
    await next();

    // Set rate limit headers after processing
    const remaining = Math.max(0, maxRequests - entry.count);
    c.res.headers.set('X-RateLimit-Limit', maxRequests.toString());
    c.res.headers.set('X-RateLimit-Remaining', remaining.toString());
    c.res.headers.set('X-RateLimit-Reset', entry.resetTime.toString());
  };
}

/**
 * Login Rate Limiting Middleware
 * 
 * Stricter rate limiting for login attempts
 * Limits: 5 requests per 15 minutes
 * 
 * @example
 * ```ts
 * import { loginRateLimit } from '@/middleware/rate-limit';
 * 
 * app.post('/api/auth/login', loginRateLimit, loginHandler);
 * ```
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

/**
 * API Rate Limiting Middleware
 * 
 * General API rate limiting
 * Limits: 100 requests per 15 minutes
 * 
 * @example
 * ```ts
 * import { apiRateLimit } from '@/middleware/rate-limit';
 * 
 * app.use('/api/*', apiRateLimit);
 * ```
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many API requests. Please slow down.',
});

/**
 * Strict Rate Limiting Middleware
 * 
 * Very strict rate limiting for sensitive operations
 * Limits: 3 requests per 5 minutes
 * 
 * @example
 * ```ts
 * import { strictRateLimit } from '@/middleware/rate-limit';
 * 
 * app.post('/api/auth/password-reset', strictRateLimit, ...);
 * ```
 */
export const strictRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 3,
  message: 'Too many requests. Please wait 5 minutes before trying again.',
});

/**
 * User-Specific Rate Limiting
 * 
 * Rate limiting based on authenticated user
 * Automatically uses user ID if available
 * 
 * @example
 * ```ts
 * import { userRateLimit } from '@/middleware/rate-limit';
 * 
 * app.post('/api/user/update', auth, userRateLimit, ...);
 * ```
 */
export const userRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Too many requests. Please wait a moment.',
  skipIf: (c) => !(c as any).user?.userId, // Skip if user not authenticated
});

/**
 * Email/SMS Rate Limiting
 * 
 * For email verification, password reset, etc.
 * Limits: 3 requests per hour
 * 
 * @example
 * ```ts
 * import { emailRateLimit } from '@/middleware/rate-limit';
 * 
 * app.post('/api/auth/resend-verification', emailRateLimit, ...);
 * ```
 */
export const emailRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  message: 'Too many emails sent. Please wait 1 hour before requesting another.',
});

/**
 * Get Rate Limit Status
 * 
 * Check current rate limit status for a client
 * Useful for displaying remaining requests to users
 * 
 * @param c - Hono context
 * @returns Rate limit status object
 */
export function getRateLimitStatus(c: Context): {
  limit: number;
  remaining: number;
  reset: Date;
} | null {
  const identifier = getClientIdentifier(c);
  const key = `rate-limit:${identifier}`;
  const entry = rateLimitStore[key];

  if (!entry) {
    return null;
  }

  return {
    limit: 100, // Default limit, adjust based on your needs
    remaining: Math.max(0, 100 - entry.count),
    reset: new Date(entry.resetTime),
  };
}

