import type { Context, Next } from 'hono';

/**
 * Security Headers Middleware
 * 
 * Adds security headers to all responses
 * 
 * @example
 * ```ts
 * import { securityHeaders } from '@/middleware/security';
 * 
 * app.use('*', securityHeaders);
 * ```
 */
export function securityHeaders(c: Context, next: Next) {
  // Security headers
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('X-XSS-Protection', '1; mode=block');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove X-Powered-By header
  c.res.headers.delete('X-Powered-By');
  
  return next();
}

/**
 * CORS Middleware
 * 
 * Simple CORS implementation for Hono
 * Configures Cross-Origin Resource Sharing
 * 
 * @example
 * ```ts
 * import { corsMiddleware } from '@/middleware/security';
 * 
 * app.use('*', corsMiddleware);
 * ```
 */
export function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header('origin');
  
  // Get allowed origins from environment
  const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',');
  
  // Allow requests with no origin (mobile apps, curl, Postman, etc.)
  if (!origin) {
    c.res.headers.set('Access-Control-Allow-Origin', '*');
  } else if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
    // Allow if origin is in whitelist or all origins allowed
    c.res.headers.set('Access-Control-Allow-Origin', origin);
    c.res.headers.set('Vary', 'Origin');
  }
  
  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-API-Key');
    c.res.headers.set('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
    c.res.headers.set('Access-Control-Allow-Credentials', 'true');
    c.res.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    return c.body(null, 204);
  }
  
  // Allow credentials
  c.res.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return next();
}

/**
 * Request Logging Middleware
 * 
 * Logs incoming requests for debugging and monitoring
 * 
 * @example
 * ```ts
 * import { requestLogger } from '@/middleware/security';
 * 
 * app.use('*', requestLogger);
 * ```
 */
export function requestLogger(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const ip = c.req.header('x-forwarded-for') || 
             c.req.header('x-real-ip') || 
             'unknown';

  // Log request start
  if (process.env.NODE_ENV === 'development') {
    console.log(`→ ${method} ${path} [${ip}]`);
  }

  return next().then(() => {
    const duration = Date.now() - start;
    const status = c.res.status;

    // Log response
    if (process.env.NODE_ENV === 'development') {
      const statusColor = status >= 500 ? '🔴' : status >= 400 ? '🟡' : '🟢';
      console.log(`${statusColor} ${method} ${path} [${status}] ${duration}ms`);
    }
  });
}

/**
 * Request Size Limiting
 * 
 * Limits request body size to prevent abuse
 * 
 * @param maxSize - Maximum size in bytes (default: 1MB)
 * 
 * @example
 * ```ts
 * import { requestSizeLimit } from '@/middleware/security';
 * 
 * app.use('*', requestSizeLimit(1024 * 1024)); // 1MB
 * ```
 */
export function requestSizeLimit(maxSize: number = 1024 * 1024) {
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header('content-length');
    
    if (contentLength && parseInt(contentLength, 10) > maxSize) {
      return c.json({
        success: false,
        error: {
          message: `Request body too large. Maximum size is ${Math.round(maxSize / 1024)}KB.`,
          code: 'PayloadTooLargeError',
        },
      }, 413);
    }

    return next();
  };
}

/**
 * IP Whitelist Middleware
 * 
 * Allows only specified IP addresses
 * 
 * @param allowedIPs - Array of allowed IP addresses or CIDR blocks
 * 
 * @example
 * ```ts
 * import { ipWhitelist } from '@/middleware/security';
 * 
 * app.use('/admin/*', ipWhitelist(['192.168.1.1', '10.0.0.0/8']));
 * ```
 */
export function ipWhitelist(allowedIPs: string[]) {
  return async (c: Context, next: Next) => {
    const clientIP = c.req.header('x-forwarded-for')?.split(',')[0].trim() || 
                     c.req.header('x-real-ip') || 
                     'unknown';

    const isAllowed = allowedIPs.some(ip => {
      // Simple CIDR support
      if (ip.includes('/')) {
        // Simplified CIDR check (for full implementation, use ipaddr.js)
        return clientIP.startsWith(ip.split('/')[0]);
      }
      return clientIP === ip;
    });

    if (!isAllowed) {
      return c.json({
        success: false,
        error: {
          message: 'Access denied. IP not whitelisted.',
          code: 'ForbiddenError',
        },
      }, 403);
    }

    return next();
  };
}

/**
 * API Key Middleware
 * 
 * Validates API key for specific routes
 * 
 * @param validKeys - Array of valid API keys
 * 
 * @example
 * ```ts
 * import { apiKeyAuth } from '@/middleware/security';
 * 
 * app.use('/api/external/*', apiKeyAuth(['key1', 'key2']));
 * ```
 */
export function apiKeyAuth(validKeys: string[]) {
  return async (c: Context, next: Next) => {
    const apiKey = c.req.header('x-api-key');

    if (!apiKey || !validKeys.includes(apiKey)) {
      return c.json({
        success: false,
        error: {
          message: 'Invalid or missing API key.',
          code: 'AuthenticationError',
        },
      }, 401);
    }

    return next();
  };
}

/**
 * Apply All Security Middleware
 * 
 * Applies common security middleware to all routes
 */
export function applySecurityDefaults(c: Context, next: Next) {
  // Apply security headers
  securityHeaders(c, next);
  
  // Continue to next
  return next();
}
