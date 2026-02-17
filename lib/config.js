/**
 * FILE: lib/config.js
 * Konfigurasi utama untuk C2 Server.
 */

import 'dotenv/config';

const config = {
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID,
    secondaryAdmin: process.env.TELEGRAM_SECONDARY_ADMIN,
    adminIds: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : []
  },
  database: {
    redisUrl: process.env.REDIS_URL || process.env.DATABASE_URL,
    blobToken: process.env.BLOB_STORAGE_KEY
  },
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY,
    jwtSecret: process.env.JWT_SECRET,
    allowedCountries: process.env.ALLOWED_COUNTRIES ? process.env.ALLOWED_COUNTRIES.split(',') : [],
    blockedIpsRange: process.env.BLOCKED_IPS_RANGE ? process.env.BLOCKED_IPS_RANGE.split(',') : []
  },
  payload: {
    path: process.env.PAYLOAD_PATH || '/public/payloads/spyware.apk',
    version: process.env.PAYLOAD_VERSION || '1.0.0'
  }
};

// Validasi konfigurasi kritis
const required = [
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_ADMIN_CHAT_ID',
  'REDIS_URL',
  'ENCRYPTION_KEY',
  'BLOB_STORAGE_KEY'
];

required.forEach(key => {
  if (!process.env[key]) {
    console.error(`ERROR: Missing environment variable: ${key}`);
  }
});

export default config;
export { config };
