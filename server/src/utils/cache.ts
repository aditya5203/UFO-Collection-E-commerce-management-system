import { redisClient } from "../config/redis";

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (!redisClient.isOpen) return null;

    const cached = await redisClient.get(key);
    if (!cached) return null;

    return JSON.parse(cached) as T;
  } catch {
    return null;
  }
}

export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds = 300
) {
  try {
    if (!redisClient.isOpen) return;

    await redisClient.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  } catch {
    // Ignore cache error
  }
}

export async function deleteCacheByPattern(pattern: string) {
  try {
    if (!redisClient.isOpen) return;

    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch {
    // Ignore cache error
  }
}