import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, '..', 'lockerBot.json');

let _config = null;

export function getConfig() {
  if (_config) return _config;
  const raw = readFileSync(CONFIG_PATH, 'utf-8');
  _config = JSON.parse(raw);
  return _config;
}

export function saveConfig() {
  if (!_config) return;
  writeFileSync(CONFIG_PATH, JSON.stringify(_config, null, 2), 'utf-8');
}

export default getConfig();
