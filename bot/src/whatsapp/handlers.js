import { downloadMediaMessage, getContentType } from '@whiskeysockets/baileys';
import { getConfig } from '../config.js';
import { processarMissatge } from '../ai.js';
import { getBotNumber } from './client.js';
import { setCronSender } from '../cron.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';

const cfg = getConfig();
const genAI = new GoogleGenerativeAI(cfg.api.geminiApiKey);
const fileManager = new GoogleAIFileManager(cfg.api.geminiApiKey);

const sentByBot = new Set();
const LOG_JID = `${cfg.admin.logNumber}@s.whatsapp.net`;

async function logToMobile(sock, direction, contactNum, text) {
  if (!text || contactNum === cfg.admin.logNumber) return;
  const prefix = direction === 'RX' ? '📩' : '📤';
  const short = text.length > 300 ? text.substring(0, 300) + '...' : text;
  try {
    const sent = await sock.sendMessage(LOG_JID, { text: `${prefix} ${contactNum}\n${short}` });
    if (sent?.key?.id) sentByBot.add(sent.key.id);
  } catch (e) {}
}

/**
 * Transcribe audio to text using Gemini
 */
async function transcribeAudio(audioBuffer, mimetype) {
  try {
    const uploadResult = await fileManager.uploadFile(audioBuffer, {
      mimeType: mimetype,
      displayName: `audio-wa-${Date.now()}`
    });
    const model = genAI.getGenerativeModel({ model: cfg.api.geminiModel });
    const result = await model.generateContent([
      { text: 'Transcribe this audio to text in its ORIGINAL language. Do NOT translate. Return ONLY the transcribed text.' },
      { fileData: { mimeType: mimetype, fileUri: uploadResult.file.uri } }
    ]);
    const text = result.response.text().trim();
    console.log(`[AUDIO] Transcribed: ${text}`);
    try { await fileManager.deleteFile(uploadResult.file.name); } catch (_) {}
    return text;
  } catch (e) {
    console.error('[AUDIO] Error:', e.message);
    if (e.message?.includes('quota') || e.message?.includes('exhausted')) return '__QUOTA__';
    return null;
  }
}

export function setupHandlers(sock, { sendMenu = true } = {}) {

  // Inject sender for cron notifications
  setCronSender((jid, msg) => sock.sendMessage(jid, msg));

  if (sendMenu) {
    const bootTime = new Date().toLocaleString('ca-ES', { timeZone: 'Europe/Madrid' });
    setTimeout(async () => {
      try {
        await sock.sendMessage(`${cfg.admin.master}@s.whatsapp.net`, {
          text: `*[LockerBot BOOT]*\n${bootTime}\n\nBot online 🔑`
        });
      } catch (e) {}
    }, 3000);
  }

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return;

    for (const msg of messages) {
      try {
        if (!msg.message) continue;
        if (msg.key.id && sentByBot.has(msg.key.id)) { sentByBot.delete(msg.key.id); continue; }

        const jid = msg.key.remoteJid;
        if (!jid || jid === 'status@broadcast') continue;

        const fromMe = msg.key.fromMe;
        if (fromMe) continue; // No processar missatges propis

        // Extract phone number
        const resolvedJid = msg.key.remoteJidAlt || jid;
        const userTel = resolvedJid.replace('@s.whatsapp.net', '').replace('@c.us', '');

        // Extract text
        let text = msg.message?.conversation
          || msg.message?.extendedTextMessage?.text
          || '';

        const msgType = getContentType(msg.message);

        // Contact -> master creates producer
        if (msgType === 'contactMessage' || msgType === 'contactsArrayMessage') {
          const isMaster = userTel === cfg.admin.master;
          if (isMaster) {
            const contact = msg.message?.contactMessage || msg.message?.contactsArrayMessage?.contacts?.[0];
            if (contact) {
              const vcard = contact.vcard || '';
              const nameMatch = vcard.match(/FN:(.+)/);
              const telMatch = vcard.match(/TEL[^:]*:[\+]?(\d+)/);
              const contactName = nameMatch ? nameMatch[1].trim() : contact.displayName || 'Unknown';
              let contactTel = telMatch ? telMatch[1] : '';
              // Normalize: ensure starts with 34
              if (contactTel.startsWith('34')) { /* ok */ }
              else if (contactTel.startsWith('+34')) contactTel = contactTel.slice(1);
              else if (!contactTel.startsWith('34')) contactTel = '34' + contactTel;

              if (contactTel) {
                text = `Create producer from this contact: name "${contactName}", phone "${contactTel}"`;
                console.log(`[CONTACT] Master sent contact: ${contactName} (${contactTel})`);
              }
            }
          } else {
            await sock.sendMessage(jid, { text: 'Només el master pot crear productors enviant contactes.' });
            continue;
          }
        }

        // Audio -> transcribe
        if (msgType === 'audioMessage' || msgType === 'pttMessage') {
          console.log(`[AUDIO] Received from ${userTel}`);
          try {
            await sock.sendMessage(jid, { react: { text: '🎧', key: msg.key } });
            const buffer = await downloadMediaMessage(msg, 'buffer', {}, {
              reuploadRequest: sock.updateMediaMessage
            });
            const mimetype = msg.message?.audioMessage?.mimetype
              || msg.message?.pttMessage?.mimetype || 'audio/ogg';
            const transcribed = await transcribeAudio(buffer, mimetype);
            if (transcribed === '__QUOTA__') {
              await sock.sendMessage(jid, { text: 'No puc processar àudios ara. Escriu-me per text!' });
              continue;
            } else if (transcribed) {
              text = transcribed;
            } else {
              await sock.sendMessage(jid, { text: 'No he entès l\'àudio. Escriu-me per text!' });
              continue;
            }
          } catch (e) {
            console.error('[AUDIO] Error:', e.message);
            continue;
          }
        }

        if (!text) continue;

        console.log(`[MSG] ${userTel}: ${text}`);
        logToMobile(sock, 'RX', userTel, text);

        // Mark as read
        try { await sock.readMessages([msg.key]); } catch (e) {}

        // React while processing
        await sock.sendMessage(jid, { react: { text: '💭', key: msg.key } });

        // Process with AI + MCP tools
        const response = await processarMissatge(userTel, text);

        // Send response
        const sent = await sock.sendMessage(jid, { text: response });
        if (sent?.key?.id) sentByBot.add(sent.key.id);

        // Remove react
        await sock.sendMessage(jid, { react: { text: '', key: msg.key } });

        logToMobile(sock, 'TX', userTel, response);
        console.log(`[REPLY] ${userTel}: ${response.substring(0, 80)}...`);

      } catch (error) {
        console.error('[ERROR]', error.message);
        try {
          await sock.sendMessage(msg.key.remoteJid, { text: 'Error. Intenta-ho de nou.' });
        } catch (e) {}
      }
    }
  });

  console.log('[HANDLERS] Message handlers configured');
}
