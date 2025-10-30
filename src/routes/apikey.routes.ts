import { Hono } from 'hono';
import { auth } from '../middleware/auth';
import { createErrorResponse } from '../utils/errors';
import { createApiKey, listApiKeys, revokeApiKey } from '../services/apikey.service';

const apiKeyRoutes = new Hono();

// Create API key (owner = current user)
apiKeyRoutes.post('/', auth, async (c) => {
  try {
    const { name, scopes, ipAllowlist, expiresAt } = await c.req.json();
    if (!name) {
      return c.json(createErrorResponse('Name is required'), 400);
    }
    const result = await createApiKey({
      ownerId: (c as any).user.userId,
      name,
      scopes: Array.isArray(scopes) ? scopes : [],
      ipAllowlist: Array.isArray(ipAllowlist) ? ipAllowlist : [],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    return c.json({ success: true, data: result }, 201);
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

// List API keys for current user
apiKeyRoutes.get('/', auth, async (c) => {
  try {
    const keys = await listApiKeys((c as any).user.userId);
    return c.json({ success: true, data: keys });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

// Revoke (disable) API key by keyId
apiKeyRoutes.delete('/:keyId', auth, async (c) => {
  try {
    const keyId = c.req.param('keyId');
    if (!keyId) return c.json(createErrorResponse('keyId is required'), 400);
    const result = await revokeApiKey((c as any).user.userId, keyId);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

export default apiKeyRoutes;


