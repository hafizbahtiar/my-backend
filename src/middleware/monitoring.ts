import type { Context, Next } from 'hono';
import { logger } from '../utils/logger';

/**
 * Request Monitoring Middleware
 * 
 * Logs all incoming requests and their responses
 * with timing information
 */
export async function requestMonitoring(c: Context, next: Next) {
  const startTime = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() || 
             c.req.header('x-real-ip') || 
             'unknown';

  // Log incoming request
  logger.info('Incoming Request', {
    method,
    path,
    ip,
    query: c.req.query(),
  });

  try {
    // Execute the request
    await next();

    // Calculate duration
    const duration = Date.now() - startTime;
    const status = c.res.status;

    // Log response
    const isError = status >= 400;
    
    if (isError) {
      logger.warn('Request Completed with Error', {
        method,
        path,
        status,
        duration: `${duration}ms`,
        ip,
      });
    } else {
      logger.info('Request Completed', {
        method,
        path,
        status,
        duration: `${duration}ms`,
        ip,
      });
    }

    // Add performance headers
    c.res.headers.set('X-Response-Time', `${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Request Failed', {
      method,
      path,
      duration: `${duration}ms`,
      ip,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Health Check Endpoint Handler
 * 
 * Returns server health information
 */
export async function healthCheck(c: Context) {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
    },
    environment: process.env.NODE_ENV || 'development',
  };

  logger.debug('Health check requested', healthData);
  
  return c.json({
    success: true,
    data: healthData,
  });
}

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  lastResetTime: Date;
}

const metrics: PerformanceMetrics = {
  requestCount: 0,
  errorCount: 0,
  avgResponseTime: 0,
  lastResetTime: new Date(),
};

const responseTimes: number[] = [];

/**
 * Get current performance metrics
 */
export function getMetrics(): PerformanceMetrics {
  return {
    ...metrics,
    avgResponseTime: responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0,
  };
}

/**
 * Reset metrics
 */
export function resetMetrics(): void {
  metrics.requestCount = 0;
  metrics.errorCount = 0;
  metrics.lastResetTime = new Date();
  responseTimes.length = 0;
}

/**
 * Record request metrics
 */
export function recordRequest(duration: number, isError: boolean = false): void {
  metrics.requestCount++;
  if (isError) {
    metrics.errorCount++;
  }
  
  // Keep only last 100 response times
  responseTimes.push(duration);
  if (responseTimes.length > 100) {
    responseTimes.shift();
  }
}

