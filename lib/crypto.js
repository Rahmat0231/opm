/**
 * FILE: lib/crypto.js
 * Kriptografi AES-256, JWT token, dan hashing untuk C2 komunikasi.
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from './config.js';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = Buffer.from(config.security.encryptionKey.padEnd(32, '0')).slice(0, 32);
const IV_LENGTH = 16;

export const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

export const decrypt = (text) => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const hash = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

export const generateToken = (deviceId, timestamp) => {
  return jwt.sign({ deviceId, timestamp }, config.security.jwtSecret, { expiresIn: '1h' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.security.jwtSecret);
  } catch (err) {
    return null;
  }
};
