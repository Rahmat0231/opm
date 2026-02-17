/**
 * FILE: lib/ratelimit.js
 * Implementasi Rate Limiting menggunakan Redis.
 */

import { getRedisClient } from './database.js';

export const checkRateLimit = async (key, limit, windowInSeconds) => {
  const client = await getRedisClient();
  const current = await client.incr(`ratelimit:${key}`);
  if (current === 1) {
    await client.expire(`ratelimit:${key}`, windowInSeconds);
  }
  return current <= limit;
};

export const isBlocked = async (ip) => {
  const client = await getRedisClient();
  const blocked = await client.get(`blocked:${ip}`);
  return !!blocked;
};

export const blockIP = async (ip, reason, durationSeconds = 86400) => {
  const client = await getRedisClient();
  await client.set(`blocked:${ip}`, JSON.stringify({ reason, timestamp: Date.now() }), { EX: durationSeconds });
};
