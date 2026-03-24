import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

// --- Locker ---
const LOCKER_PATH = join(DATA_DIR, 'Locker.json');

export function getLocker() {
  return JSON.parse(readFileSync(LOCKER_PATH, 'utf-8'));
}

export function saveLocker(data) {
  writeFileSync(LOCKER_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// --- Productor ---
function prodPath(tel) {
  return join(DATA_DIR, `Prod_${tel}.json`);
}

export function getProductor(tel) {
  const p = prodPath(tel);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf-8'));
}

export function saveProductor(tel, data) {
  writeFileSync(prodPath(tel), JSON.stringify(data, null, 2), 'utf-8');
}

export function crearProductor(tel, nom) {
  const data = {
    tel,
    nom,
    productes: [],
    creat: new Date().toISOString()
  };
  saveProductor(tel, data);
  return data;
}

export function llistaProductors() {
  const files = readdirSync(DATA_DIR).filter(f => f.startsWith('Prod_') && f.endsWith('.json'));
  return files.map(f => JSON.parse(readFileSync(join(DATA_DIR, f), 'utf-8')));
}

// --- Client ---
function clientPath(tel) {
  return join(DATA_DIR, `Client_${tel}.json`);
}

export function getClient(tel) {
  const p = clientPath(tel);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf-8'));
}

export function saveClient(tel, data) {
  writeFileSync(clientPath(tel), JSON.stringify(data, null, 2), 'utf-8');
}

export function getOrCreateClient(tel) {
  let client = getClient(tel);
  if (!client) {
    client = {
      tel,
      idioma: 'ca',
      historial: [],
      estat: 'actiu',
      creat: new Date().toISOString()
    };
    saveClient(tel, client);
  }
  return client;
}
