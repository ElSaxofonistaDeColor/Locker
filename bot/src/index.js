// Silence libsignal "Closing session" logs
const _origInfo = console.info;
console.info = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Closing session')) return;
  _origInfo.apply(console, args);
};

import { connectToWhatsApp, setOnReconnect } from './whatsapp/client.js';
import { setupHandlers } from './whatsapp/handlers.js';
import { startCron, stopCron } from './cron.js';

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  LOCKER BOT - WhatsApp                       ║
║          Venda de productes via Lockers Shelly                ║
║          Powered by Baileys + OpenAI                          ║
╚══════════════════════════════════════════════════════════════╝
`);

  console.log('Starting WhatsApp connection...');
  console.log('If not linked yet, a QR will appear to scan.\n');

  const sock = await connectToWhatsApp();
  setupHandlers(sock);

  // Start cron timer (every 60s)
  startCron();

  setOnReconnect((newSock) => {
    console.log('[RECONNECT] Re-configuring handlers...');
    setupHandlers(newSock, { sendMenu: false });
  });
}

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  stopCron();
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled error:', error);
});

main().catch(console.error);
