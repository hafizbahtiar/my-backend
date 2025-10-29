import { Hono } from 'hono';
import { auth } from '../middleware/auth';
import { apiRateLimit, strictRateLimit } from '../middleware/rate-limit';
import {
  getUserAuditLogs,
  getAuditLogsByAction,
  getAuditLogsByIp,
  getAuditLogsByDateRange,
  getFailedLoginAttempts,
} from '../services/audit.service';
import { createErrorResponse } from '../utils/errors';
import type { AuditActionType } from '../models/AuditLog';

const auditRoutes = new Hono();

/**
 * GET /api/audit/my-logs
 * Get current user's audit logs
 */
auditRoutes.get('/my-logs', auth, apiRateLimit, async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100', 10);
    const logs = await getUserAuditLogs((c as any).user.userId, limit);

    return c.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * GET /api/audit/by-action
 * Get audit logs by action type
 */
auditRoutes.get('/by-action', auth, strictRateLimit, async (c) => {
  try {
    const action = c.req.query('action') as AuditActionType;
    const limit = parseInt(c.req.query('limit') || '100', 10);

    if (!action) {
      return c.json(createErrorResponse('Action parameter is required'), 400);
    }

    const logs = await getAuditLogsByAction(action, limit);

    return c.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * GET /api/audit/by-ip
 * Get audit logs by IP address
 */
auditRoutes.get('/by-ip', auth, strictRateLimit, async (c) => {
  try {
    const ipAddress = c.req.query('ip');
    const limit = parseInt(c.req.query('limit') || '100', 10);

    if (!ipAddress) {
      return c.json(createErrorResponse('IP address parameter is required'), 400);
    }

    const logs = await getAuditLogsByIp(ipAddress, limit);

    return c.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * GET /api/audit/by-date-range
 * Get audit logs by date range
 */
auditRoutes.get('/by-date-range', auth, strictRateLimit, async (c) => {
  try {
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const limit = parseInt(c.req.query('limit') || '100', 10);

    if (!startDate || !endDate) {
      return c.json(createErrorResponse('startDate and endDate parameters are required'), 400);
    }

    const logs = await getAuditLogsByDateRange(new Date(startDate), new Date(endDate), limit);

    return c.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * GET /api/audit/failed-logins
 * Get failed login attempts for current user
 */
auditRoutes.get('/failed-logins', auth, apiRateLimit, async (c) => {
  try {
    const hours = parseInt(c.req.query('hours') || '24', 10);
    const logs = await getFailedLoginAttempts((c as any).user.userId, hours);

    return c.json({
      success: true,
      data: {
        failedAttempts: logs,
        count: logs.length,
        hours,
      },
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

export default auditRoutes;

