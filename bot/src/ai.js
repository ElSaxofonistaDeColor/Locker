import OpenAI from 'openai';
import { getConfig } from './config.js';
import { TOOLS, executarTool, getSystemPrompt } from './mcp.js';
import { getProductor, getOrCreateClient, saveClient } from './data.js';

const cfg = getConfig();
const openai = new OpenAI({ apiKey: cfg.api.openaiApiKey });

// Sessions en memoria: tel -> { messages[], lastActivity }
const sessions = new Map();
const SESSION_TTL = 30 * 60 * 1000; // 30 min

function getSession(tel) {
  if (!sessions.has(tel)) {
    sessions.set(tel, { messages: [], lastActivity: Date.now() });
  }
  const s = sessions.get(tel);
  // Reset si ha passat massa temps
  if (Date.now() - s.lastActivity > SESSION_TTL) {
    s.messages = [];
  }
  s.lastActivity = Date.now();
  return s;
}

/**
 * Determina el rol de l'usuari
 */
function getRol(tel) {
  if (tel === cfg.admin.master) return 'master';
  if (getProductor(tel)) return 'productor';
  return 'client';
}

/**
 * Processa un missatge amb la IA (OpenAI amb tool calling)
 */
export async function processarMissatge(userTel, text) {
  const rol = getRol(userTel);
  const session = getSession(userTel);

  // Detectar/guardar idioma del client
  const client = getOrCreateClient(userTel);
  if (!client.idioma) {
    client.idioma = 'ca'; // defecte català
    saveClient(userTel, client);
  }

  // System prompt en anglès per la IA, però li diem l'idioma del client
  const systemPrompt = getSystemPrompt(rol, userTel) +
    `\n\nThe client's preferred language is: ${client.idioma}. Always reply in that language.` +
    `\nIf you detect the client is writing in a different language, switch to that language AND update their preference by mentioning it.` +
    `\nKeep responses concise and friendly. Use emojis sparingly.`;

  // Afegir missatge de l'usuari
  session.messages.push({ role: 'user', content: text });

  // Limitar historial a 20 missatges
  if (session.messages.length > 20) {
    session.messages = session.messages.slice(-20);
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...session.messages
  ];

  try {
    let response = await openai.chat.completions.create({
      model: cfg.api.openaiModel,
      messages,
      tools: TOOLS,
      tool_choice: 'auto'
    });

    let assistantMsg = response.choices[0].message;
    session.messages.push(assistantMsg);

    // Loop de tool calls (la IA pot cridar múltiples tools)
    let iterations = 0;
    while (assistantMsg.tool_calls && iterations < 5) {
      iterations++;

      for (const toolCall of assistantMsg.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await executarTool(toolCall.function.name, args);

        session.messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result
        });
      }

      // Tornar a cridar la IA amb els resultats
      response = await openai.chat.completions.create({
        model: cfg.api.openaiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...session.messages
        ],
        tools: TOOLS,
        tool_choice: 'auto'
      });

      assistantMsg = response.choices[0].message;
      session.messages.push(assistantMsg);
    }

    // Detectar canvi d'idioma
    const idiomaDetectat = detectarIdioma(text);
    if (idiomaDetectat && idiomaDetectat !== client.idioma) {
      client.idioma = idiomaDetectat;
      saveClient(userTel, client);
      console.log(`[AI] Idioma client ${userTel} canviat a: ${idiomaDetectat}`);
    }

    return assistantMsg.content || 'No he pogut processar la teva petició.';
  } catch (e) {
    console.error('[AI] Error:', e.message);
    return 'Error processant el missatge. Intenta-ho de nou.';
  }
}

/**
 * Detecció simple d'idioma
 */
function detectarIdioma(text) {
  const lower = text.toLowerCase();
  // Paraules clau per idioma
  const ca = ['vull', 'comprar', 'hola', 'què', 'preu', 'gràcies', 'sisplau', 'quant', 'tinc', 'locker'];
  const es = ['quiero', 'comprar', 'precio', 'gracias', 'cuánto', 'tengo', 'hola', 'por favor'];
  const en = ['want', 'buy', 'price', 'thanks', 'how much', 'hello', 'please', 'locker'];

  let caScore = 0, esScore = 0, enScore = 0;
  for (const w of ca) if (lower.includes(w)) caScore++;
  for (const w of es) if (lower.includes(w)) esScore++;
  for (const w of en) if (lower.includes(w)) enScore++;

  // Indicadors específics
  if (lower.includes('què') || lower.includes("l'") || lower.includes('d\'')) caScore += 3;
  if (lower.includes('ñ') || lower.includes('¿') || lower.includes('¡')) esScore += 3;
  if (lower.includes('the') || lower.includes('my') || lower.includes('i\'d')) enScore += 3;

  const max = Math.max(caScore, esScore, enScore);
  if (max === 0) return null;
  if (caScore === max) return 'ca';
  if (esScore === max) return 'es';
  return 'en';
}
