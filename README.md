# Smart Locker System

<img src="bot/LogoLocker.png" alt="LockerBot" width="400">

Sistema de lockers intel·ligents per venda de productes de proximitat via WhatsApp, controlats amb Shelly Plus 2PM.

## Estructura

```
├── bot/                  # WhatsApp LockerBot (Baileys + OpenAI)
│   ├── src/              # Codi font del bot
│   ├── data/             # JSONs (Locker, productors, clients, cron)
│   ├── test/             # 31 tests (3 escenaris)
│   └── README.md         # Documentació completa del bot
│
├── Locker/               # Configuració dels 9 lockers Shelly
│   ├── scripts/          # Scripts de control de porta i deploy
│   ├── config/           # Configuracions JSON dels dispositius
│   ├── docs/             # Documentació i inventaris
│   └── devices_inventory.json
│
├── Shelly/               # Scripts Shelly genèrics (persianes, llums)
│   ├── control_porta_*.js
│   ├── setup_shelly.sh
│   └── scan_shellys.sh
│
└── whatsappBot.md        # Referència API keys i llibreries
```

## Lockers (9 unitats)

| ID | IP | MAC |
|----|-----|-----|
| LK01 | 10.160.140.190 | 2C:BC:BB:2D:7A:34 |
| LK02 | 10.160.140.183 | 88:13:BF:D1:87:B0 |
| LK03 | 10.160.140.147 | 2C:BC:BB:3D:80:B8 |
| LK04 | 10.160.140.119 | 88:13:BF:D3:35:14 |
| LK05 | 10.160.140.126 | F8:B3:B7:BE:46:88 |
| LK06 | 10.160.140.181 | 2C:BC:BB:3D:D6:40 |
| LK07 | 10.160.140.243 | 88:13:BF:D5:6F:0C |
| LK08 | 10.160.140.195 | 20:43:A8:0A:83:68 |
| LK09 | 10.160.140.120 | F8:B3:B7:BE:47:D8 |

**Router:** 10.160.140.1 (OpenWrt, IPs fixes configurades)

## WhatsApp Bot

Bot amb IA (OpenAI tool calling) que gestiona 3 rols:
- **Master** → crea productors, control total
- **Productor** → assigna productes, gestiona stock i preus
- **Client** → compra productes, el locker s'obre automàticament

Més info: [bot/README.md](bot/README.md)

## Quick Start

```bash
cd bot
npm install
cp lockerBot.example.json lockerBot.json  # Edita amb les teves API keys
npm start                                  # Escaneja QR amb WhatsApp
npm test                                   # 31 tests
```

## Llicència

Privat - HitSystems Retail Solutions
