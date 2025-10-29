import { Hono } from 'hono';
import { auth, authWithSession } from '../middleware/auth';
import { apiRateLimit, strictRateLimit } from '../middleware/rate-limit';
import {
  getUserSessions,
  deactivateSession,
  deactivateAllUserSessions,
  deactivateSessionByDevice,
  getSessionDetails,
  extendSession,
} from '../services/session.service';
import { createErrorResponse } from '../utils/errors';

const sessionRoutes = new Hono();

/**
 * GET /api/sessions
 * Get all active sessions for current user
 */
sessionRoutes.get('/', auth, apiRateLimit, async (c) => {
  try {
    const sessions = await getUserSessions((c as any).user.userId);

    return c.json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * GET /api/sessions/:sessionId
 * Get session details
 */
sessionRoutes.get('/:sessionId', auth, apiRateLimit, async (c) => {
  try {
    const { sessionId } = c.req.param();
    const session = await getSessionDetails(sessionId);

    return c.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 404);
  }
});

/**
 * DELETE /api/sessions/:sessionId
 * Deactivate a specific session
 */
sessionRoutes.delete('/:sessionId', auth, strictRateLimit, async (c) => {
  try {
    const { sessionId } = c.req.param();
    const result = await deactivateSession(sessionId);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * POST /api/sessions/logout-all
 * Logout from all devices
 */
sessionRoutes.post('/logout-all', auth, strictRateLimit, async (c) => {
  try {
    const result = await deactivateAllUserSessions((c as any).user.userId);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * DELETE /api/sessions/device/:deviceId
 * Deactivate session by device ID
 */
sessionRoutes.delete('/device/:deviceId', auth, strictRateLimit, async (c) => {
  try {
    const { deviceId } = c.req.param();
    const result = await deactivateSessionByDevice(deviceId);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * POST /api/sessions/:sessionId/extend
 * Extend session expiration
 */
sessionRoutes.post('/:sessionId/extend', auth, apiRateLimit, async (c) => {
  try {
    const { sessionId } = c.req.param();
    const { additionalDays } = await c.req.json();
    const result = await extendSession(sessionId, additionalDays);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

export default sessionRoutes;

