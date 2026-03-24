/**
 * LockerBot Tests
 *
 * Test 1: Master sends contact -> producer created with name and JSON
 * Test 2: Producer creates 5 products with prices and stock in free lockers
 * Test 3: Full purchase flow: client buys, door opens, money, close, notifications
 *
 * Run all:  node --test test/bot.test.js
 * Run one:  node --test --test-name-pattern='1\.' test/bot.test.js
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const LOCKER_PATH = join(DATA_DIR, 'Locker.json');
const CRON_PATH = join(DATA_DIR, 'cron.json');

// Import modules under test
import { executarTool, TOOLS, getSystemPrompt } from '../src/mcp.js';
import {
  getLocker, saveLocker, getProductor, saveProductor, crearProductor,
  getClient, getOrCreateClient, saveClient, llistaProductors
} from '../src/data.js';
import {
  assignarProducte, alliberarLocker, reduirStock,
  lockersAmbProducte, lockersLliures, lockersDeProductor
} from '../src/locker.js';
import { addCronTask, cancelCronTask, confirmMoney } from '../src/cron.js';

// Test data
const MASTER_TEL = '34627582130';
const PRODUCER_TEL = '34666111222';
const PRODUCER_NAME = 'Maria Pagesa';
const CLIENT_TEL = '34677333444';

// Backup and restore functions
let originalLocker, originalCron;

function backupData() {
  originalLocker = readFileSync(LOCKER_PATH, 'utf-8');
  originalCron = existsSync(CRON_PATH) ? readFileSync(CRON_PATH, 'utf-8') : '{"tasques":[]}';
}

function restoreData() {
  writeFileSync(LOCKER_PATH, originalLocker, 'utf-8');
  writeFileSync(CRON_PATH, originalCron, 'utf-8');
  // Clean test files
  const testFiles = [
    join(DATA_DIR, `Prod_${PRODUCER_TEL}.json`),
    join(DATA_DIR, `Client_${CLIENT_TEL}.json`)
  ];
  testFiles.forEach(f => { try { unlinkSync(f); } catch (e) {} });
}

function resetLocker() {
  const locker = {
    LK01: { ip: '10.160.140.190', productor: null, producte: null, preu: null, stock: 0, estat: 'lliure' },
    LK02: { ip: '10.160.140.183', productor: null, producte: null, preu: null, stock: 0, estat: 'lliure' },
    LK03: { ip: '10.160.140.147', productor: null, producte: null, preu: null, stock: 0, estat: 'lliure' },
    LK04: { ip: '10.160.140.119', productor: null, producte: null, preu: null, stock: 0, estat: 'lliure' },
    LK05: { ip: '10.160.140.126', productor: null, producte: null, preu: null, stock: 0, estat: 'lliure' },
    LK06: { ip: '10.160.140.181', productor: null, producte: null, preu: null, stock: 0, estat: 'lliure' },
    LK07: { ip: '10.160.140.243', productor: null, producte: null, preu: null, stock: 0, estat: 'lliure' },
    LK08: { ip: '10.160.140.195', productor: null, producte: null, preu: null, stock: 0, estat: 'lliure' },
    LK09: { ip: '10.160.140.120', productor: null, producte: null, preu: null, stock: 0, estat: 'lliure' }
  };
  saveLocker(locker);
  writeFileSync(CRON_PATH, '{"tasques":[]}', 'utf-8');
}

// ============================================================
// TEST 1: Master sends contact -> producer created
// ============================================================

describe('1. Master creates producer from WhatsApp contact', () => {
  before(() => { backupData(); resetLocker(); });
  after(() => restoreData());

  it('1.1 MCP tool create_producer_from_contact creates JSON', async () => {
    const result = await executarTool('create_producer_from_contact', {
      tel: PRODUCER_TEL,
      name: PRODUCER_NAME
    });
    console.log('  Result:', result);
    assert.ok(result.includes('Producer created'));
    assert.ok(result.includes(PRODUCER_NAME));
    assert.ok(result.includes(PRODUCER_TEL));
  });

  it('1.2 Producer JSON file exists with correct data', () => {
    const prod = getProductor(PRODUCER_TEL);
    assert.ok(prod, 'Producer file should exist');
    assert.equal(prod.nom, PRODUCER_NAME);
    assert.equal(prod.tel, PRODUCER_TEL);
    assert.deepEqual(prod.productes, []);
    console.log('  Producer JSON:', JSON.stringify(prod, null, 2));
  });

  it('1.3 Duplicate producer is rejected', async () => {
    const result = await executarTool('create_producer_from_contact', {
      tel: PRODUCER_TEL,
      name: 'Duplicate'
    });
    assert.ok(result.includes('already exists'));
  });

  it('1.4 Producer appears in list', async () => {
    const result = await executarTool('list_producers', {});
    assert.ok(result.includes(PRODUCER_NAME));
    console.log('  Producers:', result);
  });

  it('1.5 System prompt reflects master role', () => {
    const prompt = getSystemPrompt('master', MASTER_TEL);
    assert.ok(prompt.includes('MASTER'));
    assert.ok(prompt.includes('create_producer'));
  });
});

// ============================================================
// TEST 2: Producer creates 5 products with prices and stock
// ============================================================

describe('2. Producer creates 5 products in free lockers', () => {
  before(() => { backupData(); resetLocker(); crearProductor(PRODUCER_TEL, PRODUCER_NAME); });
  after(() => restoreData());

  const products = [
    { name: 'Mel de Romaní', price: 8.50, stock: 3, locker: 'LK01' },
    { name: 'Formatge Ovella', price: 12.00, stock: 2, locker: 'LK02' },
    { name: 'Oli Oliva Extra', price: 15.00, stock: 4, locker: 'LK03' },
    { name: 'Embotit Casolà', price: 6.50, stock: 5, locker: 'LK04' },
    { name: 'Ous de Pagès', price: 3.50, stock: 6, locker: 'LK05' }
  ];

  it('2.1 Free lockers available before assignment', async () => {
    const result = await executarTool('get_free_lockers', {});
    console.log('  Free:', result);
    assert.ok(result.includes('LK01'));
    assert.ok(result.includes('LK09'));
  });

  for (const [i, prod] of products.entries()) {
    it(`2.2.${i + 1} Assign "${prod.name}" to ${prod.locker}`, async () => {
      const result = await executarTool('assign_product', {
        locker_id: prod.locker,
        producer_tel: PRODUCER_TEL,
        product_name: prod.name,
        price: prod.price,
        stock: prod.stock
      });
      console.log(`  ${result}`);
      assert.ok(result.includes('Assigned!'));
      assert.ok(result.includes(prod.name));
    });
  }

  it('2.3 Locker.json reflects all 5 products', () => {
    const locker = getLocker();
    for (const prod of products) {
      assert.equal(locker[prod.locker].producte, prod.name);
      assert.equal(locker[prod.locker].preu, prod.price);
      assert.equal(locker[prod.locker].stock, prod.stock);
      assert.equal(locker[prod.locker].productor, PRODUCER_TEL);
      assert.equal(locker[prod.locker].estat, 'ple');
    }
    console.log('  All 5 products assigned correctly');
  });

  it('2.4 Producer JSON has products listed', () => {
    const prod = getProductor(PRODUCER_TEL);
    assert.equal(prod.productes.length, 5);
    console.log('  Producer products:', prod.productes.map(p => p.nom).join(', '));
  });

  it('2.5 Free lockers reduced to 4', async () => {
    const result = await executarTool('get_free_lockers', {});
    console.log('  Free now:', result);
    assert.ok(result.includes('LK06'));
    assert.ok(!result.includes('LK01'));
  });

  it('2.6 Available products shows 5 items', async () => {
    const result = await executarTool('get_available_products', {});
    console.log('  Available:\n  ', result.replace(/\n/g, '\n  '));
    for (const prod of products) {
      assert.ok(result.includes(prod.name));
    }
  });

  it('2.7 Get my lockers shows all 5', async () => {
    const result = await executarTool('get_my_lockers', { producer_tel: PRODUCER_TEL });
    console.log('  My lockers:\n  ', result.replace(/\n/g, '\n  '));
    assert.ok(result.includes('LK01'));
    assert.ok(result.includes('LK05'));
  });

  it('2.8 Update price works', async () => {
    const result = await executarTool('update_price', { locker_id: 'LK01', price: 9.00 });
    assert.ok(result.includes('9'));
    assert.equal(getLocker().LK01.preu, 9.00);
  });

  it('2.9 Update stock works', async () => {
    const result = await executarTool('update_stock', { locker_id: 'LK01', stock: 10 });
    assert.ok(result.includes('10'));
    assert.equal(getLocker().LK01.stock, 10);
  });

  it('2.10 Cannot assign to another producer\'s locker', async () => {
    const result = await executarTool('assign_product', {
      locker_id: 'LK01',
      producer_tel: '34999888777',
      product_name: 'Intruder',
      price: 1,
      stock: 1
    });
    assert.ok(result.includes('does not exist') || result.includes('another producer'));
  });
});

// ============================================================
// TEST 3: Client purchase flow with door monitoring
// ============================================================

describe('3. Client purchase flow: buy, door, money, reputation', () => {
  before(() => {
    backupData();
    resetLocker();
    crearProductor(PRODUCER_TEL, PRODUCER_NAME);
    assignarProducte('LK01', PRODUCER_TEL, 'Mel de Romaní', 8.50, 3);
    assignarProducte('LK02', PRODUCER_TEL, 'Formatge Ovella', 12.00, 2);
  });
  after(() => restoreData());

  it('3.1 Client sees available products', async () => {
    const result = await executarTool('get_available_products', {});
    console.log('  Available:', result);
    assert.ok(result.includes('Mel'));
    assert.ok(result.includes('Formatge'));
  });

  it('3.2 Client buys from LK01 - locker opens + cron task created', async () => {
    const result = await executarTool('buy_product', {
      locker_id: 'LK01',
      client_tel: CLIENT_TEL
    });
    console.log('  Buy result:', result);
    assert.ok(result.includes('Purchase OK'));
    assert.ok(result.includes('Mel'));
    assert.ok(result.includes('8.5'));

    // Check stock reduced
    const locker = getLocker();
    assert.equal(locker.LK01.stock, 2);
  });

  it('3.3 Client JSON created with purchase in history', () => {
    const client = getClient(CLIENT_TEL);
    assert.ok(client, 'Client should exist');
    assert.equal(client.historial.length, 1);
    assert.equal(client.historial[0].producte, 'Mel de Romaní');
    assert.equal(client.historial[0].preu, 8.50);
    assert.equal(client.historial[0].confirmat, false);
    console.log('  Client history:', JSON.stringify(client.historial[0]));
  });

  it('3.4 Cron task check_door was created', () => {
    const cron = JSON.parse(readFileSync(CRON_PATH, 'utf-8'));
    const doorTask = cron.tasques.find(t => t.type === 'check_door' && t.params.locker_id === 'LK01');
    assert.ok(doorTask, 'check_door task should exist');
    assert.equal(doorTask.status, 'pending');
    assert.equal(doorTask.params.client_tel, CLIENT_TEL);
    assert.equal(doorTask.params.producer_tel, PRODUCER_TEL);
    assert.equal(doorTask.params.master_tel, MASTER_TEL);
    console.log('  Cron task:', doorTask.type, doorTask.id, 'trigger:', doorTask.triggerAt);
  });

  it('3.5 Producer confirms money -> client reputation updated', async () => {
    // Simulate: door closed, cron created confirm_money task
    addCronTask('confirm_money', 0, {
      locker_id: 'LK01',
      client_tel: CLIENT_TEL,
      producer_tel: PRODUCER_TEL,
      master_tel: MASTER_TEL,
      producte: 'Mel de Romaní',
      preu: 8.50
    });

    const result = await executarTool('confirm_payment', {
      locker_id: 'LK01',
      producer_tel: PRODUCER_TEL
    });
    console.log('  Confirm result:', result);
    assert.ok(result.includes('Payment confirmed'));
    assert.ok(result.includes('reputation'));
  });

  it('3.6 Client purchase marked as confirmed', () => {
    const client = getClient(CLIENT_TEL);
    const lastPurchase = client.historial[client.historial.length - 1];
    assert.equal(lastPurchase.confirmat, true);
    assert.equal(lastPurchase.confirmatPer, PRODUCER_TEL);
    assert.ok(lastPurchase.confirmatData);
    console.log('  Confirmed by:', lastPurchase.confirmatPer, 'at:', lastPurchase.confirmatData);
  });

  it('3.7 Client reputation is 100% after 1 confirmed purchase', () => {
    const client = getClient(CLIENT_TEL);
    assert.equal(client.reputacio, 100);
    console.log('  Reputation:', client.reputacio + '%');
  });

  it('3.8 Second purchase without confirmation -> reputation drops', async () => {
    // Buy again
    await executarTool('buy_product', { locker_id: 'LK02', client_tel: CLIENT_TEL });
    const client = getClient(CLIENT_TEL);
    assert.equal(client.historial.length, 2);

    // Check reputation via tool
    const result = await executarTool('get_client_reputation', { tel: CLIENT_TEL });
    console.log('  Reputation after 2nd (unconfirmed):', result);
    assert.ok(result.includes('50%')); // 1 confirmed out of 2
  });

  it('3.9 Client history shows both purchases', async () => {
    const result = await executarTool('get_client_history', { tel: CLIENT_TEL });
    console.log('  History:\n  ', result.replace(/\n/g, '\n  '));
    assert.ok(result.includes('Mel'));
    assert.ok(result.includes('Formatge'));
  });

  it('3.10 Cancel cron task works', () => {
    const cron = JSON.parse(readFileSync(CRON_PATH, 'utf-8'));
    const pendingTask = cron.tasques.find(t => t.status === 'pending');
    if (pendingTask) {
      const ok = cancelCronTask(pendingTask.id);
      assert.ok(ok);
      const updated = JSON.parse(readFileSync(CRON_PATH, 'utf-8'));
      const cancelled = updated.tasques.find(t => t.id === pendingTask.id);
      assert.equal(cancelled.status, 'cancelled');
      console.log('  Cancelled task:', pendingTask.id);
    } else {
      console.log('  No pending tasks to cancel');
    }
  });

  it('3.11 System prompt for client role is correct', () => {
    const prompt = getSystemPrompt('client', CLIENT_TEL);
    assert.ok(prompt.includes('CLIENT'));
    assert.ok(prompt.includes('buy_product'));
    assert.ok(prompt.includes('confirmation'));
    assert.ok(prompt.includes(CLIENT_TEL));
  });

  it('3.12 MCP exposes all expected tools', () => {
    const toolNames = TOOLS.map(t => t.function.name);
    console.log('  Tools:', toolNames.join(', '));
    const expected = [
      'get_locker_status', 'get_available_products', 'buy_product',
      'assign_product', 'release_locker', 'open_locker',
      'update_stock', 'update_price', 'create_producer',
      'get_producer_info', 'get_client_history', 'get_free_lockers',
      'get_my_lockers', 'list_producers', 'confirm_payment',
      'create_producer_from_contact', 'get_client_reputation'
    ];
    for (const name of expected) {
      assert.ok(toolNames.includes(name), `Missing tool: ${name}`);
    }
    assert.equal(toolNames.length, expected.length);
  });
});
