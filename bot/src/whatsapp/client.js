import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestWaWebVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { getConfig } from '../config.js';

const cfg = getConfig();
const logger = pino({ level: 'silent' });
const AUTH_DIR = cfg.whatsapp.sessionPath;

let sock = null;
let botNumber = null;
let onReconnectCallback = null;
let isReconnecting = false;
let reconnectAttempts = 0;
let stableTimer = null;
const MAX_RECONNECT_ATTEMPTS = 10;

export async function connectToWhatsApp() {
  if (sock) {
    try {
      sock.ev.removeAllListeners();
      sock.ws?.close();
      sock.end();
    } catch (e) {}
    sock = null;
  }
  if (stableTimer) { clearTimeout(stableTimer); stableTimer = null; }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestWaWebVersion();
  console.log(`[WA] WhatsApp Web version: ${version.join('.')}`);

  sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    logger,
    version,
    printQRInTerminal: false,
    getMessage: async () => ({ conversation: '' })
  });

  sock.ev.on('creds.update', saveCreds);

  return new Promise((resolve) => {
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('\nScan this QR with WhatsApp:\n');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'open') {
        isReconnecting = false;
        if (stableTimer) clearTimeout(stableTimer);
        stableTimer = setTimeout(() => { reconnectAttempts = 0; }, 30000);

        const rawId = sock.user?.id || '';
        botNumber = rawId.split(':')[0].split('@')[0];

        const numberFile = path.resolve('.bot-number');
        fs.writeFileSync(numberFile, botNumber);

        console.log(`\n[WA] Connected! Bot number: ${botNumber}\n`);
        resolve(sock);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log(`[WA] Connection closed. Code: ${statusCode}`);

        if (statusCode === DisconnectReason.loggedOut) {
          console.log('Session logged out. Delete baileys_auth/ and restart.');
        } else if (!isReconnecting) {
          isReconnecting = true;
          reconnectAttempts++;
          if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
            console.log(`[WA] Too many reconnection attempts. Restart manually.`);
            return;
          }
          const baseDelay = statusCode === 440 ? 10000 : 5000;
          const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts - 1), 60000);
          console.log(`[WA] Reconnecting in ${delay / 1000}s... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

          setTimeout(() => {
            isReconnecting = false;
            connectToWhatsApp().then(newSock => {
              sock = newSock;
              if (onReconnectCallback) onReconnectCallback(newSock);
            });
          }, delay);
        }
      }
    });
  });
}

export function getSock() { return sock; }
export function setOnReconnect(cb) { onReconnectCallback = cb; }
export function getBotNumber() {
  if (botNumber) return botNumber;
  try {
    const f = path.resolve('.bot-number');
    if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
  } catch (e) {}
  return null;
}
