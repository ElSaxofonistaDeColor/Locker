# LockerBot - WhatsApp Smart Locker

<img src="LogoLocker.png" alt="LockerBot" width="500">

Bot de WhatsApp per vendre productes de proximitat via lockers intel·ligents Shelly Plus 2PM.

## Com funciona

```
Productor → posa productes al locker → Client compra via WhatsApp → Locker s'obre → Recull producte
```

### Rols

| Rol | Qui | Què pot fer |
|-----|-----|-------------|
| **Master** | Admin (34627582130) | Crear productors, veure-ho tot, obrir qualsevol locker |
| **Productor** | Enviat per contacte | Assignar productes, actualitzar preus/stock, obrir els seus lockers |
| **Client** | Qualsevol | Veure productes, comprar, historial |

### Flux de compra

```
1. Client escriu al bot → veu productes disponibles
2. Tria producte → confirma compra
3. Locker s'obre automàticament (Shelly relay)
4. Client deixa diners, agafa producte, tanca porta
5. Bot verifica cada minut si la porta s'ha tancat
6. Si no es tanca en 5 min → alerta al client i master
7. Quan es tanca → avisa al productor
8. Productor confirma diners → s'apunta reputació al client
```

## Arquitectura

```
bot/
├── src/
│   ├── index.js           # Entry point
│   ├── config.js          # Config loader (lockerBot.json)
│   ├── data.js            # CRUD per JSONs (Locker, Prod_*, Client_*)
│   ├── locker.js          # Control Shelly (obrir, llum, estat)
│   ├── mcp.js             # MCP tools per la IA (17 tools)
│   ├── ai.js              # OpenAI amb tool calling
│   ├── cron.js            # Timer cada minut (check_door, confirm_money)
│   └── whatsapp/
│       ├── client.js      # Connexió Baileys
│       └── handlers.js    # Gestió missatges + contactes + àudio
├── data/
│   ├── Locker.json        # 9 posicions LK01-LK09
│   ├── Prod_34xxx.json    # Per productor
│   ├── Client_34xxx.json  # Per client (historial, idioma, reputació)
│   └── cron.json          # Tasques pendents
├── test/
│   └── bot.test.js        # 3 escenaris de test
├── lockerBot.json         # Config principal
└── LogoLocker.png
```

## MCP Tools (17)

La IA té accés a 17 funcions via tool calling:

| Tool | Descripció |
|------|------------|
| `get_locker_status` | Estat de tots els lockers |
| `get_available_products` | Productes per comprar |
| `buy_product` | Comprar + obrir locker + cron monitorització |
| `assign_product` | Productor assigna producte a locker |
| `release_locker` | Alliberar locker |
| `open_locker` | Obrir porta físicament |
| `update_stock` | Actualitzar stock |
| `update_price` | Actualitzar preu |
| `create_producer` | Crear productor |
| `create_producer_from_contact` | Crear des de contacte WhatsApp |
| `get_producer_info` | Info productor |
| `get_my_lockers` | Lockers d'un productor |
| `list_producers` | Llista productors |
| `get_client_history` | Historial compres |
| `get_client_reputation` | Reputació client |
| `confirm_payment` | Productor confirma diners |
| `get_free_lockers` | Lockers lliures |

## Instal·lació

```bash
cd bot
npm install
```

## Iniciar

```bash
npm start
```

Primera vegada: apareix QR per escanejar amb WhatsApp.

## Tests

```bash
npm test                                          # Tots
node --test --test-name-pattern='1\.' test/bot.test.js  # Test 1
node --test --test-name-pattern='2\.' test/bot.test.js  # Test 2
node --test --test-name-pattern='3\.' test/bot.test.js  # Test 3
```

## Lockers

| ID | IP | Shelly |
|----|-----|--------|
| LK01 | 10.160.140.190 | Plus 2PM |
| LK02 | 10.160.140.183 | Plus 2PM |
| LK03 | 10.160.140.147 | Plus 2PM |
| LK04 | 10.160.140.119 | Plus 2PM |
| LK05 | 10.160.140.126 | Plus 2PM |
| LK06 | 10.160.140.181 | Plus 2PM |
| LK07 | 10.160.140.243 | Plus 2PM |
| LK08 | 10.160.140.195 | Plus 2PM |
| LK09 | 10.160.140.120 | Plus 2PM |

## Llicència

Privat - HitSystems Retail Solutions
