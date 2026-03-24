/**
 * MCP (Model Context Protocol) for Locker Bot.
 * Exposes all available tools to the AI so it knows what it can do.
 * The AI receives the tool list and decides which to call.
 */

import {
  obrirLocker, llumLocker, estatLocker, estatTots,
  assignarProducte, alliberarLocker, reduirStock,
  lockersAmbProducte, lockersLliures, lockersDeProductor
} from './locker.js';
import {
  getLocker, saveLocker, getProductor, saveProductor, crearProductor,
  getClient, getOrCreateClient, saveClient, llistaProductors
} from './data.js';
import { addCronTask, confirmMoney } from './cron.js';
import { getConfig } from './config.js';

// All tools defined in English for the AI
export const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_locker_status',
      description: 'Get the status of all 9 lockers: which have products, stock, price, online/offline status, and which producer manages them.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_available_products',
      description: 'List all products currently available for purchase in the lockers, with price and stock.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'buy_product',
      description: 'A client wants to buy a product. Opens the locker, reduces stock, records sale, and starts monitoring: checks every minute if door is closed. If not closed in 5 min, alerts client+master. When closed, notifies producer to confirm money. ALWAYS ask for confirmation before calling this.',
      parameters: {
        type: 'object',
        properties: {
          locker_id: { type: 'string', description: 'Locker ID (LK01-LK09)' },
          client_tel: { type: 'string', description: 'Client phone number (34xxx)' }
        },
        required: ['locker_id', 'client_tel']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'assign_product',
      description: 'A producer assigns a product to a free locker. Sets name, price and stock.',
      parameters: {
        type: 'object',
        properties: {
          locker_id: { type: 'string', description: 'Locker ID (LK01-LK09)' },
          producer_tel: { type: 'string', description: 'Producer phone number (34xxx)' },
          product_name: { type: 'string', description: 'Product name' },
          price: { type: 'number', description: 'Price in euros' },
          stock: { type: 'integer', description: 'Available units' }
        },
        required: ['locker_id', 'producer_tel', 'product_name', 'price', 'stock']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'release_locker',
      description: 'A producer releases a locker they had assigned, making it free.',
      parameters: {
        type: 'object',
        properties: {
          locker_id: { type: 'string', description: 'Locker ID (LK01-LK09)' },
          producer_tel: { type: 'string', description: 'Producer phone that owns it' }
        },
        required: ['locker_id', 'producer_tel']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'open_locker',
      description: 'Physically open a locker door (activates the Shelly relay). Used for restocking or maintenance.',
      parameters: {
        type: 'object',
        properties: {
          locker_id: { type: 'string', description: 'Locker ID (LK01-LK09)' }
        },
        required: ['locker_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_stock',
      description: 'Update the stock quantity of a locker (when producer restocks).',
      parameters: {
        type: 'object',
        properties: {
          locker_id: { type: 'string', description: 'Locker ID (LK01-LK09)' },
          stock: { type: 'integer', description: 'New stock quantity' }
        },
        required: ['locker_id', 'stock']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_price',
      description: 'Update the price of a product in a locker.',
      parameters: {
        type: 'object',
        properties: {
          locker_id: { type: 'string', description: 'Locker ID (LK01-LK09)' },
          price: { type: 'number', description: 'New price in euros' }
        },
        required: ['locker_id', 'price']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_producer',
      description: 'The master creates a new authorized producer who can manage lockers. Only the master can do this.',
      parameters: {
        type: 'object',
        properties: {
          tel: { type: 'string', description: 'New producer phone number (34xxx)' },
          name: { type: 'string', description: 'Producer name' }
        },
        required: ['tel', 'name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_producer_info',
      description: 'Show information about a producer: their products and assigned lockers.',
      parameters: {
        type: 'object',
        properties: {
          tel: { type: 'string', description: 'Producer phone number' }
        },
        required: ['tel']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_client_history',
      description: 'Show the purchase history of a client.',
      parameters: {
        type: 'object',
        properties: {
          tel: { type: 'string', description: 'Client phone number' }
        },
        required: ['tel']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_free_lockers',
      description: 'List lockers that are free and available for assigning products.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_my_lockers',
      description: 'Show the lockers assigned to a specific producer.',
      parameters: {
        type: 'object',
        properties: {
          producer_tel: { type: 'string', description: 'Producer phone number' }
        },
        required: ['producer_tel']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_producers',
      description: 'List all registered producers. Only the master can use this.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'confirm_payment',
      description: 'A producer confirms they received the correct money for a purchase. This updates the client reputation. The producer should respond with OK and the locker ID.',
      parameters: {
        type: 'object',
        properties: {
          locker_id: { type: 'string', description: 'Locker ID (LK01-LK09)' },
          producer_tel: { type: 'string', description: 'Producer phone number' }
        },
        required: ['locker_id', 'producer_tel']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_producer_from_contact',
      description: 'Create a producer from a WhatsApp contact shared by the master. Extracts phone and name from the contact data.',
      parameters: {
        type: 'object',
        properties: {
          tel: { type: 'string', description: 'Phone number from contact (34xxx)' },
          name: { type: 'string', description: 'Name from contact' }
        },
        required: ['tel', 'name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_client_reputation',
      description: 'Get the reputation score of a client (percentage of confirmed purchases).',
      parameters: {
        type: 'object',
        properties: {
          tel: { type: 'string', description: 'Client phone number' }
        },
        required: ['tel']
      }
    }
  }
];

/**
 * Execute a tool called by the AI
 */
export async function executarTool(name, args) {
  console.log(`[MCP] Executing: ${name}`, args);

  switch (name) {

    case 'get_locker_status': {
      const estat = await estatTots();
      const lines = Object.entries(estat).map(([id, lk]) => {
        const status = lk.online ? '🟢' : '🔴';
        const prod = lk.producte ? `${lk.producte} (${lk.preu}€) x${lk.stock} [${lk.productor}]` : 'FREE';
        return `${status} ${id}: ${prod}`;
      });
      return lines.join('\n');
    }

    case 'get_available_products': {
      const prods = lockersAmbProducte();
      if (prods.length === 0) return 'No products available right now.';
      return prods.map(p =>
        `${p.id}: ${p.producte} — ${p.preu}€ (${p.stock} available)`
      ).join('\n');
    }

    case 'buy_product': {
      const { locker_id, client_tel } = args;
      const cfg = getConfig();
      const locker = getLocker();
      const lk = locker[locker_id];
      if (!lk) return `Error: locker ${locker_id} does not exist.`;
      if (!lk.producte || lk.stock <= 0) return `Error: locker ${locker_id} has no product available.`;

      const ok = reduirStock(locker_id);
      if (!ok) return 'Error: could not reduce stock.';

      const obert = await obrirLocker(locker_id);

      const client = getOrCreateClient(client_tel);
      client.historial.push({
        data: new Date().toISOString(),
        locker: locker_id,
        producte: lk.producte,
        preu: lk.preu,
        confirmat: false
      });
      saveClient(client_tel, client);

      // Start door monitoring cron - checks every minute for 5 minutes
      addCronTask('check_door', 1, {
        locker_id,
        client_tel,
        master_tel: cfg.admin.master,
        producer_tel: lk.productor
      });

      // Notify low stock
      const stockRestant = getLocker()[locker_id].stock;
      if (stockRestant <= 1 && lk.productor) {
        addCronTask('notify_stock', 0, { locker_id, producer_tel: lk.productor });
      }

      return `Purchase OK! Locker ${locker_id} ${obert ? 'OPENED' : '(error opening)'}. Product: ${lk.producte}. Price: ${lk.preu}€. Remaining stock: ${stockRestant}. Leave the money inside, take the product, and CLOSE the door. The system will verify automatically.`;
    }

    case 'assign_product': {
      const { locker_id, producer_tel, product_name, price, stock } = args;
      const prod = getProductor(producer_tel);
      if (!prod) return `Error: producer ${producer_tel} does not exist. Master must create it first.`;

      const locker = getLocker();
      const lk = locker[locker_id];
      if (!lk) return `Error: locker ${locker_id} does not exist.`;
      if (lk.productor && lk.productor !== producer_tel) return `Error: locker ${locker_id} is assigned to another producer.`;

      assignarProducte(locker_id, producer_tel, product_name, price, stock);

      const existent = prod.productes.find(p => p.nom === product_name);
      if (!existent) {
        prod.productes.push({ nom: product_name, preu: price, locker: locker_id });
        saveProductor(producer_tel, prod);
      }

      return `Assigned! ${locker_id} ← ${product_name} (${price}€) x${stock}. Producer: ${prod.nom}`;
    }

    case 'release_locker': {
      const { locker_id, producer_tel } = args;
      const locker = getLocker();
      const lk = locker[locker_id];
      if (!lk) return `Error: locker ${locker_id} does not exist.`;
      if (lk.productor !== producer_tel) return `Error: this locker is not yours.`;
      alliberarLocker(locker_id);
      return `Locker ${locker_id} released and now free.`;
    }

    case 'open_locker': {
      const { locker_id } = args;
      const obert = await obrirLocker(locker_id);
      return obert ? `Locker ${locker_id} OPENED!` : `Error opening locker ${locker_id}.`;
    }

    case 'update_stock': {
      const { locker_id, stock } = args;
      const locker = getLocker();
      if (!locker[locker_id]) return `Error: locker ${locker_id} does not exist.`;
      locker[locker_id].stock = stock;
      locker[locker_id].estat = stock > 0 ? 'ple' : 'buit';
      saveLocker(locker);
      return `Stock of ${locker_id} updated to ${stock}.`;
    }

    case 'update_price': {
      const { locker_id, price } = args;
      const locker = getLocker();
      if (!locker[locker_id]) return `Error: locker ${locker_id} does not exist.`;
      locker[locker_id].preu = price;
      saveLocker(locker);
      return `Price of ${locker_id} updated to ${price}€.`;
    }

    case 'create_producer': {
      const { tel, name } = args;
      if (getProductor(tel)) return `Producer ${tel} already exists.`;
      crearProductor(tel, name);
      return `Producer created: ${name} (${tel})`;
    }

    case 'get_producer_info': {
      const { tel } = args;
      const prod = getProductor(tel);
      if (!prod) return `Producer ${tel} not found.`;
      const lockers = lockersDeProductor(tel);
      let info = `Name: ${prod.nom}\nPhone: ${prod.tel}\nCreated: ${prod.creat}\n\nProducts:`;
      if (prod.productes.length === 0) info += '\n(none yet)';
      else prod.productes.forEach(p => { info += `\n- ${p.nom} (${p.preu}€) → ${p.locker}`; });
      info += `\n\nAssigned lockers: ${lockers.length}`;
      lockers.forEach(l => { info += `\n- ${l.id}: ${l.producte} x${l.stock}`; });
      return info;
    }

    case 'get_client_history': {
      const { tel } = args;
      const client = getClient(tel);
      if (!client) return `Client ${tel} not found.`;
      if (client.historial.length === 0) return `Client ${tel} has no purchases yet.`;
      let h = `Purchase history for ${tel}:\n`;
      const last = client.historial.slice(-10);
      last.forEach(c => {
        const d = new Date(c.data).toLocaleString('ca-ES', { timeZone: 'Europe/Madrid' });
        h += `\n${d} — ${c.producte} (${c.preu}€) [${c.locker}]`;
      });
      return h;
    }

    case 'get_free_lockers': {
      const lliures = lockersLliures();
      if (lliures.length === 0) return 'No free lockers available.';
      return `Free lockers: ${lliures.map(l => l.id).join(', ')}`;
    }

    case 'get_my_lockers': {
      const { producer_tel } = args;
      const lockers = lockersDeProductor(producer_tel);
      if (lockers.length === 0) return 'No lockers assigned to you.';
      return lockers.map(l =>
        `${l.id}: ${l.producte} (${l.preu}€) x${l.stock} [${l.estat}]`
      ).join('\n');
    }

    case 'list_producers': {
      const prods = llistaProductors();
      if (prods.length === 0) return 'No producers registered yet.';
      return prods.map(p => `${p.nom} (${p.tel}) — ${p.productes.length} products`).join('\n');
    }

    case 'confirm_payment': {
      const { locker_id, producer_tel } = args;
      const result = await confirmMoney(producer_tel, locker_id);
      if (!result) return `No pending payment confirmation found for locker ${locker_id}.`;
      return `Payment confirmed! Client ${result.client_tel} — ${result.producte} (${result.preu}€). Client reputation: ${result.reputacio}%`;
    }

    case 'create_producer_from_contact': {
      const { tel, name } = args;
      if (getProductor(tel)) return `Producer ${tel} already exists.`;
      crearProductor(tel, name);
      return `Producer created from contact: ${name} (${tel})`;
    }

    case 'get_client_reputation': {
      const { tel } = args;
      const client = getClient(tel);
      if (!client) return `Client ${tel} not found.`;
      const confirmed = client.historial.filter(h => h.confirmat).length;
      const total = client.historial.length;
      const rep = total > 0 ? Math.round((confirmed / total) * 100) : 0;
      return `Client ${tel}: ${total} purchases, ${confirmed} confirmed. Reputation: ${rep}%`;
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

/**
 * Generate the system prompt for the AI with role-specific instructions
 */
export function getSystemPrompt(rol, userTel) {
  const base = `You are the assistant for a Smart Locker vending system. There are 9 lockers (LK01-LK09) controlled by Shelly Plus 2PM devices.
Producers place products in lockers and clients buy them via WhatsApp.

CRITICAL: Always respond in the client's language. Check their language preference. Default is Catalan (ca).
If they write in Spanish, respond in Spanish. If English, respond in English. Any language — match it.

You have access to tools (functions) to manage the lockers. Use them when needed.
When a client wants to buy, ALWAYS show available products first and ask for confirmation before opening any locker.
Keep responses concise and WhatsApp-friendly (short paragraphs, use *bold* for emphasis).`;

  if (rol === 'master') {
    return `${base}

The user is the MASTER (system administrator). They can:
- Create new producers (create_producer)
- View status of all lockers (get_locker_status)
- Open any locker (open_locker)
- Manage the entire system
- View any client's history (get_client_history)
- List all producers (list_producers)

Their phone is ${userTel}. They have full access to everything.`;
  }

  if (rol === 'productor') {
    return `${base}

The user is a PRODUCER. They can:
- Assign their products to free lockers (assign_product)
- Update prices and stock of their lockers (update_price, update_stock)
- Open their lockers to restock (open_locker)
- Release their lockers (release_locker)
- View their lockers (get_my_lockers)

Their phone is ${userTel}. They can ONLY manage their own lockers. If they try to access another producer's locker, deny it politely.`;
  }

  // Client
  return `${base}

The user is a CLIENT. They can:
- See available products (get_available_products)
- Buy a product — the locker opens automatically (buy_product)
- View their purchase history (get_client_history)

Their phone is ${userTel}. Guide them warmly to browse and purchase.
When they want to buy, show available products, let them choose, then ask for explicit confirmation (e.g., "Yes" or "Confirm") BEFORE calling buy_product.
After purchase, tell them which locker opened and to pick up their product.`;
}
