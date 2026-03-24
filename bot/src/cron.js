/**
 * Cron system - checks pending tasks every minute.
 * Tasks are stored in data/cron.json with a trigger time.
 * When time is reached, the action is executed.
 *
 * Task types:
 * - check_door: verify locker door is closed after purchase
 * - confirm_money: wait for producer to confirm money received
 * - notify_stock: alert producer when stock is low
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { estatLocker } from './locker.js';
import { getLocker, getClient, saveClient, getOrCreateClient } from './data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CRON_PATH = join(__dirname, '..', 'data', 'cron.json');

let cronInterval = null;
let sendMessageFn = null; // injected from handlers

export function setCronSender(fn) {
  sendMessageFn = fn;
}

function loadCron() {
  try {
    return JSON.parse(readFileSync(CRON_PATH, 'utf-8'));
  } catch (e) {
    return { tasques: [] };
  }
}

function saveCron(data) {
  writeFileSync(CRON_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Add a cron task
 * @param {string} type - Task type
 * @param {number} delayMinutes - Minutes until trigger
 * @param {object} params - Task-specific parameters
 */
export function addCronTask(type, delayMinutes, params) {
  const cron = loadCron();
  const task = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type,
    triggerAt: new Date(Date.now() + delayMinutes * 60000).toISOString(),
    createdAt: new Date().toISOString(),
    params,
    status: 'pending',
    retries: 0
  };
  cron.tasques.push(task);
  saveCron(cron);
  console.log(`[CRON] Task added: ${type} in ${delayMinutes}min (${task.id})`);
  return task.id;
}

/**
 * Cancel a cron task
 */
export function cancelCronTask(taskId) {
  const cron = loadCron();
  const idx = cron.tasques.findIndex(t => t.id === taskId);
  if (idx >= 0) {
    cron.tasques[idx].status = 'cancelled';
    saveCron(cron);
    console.log(`[CRON] Task cancelled: ${taskId}`);
    return true;
  }
  return false;
}

/**
 * Find a pending cron task by type and params
 */
export function findCronTask(type, matchFn) {
  const cron = loadCron();
  return cron.tasques.find(t => t.status === 'pending' && t.type === type && matchFn(t.params));
}

async function send(tel, text) {
  if (!sendMessageFn) {
    console.log(`[CRON] No sender configured. Would send to ${tel}: ${text}`);
    return;
  }
  try {
    await sendMessageFn(`${tel}@s.whatsapp.net`, { text });
  } catch (e) {
    console.error(`[CRON] Error sending to ${tel}:`, e.message);
  }
}

/**
 * Process a single cron task
 */
async function processTask(task, cron) {
  const { type, params } = task;
  console.log(`[CRON] Processing: ${type} (${task.id})`);

  switch (type) {

    case 'check_door': {
      // Check if locker door is closed after purchase
      const { locker_id, client_tel, master_tel, producer_tel } = params;
      const estat = await estatLocker(locker_id);

      if (!estat || !estat.online) {
        // Locker offline - retry
        task.retries++;
        if (task.retries >= 5) {
          task.status = 'failed';
          await send(master_tel, `⚠️ *ALERTA* Locker ${locker_id} offline! No es pot verificar la porta. Client: ${client_tel}`);
        } else {
          task.triggerAt = new Date(Date.now() + 60000).toISOString(); // retry in 1 min
          console.log(`[CRON] Locker ${locker_id} offline, retry ${task.retries}/5`);
        }
        return;
      }

      // Check input 0 (door sensor): true = closed, false = open
      // Using Switch 0 output as proxy - if relay off and no input, door is closed
      // Actually check the Shelly input status
      let doorOpen = false;
      try {
        const res = await fetch(`http://${estat.ip}/rpc/Input.GetStatus?id=0`, {
          signal: AbortSignal.timeout(3000)
        });
        const input = await res.json();
        doorOpen = !input.state; // state=true means closed (sensor contact), false means open
      } catch (e) {
        doorOpen = true; // assume open on error (safe side)
      }

      if (doorOpen) {
        task.retries++;
        if (task.retries >= 5) {
          // Door still open after 5 minutes!
          task.status = 'alert';
          await send(client_tel, `⚠️ La porta del locker ${locker_id} segueix oberta! Si us plau, tanca-la.`);
          await send(master_tel, `🚨 *ALERTA* Porta del locker ${locker_id} oberta més de 5 minuts! Client: ${client_tel}`);
          // Keep checking but with longer interval
          task.triggerAt = new Date(Date.now() + 2 * 60000).toISOString();
          task.status = 'pending'; // keep alive
        } else {
          task.triggerAt = new Date(Date.now() + 60000).toISOString(); // retry in 1 min
          console.log(`[CRON] Door ${locker_id} still open, check ${task.retries}/5`);
        }
        return;
      }

      // Door is closed!
      task.status = 'completed';
      console.log(`[CRON] Door ${locker_id} closed OK`);

      // Notify producer that door is closed (purchase picked up)
      if (producer_tel) {
        const locker = getLocker();
        const lk = locker[locker_id];
        await send(producer_tel, `✅ Locker ${locker_id} tancat. El client ha recollit *${lk?.producte || 'producte'}*.\nSi us plau, confirma que els diners són correctes responent *OK ${locker_id}*`);

        // Add task to wait for money confirmation
        addCronTask('confirm_money', 30, {
          locker_id,
          client_tel,
          producer_tel,
          master_tel,
          producte: lk?.producte,
          preu: lk?.preu
        });
      }
      break;
    }

    case 'confirm_money': {
      // Producer hasn't confirmed money in time
      const { locker_id, client_tel, producer_tel, master_tel, producte, preu } = params;
      task.status = 'expired';
      await send(master_tel, `⏰ Productor ${producer_tel} no ha confirmat els diners del locker ${locker_id} (${producte} ${preu}€). Client: ${client_tel}`);
      await send(producer_tel, `⏰ No has confirmat els diners del locker ${locker_id}. Contacta amb l'administrador.`);
      break;
    }

    case 'notify_stock': {
      // Notify producer of low stock
      const { locker_id, producer_tel } = params;
      const locker = getLocker();
      const lk = locker[locker_id];
      if (lk && lk.stock <= 1) {
        await send(producer_tel, `📦 Stock baix al locker ${locker_id}: *${lk.producte}* — queden ${lk.stock} unitats!`);
      }
      task.status = 'completed';
      break;
    }

    default:
      console.log(`[CRON] Unknown task type: ${type}`);
      task.status = 'unknown';
  }
}

/**
 * Main cron tick - runs every minute
 */
async function cronTick() {
  const cron = loadCron();
  const now = new Date();
  let changed = false;

  for (const task of cron.tasques) {
    if (task.status !== 'pending') continue;
    const trigger = new Date(task.triggerAt);
    if (now >= trigger) {
      await processTask(task, cron);
      changed = true;
    }
  }

  // Cleanup old completed/cancelled/failed tasks (>24h)
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const before = cron.tasques.length;
  cron.tasques = cron.tasques.filter(t => {
    if (t.status === 'pending') return true;
    return new Date(t.createdAt).getTime() > cutoff;
  });
  if (cron.tasques.length !== before) changed = true;

  if (changed) saveCron(cron);
}

/**
 * Start the cron loop (every 60 seconds)
 */
export function startCron() {
  if (cronInterval) return;
  console.log('[CRON] Started - checking every 60s');
  cronInterval = setInterval(cronTick, 60000);
  // Run once immediately
  cronTick().catch(e => console.error('[CRON] Error:', e.message));
}

/**
 * Stop the cron loop
 */
export function stopCron() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log('[CRON] Stopped');
  }
}

/**
 * Confirm money received by producer - called from handler
 */
export async function confirmMoney(producerTel, lockerId) {
  const cron = loadCron();
  const task = cron.tasques.find(t =>
    t.status === 'pending' &&
    t.type === 'confirm_money' &&
    t.params.locker_id === lockerId &&
    t.params.producer_tel === producerTel
  );

  if (!task) return null;

  task.status = 'completed';
  saveCron(cron);

  // Record purchase reputation for client
  const { client_tel, producte, preu } = task.params;
  const client = getOrCreateClient(client_tel);
  // Mark the last matching purchase as confirmed
  for (let i = client.historial.length - 1; i >= 0; i--) {
    if (client.historial[i].locker === lockerId && !client.historial[i].confirmat) {
      client.historial[i].confirmat = true;
      client.historial[i].confirmatPer = producerTel;
      client.historial[i].confirmatData = new Date().toISOString();
      break;
    }
  }

  // Update reputation score
  const confirmed = client.historial.filter(h => h.confirmat).length;
  const total = client.historial.length;
  client.reputacio = total > 0 ? Math.round((confirmed / total) * 100) : 0;
  saveClient(client_tel, client);

  console.log(`[CRON] Money confirmed for ${lockerId} by ${producerTel}. Client ${client_tel} reputation: ${client.reputacio}%`);

  return { client_tel, producte, preu, reputacio: client.reputacio };
}
