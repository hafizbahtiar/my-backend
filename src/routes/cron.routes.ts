import { Hono } from 'hono';
import { auth } from '../middleware/auth';
import { apiRateLimit, userRateLimit } from '../middleware/rate-limit';
import {
  createCronJob,
  listCronJobs,
  getCronJobById,
  updateCronJob,
  patchCronJob,
  setCronJobEnabled,
  deleteCronJob,
  runCronJobNow,
} from '../services/cron.service';
import { createErrorResponse } from '../utils/errors';

const cronRoutes = new Hono();

/**
 * POST /api/cron/jobs
 * Create a cron job (per owner)
 */
cronRoutes.post('/jobs', auth, userRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const job = await createCronJob((c as any).user.userId, body);
    return c.json({ success: true, data: job }, 201);
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * GET /api/cron/jobs
 * List cron jobs for owner
 */
cronRoutes.get('/jobs', auth, apiRateLimit, async (c) => {
  try {
    const enabledParam = c.req.query('enabled');
    const type = c.req.query('type');
    const enabled = typeof enabledParam === 'string' ? enabledParam === 'true' : undefined;
    const jobs = await listCronJobs((c as any).user.userId, { enabled, type: type || undefined });
    return c.json({ success: true, data: jobs });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * GET /api/cron/jobs/:id
 */
cronRoutes.get('/jobs/:id', auth, apiRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const job = await getCronJobById((c as any).user.userId, id);
    return c.json({ success: true, data: job });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 404);
  }
});

/**
 * PUT /api/cron/jobs/:id
 * Replace a cron job
 */
cronRoutes.put('/jobs/:id', auth, userRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const job = await updateCronJob((c as any).user.userId, id, body);
    return c.json({ success: true, data: job });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * PATCH /api/cron/jobs/:id
 * Partially update a cron job
 */
cronRoutes.patch('/jobs/:id', auth, userRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const job = await patchCronJob((c as any).user.userId, id, body);
    return c.json({ success: true, data: job });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * PATCH /api/cron/jobs/:id/enabled
 */
cronRoutes.patch('/jobs/:id/enabled', auth, userRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const { enabled } = await c.req.json();
    const job = await setCronJobEnabled((c as any).user.userId, id, !!enabled);
    return c.json({ success: true, data: job });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * POST /api/cron/jobs/:id/run-now
 */
cronRoutes.post('/jobs/:id/run-now', auth, userRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const job = await runCronJobNow((c as any).user.userId, id);
    return c.json({ success: true, data: job });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * DELETE /api/cron/jobs/:id
 */
cronRoutes.delete('/jobs/:id', auth, userRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const result = await deleteCronJob((c as any).user.userId, id);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

export default cronRoutes;


