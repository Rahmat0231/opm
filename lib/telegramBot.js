/**
 * FILE: lib/telegramBot.js
 * Integrasi Telegram Bot API untuk C2 channel.
 */

import axios from 'axios';
import config from './config.js';

const TELEGRAM_API_URL = `https://api.telegram.org/bot${config.telegram.token}`;

export const sendMessage = async (chatId, text, options = {}) => {
  try {
    const res = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      ...options
    });
    return res.data;
  } catch (err) {
    console.error('Telegram sendMessage error:', err.response?.data || err.message);
  }
};

export const sendDocument = async (chatId, fileUrl, caption) => {
  try {
    const res = await axios.post(`${TELEGRAM_API_URL}/sendDocument`, {
      chat_id: chatId,
      document: fileUrl,
      caption: caption
    });
    return res.data;
  } catch (err) {
    console.error('Telegram sendDocument error:', err.response?.data || err.message);
  }
};

export const sendPhoto = async (chatId, photoUrl, caption) => {
  try {
    const res = await axios.post(`${TELEGRAM_API_URL}/sendPhoto`, {
      chat_id: chatId,
      photo: photoUrl,
      caption: caption
    });
    return res.data;
  } catch (err) {
    console.error('Telegram sendPhoto error:', err.response?.data || err.message);
  }
};

export const editMessage = async (chatId, messageId, text) => {
  try {
    const res = await axios.post(`${TELEGRAM_API_URL}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'Markdown'
    });
    return res.data;
  } catch (err) {
    console.error('Telegram editMessage error:', err.response?.data || err.message);
  }
};

export const handleCommand = async (update) => {
  const { message } = update;
  if (!message || !message.text) return;
  
  const chatId = message.chat.id;
  const text = message.text;
  const senderId = message.from.id.toString();
  
  // Hanya proses jika admin yang kirim
  if (!config.telegram.adminIds.includes(senderId) && senderId !== config.telegram.adminChatId) {
    return sendMessage(chatId, '❌ Access Denied.');
  }
  
  const args = text.split(' ');
  const command = args[0].toLowerCase();
  
  // Ini akan diproses oleh telegram-webhook.js
  return { chatId, command, args, messageId: message.message_id };
};
