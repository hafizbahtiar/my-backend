import type { Context, Next } from 'hono';
import ApiKey from '../models/ApiKey';
import { verifyTokenHash } from '../utils/password';

function parseApiKey(header?: string | null): { keyId: string; secret: string } | null {
  if (!header) return null;
  // Format: ak_<keyId>.<secret>
  const m = header.match(/^ak_([a-f0-9]+)\.(.+)$/i);
  if (!m) return null;
  return { keyId: m[1], secret: m[2] };
}

function ipFromContext(c: Context): string {
  return c.req.header('x-forwarded-for')?.split(',')[0].trim() || c.req.header('x-real-ip') || 'unknown';
}

export async function apiKeyAuth(c: Context, next: Next) {
  const header = c.req.header('x-api-key') || c.req.header('authorization');
  const parsed = parseApiKey(header?.toLowerCase().startsWith('bearer ') ? header?.slice(7) : header);
  if (!parsed) {
    return c.json({ success: false, error: { message: 'Missing or invalid API key', code: 'Unauthorized' } }, 401);
  }

  const doc = await ApiKey.findByKeyId(parsed.keyId);
  if (!doc) {
    return c.json({ success: false, error: { message: 'Invalid API key', code: 'Unauthorized' } }, 401);
  }

  if (doc.expiresAt && doc.expiresAt < new Date()) {
    return c.json({ success: false, error: { message: 'API key expired', code: 'Unauthorized' } }, 401);
  }

  // IP allowlist check (if configured)
  const reqIp = ipFromContext(c);
  if (doc.ipAllowlist && doc.ipAllowlist.length > 0) {
    const ok = doc.ipAllowlist.some((ip) => ip === reqIp);
    if (!ok) {
      return c.json({ success: false, error: { message: 'IP not allowed for this key', code: 'Forbidden' } }, 403);
    }
  }

  const valid = await verifyTokenHash(doc.keyHash, parsed.secret);
  if (!valid) {
    return c.json({ success: false, error: { message: 'Invalid API key', code: 'Unauthorized' } }, 401);
  }

  // attach principal
  (c as any).apiKey = { ownerId: doc.ownerId.toString(), scopes: doc.scopes, keyId: doc.keyId };

  await next();
}


