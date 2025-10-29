import { Hono } from 'hono';
import { auth } from '../middleware/auth';
import { apiRateLimit, userRateLimit } from '../middleware/rate-limit';
import {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  getDefaultAddress,
  setDefaultAddress,
} from '../services/address.service';
import { createErrorResponse } from '../utils/errors';

const addressRoutes = new Hono();

/**
 * POST /api/addresses
 * Create a new address
 */
addressRoutes.post('/', auth, userRateLimit, async (c) => {
  try {
    const addressData = await c.req.json();
    const address = await createAddress((c as any).user.userId, addressData);

    return c.json({
      success: true,
      data: address,
    }, 201);
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * GET /api/addresses
 * Get all user addresses
 */
addressRoutes.get('/', auth, apiRateLimit, async (c) => {
  try {
    const addresses = await getUserAddresses((c as any).user.userId);

    return c.json({
      success: true,
      data: addresses,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * GET /api/addresses/default
 * Get default address
 */
addressRoutes.get('/default', auth, apiRateLimit, async (c) => {
  try {
    const address = await getDefaultAddress((c as any).user.userId);

    return c.json({
      success: true,
      data: address,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 404);
  }
});

/**
 * GET /api/addresses/:id
 * Get address by ID
 */
addressRoutes.get('/:id', auth, apiRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const address = await getAddressById(id);

    return c.json({
      success: true,
      data: address,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 404);
  }
});

/**
 * PUT /api/addresses/:id
 * Update an address
 */
addressRoutes.put('/:id', auth, userRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const updateData = await c.req.json();
    const address = await updateAddress(id, updateData);

    return c.json({
      success: true,
      data: address,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * DELETE /api/addresses/:id
 * Delete an address
 */
addressRoutes.delete('/:id', auth, userRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const result = await deleteAddress(id);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * PATCH /api/addresses/:id/set-default
 * Set an address as default
 */
addressRoutes.patch('/:id/set-default', auth, userRateLimit, async (c) => {
  try {
    const { id } = c.req.param();
    const result = await setDefaultAddress(id);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

export default addressRoutes;

