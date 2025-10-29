import { Hono } from 'hono';
import { auth } from '../middleware/auth';
import { apiRateLimit, userRateLimit } from '../middleware/rate-limit';
import {
  getUserProfile,
  updateUserProfile,
  searchUsers,
  getUserByUsername,
  isUsernameAvailable,
  uploadUserAvatar,
} from '../services/user.service';
import { createErrorResponse } from '../utils/errors';

const userRoutes = new Hono();

/**
 * GET /api/user/profile
 * Get current user profile
 */
userRoutes.get('/profile', auth, apiRateLimit, async (c) => {
  try {
    const profile = await getUserProfile((c as any).user.userId);

    return c.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 404);
  }
});

/**
 * PUT /api/user/profile
 * Update current user profile
 */
userRoutes.put('/profile', auth, userRateLimit, async (c) => {
  try {
    const updateData = await c.req.json();
    const profile = await updateUserProfile((c as any).user.userId, updateData);

    return c.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * GET /api/user/search
 * Search users by name or username
 */
userRoutes.get('/search', auth, apiRateLimit, async (c) => {
  try {
    const query = c.req.query('q');
    const limit = parseInt(c.req.query('limit') || '20');

    if (!query) {
      return c.json(createErrorResponse('Search query is required'), 400);
    }

    const users = await searchUsers(query, limit);

    return c.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * GET /api/user/by-username/:username
 * Get user by username
 */
userRoutes.get('/by-username/:username', auth, apiRateLimit, async (c) => {
  try {
    const { username } = c.req.param();
    const user = await getUserByUsername(username);

    return c.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 404);
  }
});

/**
 * GET /api/user/username/available
 * Check if username is available
 */
userRoutes.get('/username/available', apiRateLimit, async (c) => {
  try {
    const username = c.req.query('username');

    if (!username) {
      return c.json(createErrorResponse('Username is required'), 400);
    }

    const result = await isUsernameAvailable(username);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * POST /api/user/avatar
 * Upload user avatar
 */
userRoutes.post('/avatar', auth, userRateLimit, async (c) => {
  try {
    const userId = (c as any).user.userId;
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json(createErrorResponse('No file uploaded'), 400);
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadUserAvatar(userId, file, buffer);

    return c.json({
      success: true,
      data: result,
    }, 201);
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

export default userRoutes;

