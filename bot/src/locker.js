import { getLocker, saveLocker } from './data.js';

/**
 * Obre un locker enviant comanda HTTP al Shelly
 * Switch 0 = porta (auto_off 1s)
 */
export async function obrirLocker(lockerId) {
  const locker = getLocker();
  const lk = locker[lockerId];
  if (!lk) throw new Error(`Locker ${lockerId} no existeix`);

  const url = `http://${lk.ip}/rpc/Switch.Set`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 0, on: true }),
      signal: AbortSignal.timeout(5000)
    });
    const data = await res.json();
    console.log(`[LOCKER] ${lockerId} obert:`, data);
    return true;
  } catch (e) {
    console.error(`[LOCKER] Error obrint ${lockerId}:`, e.message);
    return false;
  }
}

/**
 * Encen llum verda (Switch 1) d'un locker
 */
export async function llumLocker(lockerId, on) {
  const locker = getLocker();
  const lk = locker[lockerId];
  if (!lk) return false;

  try {
    const res = await fetch(`http://${lk.ip}/rpc/Switch.Set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1, on }),
      signal: AbortSignal.timeout(5000)
    });
    return true;
  } catch (e) {
    console.error(`[LOCKER] Error llum ${lockerId}:`, e.message);
    return false;
  }
}

/**
 * Consulta estat d'un locker (online/offline + switches)
 */
export async function estatLocker(lockerId) {
  const locker = getLocker();
  const lk = locker[lockerId];
  if (!lk) return null;

  try {
    const res = await fetch(`http://${lk.ip}/rpc/Shelly.GetStatus`, {
      signal: AbortSignal.timeout(3000)
    });
    const data = await res.json();
    return {
      online: true,
      ip: lk.ip,
      porta: data['switch:0']?.output || false,
      llum: data['switch:1']?.output || false,
      wifi: data.wifi?.rssi || null
    };
  } catch (e) {
    return { online: false, ip: lk.ip };
  }
}

/**
 * Estat de tots els lockers
 */
export async function estatTots() {
  const locker = getLocker();
  const resultats = {};
  const promeses = Object.keys(locker).map(async (id) => {
    resultats[id] = {
      ...await estatLocker(id),
      ...locker[id]
    };
  });
  await Promise.all(promeses);
  return resultats;
}

/**
 * Assigna producte a un locker
 */
export function assignarProducte(lockerId, productor, producte, preu, stock) {
  const locker = getLocker();
  if (!locker[lockerId]) throw new Error(`Locker ${lockerId} no existeix`);

  locker[lockerId].productor = productor;
  locker[lockerId].producte = producte;
  locker[lockerId].preu = preu;
  locker[lockerId].stock = stock;
  locker[lockerId].estat = 'ple';
  saveLocker(locker);
  return locker[lockerId];
}

/**
 * Allibera un locker
 */
export function alliberarLocker(lockerId) {
  const locker = getLocker();
  if (!locker[lockerId]) throw new Error(`Locker ${lockerId} no existeix`);

  locker[lockerId].productor = null;
  locker[lockerId].producte = null;
  locker[lockerId].preu = null;
  locker[lockerId].stock = 0;
  locker[lockerId].estat = 'lliure';
  saveLocker(locker);
}

/**
 * Redueix stock d'un locker (venda)
 */
export function reduirStock(lockerId) {
  const locker = getLocker();
  const lk = locker[lockerId];
  if (!lk || lk.stock <= 0) return false;

  lk.stock--;
  if (lk.stock === 0) lk.estat = 'buit';
  saveLocker(locker);
  return true;
}

/**
 * Llista lockers disponibles per comprar
 */
export function lockersAmbProducte() {
  const locker = getLocker();
  return Object.entries(locker)
    .filter(([_, lk]) => lk.producte && lk.stock > 0)
    .map(([id, lk]) => ({ id, ...lk }));
}

/**
 * Llista lockers lliures
 */
export function lockersLliures() {
  const locker = getLocker();
  return Object.entries(locker)
    .filter(([_, lk]) => lk.estat === 'lliure')
    .map(([id, lk]) => ({ id, ...lk }));
}

/**
 * Llista lockers d'un productor
 */
export function lockersDeProductor(tel) {
  const locker = getLocker();
  return Object.entries(locker)
    .filter(([_, lk]) => lk.productor === tel)
    .map(([id, lk]) => ({ id, ...lk }));
}
