import { redisConfig } from './env';
import { createClient } from 'redis';

// Optional Redis client loader (lazy) to avoid hard dependency when not configured
// Uses node-redis v4 API if available
export type RedisClient = {
  incr: (key: string) => Promise<number>;
  pExpire: (key: string, ttlMs: number) => Promise<void>;
  ttl: (key: string) => Promise<number>;
};

let client: any = null;

export async function getRedis(): Promise<RedisClient | null> {
  if (!redisConfig.enabled) return null;
  if (client) return client;

  try {
    const redis = createClient({ url: redisConfig.url });
    if (!redis.isOpen) {
      await redis.connect();
    }
    client = redis;
    return client as RedisClient;
  } catch (err) {
    console.error('Redis client init failed. Falling back to in-memory store.', err);
    return null;
  }
}


