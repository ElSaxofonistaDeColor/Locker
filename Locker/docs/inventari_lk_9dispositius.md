# Inventari Dispositius LK01-LK09

**Data**: 2025-12-04
**Xarxa**: Locker (10.160.121.x)
**Total dispositius**: 9

---

## Taula Resum

| Nom | IP Locker | MAC | Model | Estat |
|-----|-----------|-----|-------|-------|
| LK05 | 10.160.121.126 | F8:B3:B7:BE:46:88 | SNSW-102P16EU | ✅ |
| LK01 | 10.160.121.190 | 2C:BC:BB:2D:7A:34 | SNSW-102P16EU | ✅ |
| LK02 | 10.160.121.184 | 88:13:BF:D1:87:B0 | SNSW-102P16EU | ✅ |
| LK06 | 10.160.121.181 | 2C:BC:BB:3D:D6:40 | SNSW-102P16EU | ✅ |
| LK04 | 10.160.121.119 | 88:13:BF:D3:35:14 | SNSW-102P16EU | ✅ |
| LK08 | 10.160.121.195 | 20:43:A8:0A:83:68 | SNSW-102P16EU | ✅ |
| LK07 | 10.160.121.243 | 88:13:BF:D5:6F:0C | SNSW-102P16EU | ✅ |
| LK09 | 10.160.121.120 | F8:B3:B7:BE:47:D8 | SNSW-102P16EU | ✅ |
| LK03 | 10.160.121.147 | 2C:BC:BB:3D:80:B8 | SNSW-102P16EU | ✅ |

---

## Detall per Dispositiu

### LK01
- **IP**: 10.160.121.190
- **MAC**: 2C:BC:BB:2D:7A:34
- **ID**: shellyplus2pm-2cbcbb2d7a34
- **Model**: Shelly Plus 2 PM (SNSW-102P16EU)
- **Perfil**: Switch
- **URL**: http://10.160.121.190

### LK02
- **IP**: 10.160.121.184
- **MAC**: 88:13:BF:D1:87:B0
- **ID**: shellyplus2pm-8813bfd187b0
- **Model**: Shelly Plus 2 PM (SNSW-102P16EU)
- **Perfil**: Switch
- **URL**: http://10.160.121.184

### LK03
- **IP**: 10.160.121.147
- **MAC**: 2C:BC:BB:3D:80:B8
- **ID**: shellyplus2pm-2cbcbb3d80b8
- **Model**: Shelly Plus 2 PM (SNSW-102P16EU)
- **Perfil**: Switch
- **URL**: http://10.160.121.147

### LK04
- **IP**: 10.160.121.119
- **MAC**: 88:13:BF:D3:35:14
- **ID**: shellyplus2pm-8813bfd33514
- **Model**: Shelly Plus 2 PM (SNSW-102P16EU)
- **Perfil**: Switch
- **URL**: http://10.160.121.119

### LK05
- **IP**: 10.160.121.126
- **MAC**: F8:B3:B7:BE:46:88
- **ID**: shellyplus2pm-f8b3b7be4688
- **Model**: Shelly Plus 2 PM (SNSW-102P16EU)
- **Perfil**: Switch
- **URL**: http://10.160.121.126

### LK06
- **IP**: 10.160.121.181
- **MAC**: 2C:BC:BB:3D:D6:40
- **ID**: shellyplus2pm-2cbcbb3dd640
- **Model**: Shelly Plus 2 PM (SNSW-102P16EU)
- **Perfil**: Switch
- **URL**: http://10.160.121.181

### LK07
- **IP**: 10.160.121.243
- **MAC**: 88:13:BF:D5:6F:0C
- **ID**: shellyplus2pm-8813bfd56f0c
- **Model**: Shelly Plus 2 PM (SNSW-102P16EU)
- **Perfil**: Switch
- **URL**: http://10.160.121.243

### LK08
- **IP**: 10.160.121.195
- **MAC**: 20:43:A8:0A:83:68
- **ID**: shellyplus2pm-2043a80a8368
- **Model**: Shelly Plus 2 PM (SNSW-102P16EU)
- **Perfil**: Switch
- **URL**: http://10.160.121.195

### LK09
- **IP**: 10.160.121.120
- **MAC**: F8:B3:B7:BE:47:D8
- **ID**: shellyplus2pm-f8b3b7be47d8
- **Model**: Shelly Plus 2 PM (SNSW-102P16EU)
- **Perfil**: Switch
- **URL**: http://10.160.121.120

---

## Configuració WiFi

Tots els dispositius configurats amb:
- **WiFi 1 (sta)**: Locker (password: TorreSerps123)
- **WiFi 2 (sta1)**: Router (password: TorreSerps123)

---

## Característiques Comunes

- **Model**: Shelly Plus 2 PM (SNSW-102P16EU)
- **Generació**: Gen 2
- **Firmware**: 1.7.1 (20250924-062729/1.7.1-gd336f31)
- **Perfil**: Switch
- **Switches**: 2 (Switch 0 i Switch 1)
- **Xarxa**: 10.160.121.x (Locker)

---

## Pendents de Configuració

- [ ] Switch 0: `initial_state: off`, `auto_off: true`, `auto_off_delay: 1.0`
- [ ] Switch 1: `initial_state: off`
- [ ] Script: control_porta_lk.js amb protecció de relé
