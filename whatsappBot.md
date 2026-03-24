# WhatsApp Bot - Referència depeBot

## API Keys

- **OpenAI:** (see lockerBot.json or .env)
- **Google Gemini:** (see lockerBot.json or .env)
- **Models:** `gpt-4.1-nano` (OpenAI), `gemini-2.0-flash` (Gemini)

## Llibreria WhatsApp

**`@whiskeysockets/baileys`** (de `@whiskeysockets/baileys` via GitHub)

```javascript
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestWaWebVersion
} from '@whiskeysockets/baileys';
```

## Multi-idioma

- Detecció automàtica de l'idioma del client via IA (camp `idioma_detectat`)
- Idioma base: Català (`ca`)
- Traducció dinàmica amb `getTextos(idioma)` — si no és català, tradueix via OpenAI i cacheja
- Generació de missatges en qualsevol idioma amb `generarMissatgeConfirmacio(idioma)`
- Suporta qualsevol idioma ISO 639-1

## Àudio a text

- Funció: `transcriureAudio(audioBuffer, mimetype)`
- Usa **Google Gemini File API** per transcriure
- Puja l'àudio a Google, transcriu amb Gemini, esborra el fitxer temporal
- Prompt: *"Transcribe this audio to text in its ORIGINAL language. Do NOT translate."*
- Gestió de quota exhaurida amb missatge de fallback
- Reacciona amb 🎧 mentre processa
