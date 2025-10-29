import { Hono } from 'hono';
import { auth } from '../middleware/auth';
import { apiRateLimit, userRateLimit } from '../middleware/rate-limit';
import {
  getUserDevices,
  getTrustedDevices,
  markDeviceTrusted,
  markDeviceUntrusted,
  updateDevice,
  deleteDevice,
  getDeviceById,
} from '../services/device.service';
import { createErrorResponse } from '../utils/errors';

const deviceRoutes = new Hono();

/**
 * GET /api/devices
 * Get all devices for current user
 */
deviceRoutes.get('/', auth, apiRateLimit, async (c) => {
  try {
    const devices = await getUserDevices((c as any).user.userId);

    return c.json({
      success: true,
      data: devices,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * GET /api/devices/:deviceId
 * Get device by ID
 */
deviceRoutes.get('/:deviceId', auth, apiRateLimit, async (c) => {
  try {
    const { deviceId } = c.req.param();
    const device = await getDeviceById(deviceId);

    return c.json({
      success: true,
      data: device,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 404);
  }
});

/**
 * GET /api/devices/trusted
 * Get trusted devices for current user
 */
deviceRoutes.get('/trusted', auth, apiRateLimit, async (c) => {
  try {
    const devices = await getTrustedDevices((c as any).user.userId);

    return c.json({
      success: true,
      data: devices,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * POST /api/devices/:deviceId/trust
 * Mark device as trusted
 */
deviceRoutes.post('/:deviceId/trust', auth, userRateLimit, async (c) => {
  try {
    const { deviceId } = c.req.param();
    const result = await markDeviceTrusted(deviceId);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * POST /api/devices/:deviceId/untrust
 * Remove device from trusted list
 */
deviceRoutes.post('/:deviceId/untrust', auth, userRateLimit, async (c) => {
  try {
    const { deviceId } = c.req.param();
    const result = await markDeviceUntrusted(deviceId);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * PUT /api/devices/:deviceId
 * Update device information
 */
deviceRoutes.put('/:deviceId', auth, userRateLimit, async (c) => {
  try {
    const { deviceId } = c.req.param();
    const updateData = await c.req.json();
    const device = await updateDevice(deviceId, updateData);

    return c.json({
      success: true,
      data: device,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * DELETE /api/devices/:deviceId
 * Delete a device
 */
deviceRoutes.delete('/:deviceId', auth, userRateLimit, async (c) => {
  try {
    const { deviceId } = c.req.param();
    const result = await deleteDevice(deviceId);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

export default deviceRoutes;

