# Configuració de Referència - Dispositius Locker (LK)

**Data de captura**: 2025-11-30
**Dispositiu de referència**: LK01 (10.160.61.192)
**Model**: Shelly Plus 2PM (SNSW-102P16EU)
**Firmware**: 1.7.1 (20250924-062729/1.7.1-gd336f31)

---

## 1. Informació del Dispositiu

```json
{
    "name": "LK01",
    "id": "shellyplus2pm-2cbcbb2d7a34",
    "mac": "2CBCBB2D7A34",
    "model": "SNSW-102P16EU",
    "gen": 2,
    "fw_id": "20250924-062729/1.7.1-gd336f31",
    "ver": "1.7.1",
    "app": "Plus2PM",
    "profile": "switch"
}
```

### Característiques Clau
- **Generació**: Gen 2
- **Perfil**: Switch (2 sortides independents)
- **Autenticació**: Desactivada (`auth_en: false`)
- **Cloud**: Connectat a `shelly-19-eu.shelly.cloud:6022/jrpc`

---

## 2. Configuració del Sistema

### 2.1 Localització
```json
{
    "tz": "Europe/Madrid",
    "lat": 41.4964,
    "lon": 2.292
}
```

### 2.2 SNTP (Sincronització de temps)
```json
{
    "server": "time.cloudflare.com"
}
```

### 2.3 Mode Eco i Descobriment
```json
{
    "eco_mode": false,
    "discoverable": true
}
```

---

## 3. Configuració de Switches

### Switch 0 (Pujar - _P)
```json
{
    "id": 0,
    "name": "Lk01_P",
    "in_mode": "detached",
    "in_locked": false,
    "initial_state": "off",
    "auto_on": false,
    "auto_on_delay": 60.0,
    "auto_off": false,
    "auto_off_delay": 60.0,
    "power_limit": 2800,
    "voltage_limit": 280,
    "undervoltage_limit": 0,
    "autorecover_voltage_errors": false,
    "current_limit": 10.0,
    "reverse": false
}
```

### Switch 1 (Baixar - _L)
```json
{
    "id": 1,
    "name": "Lk01_L",
    "in_mode": "detached",
    "in_locked": false,
    "initial_state": "off",
    "auto_on": false,
    "auto_on_delay": 60.0,
    "auto_off": false,
    "auto_off_delay": 60.0,
    "power_limit": 2800,
    "voltage_limit": 280,
    "undervoltage_limit": 0,
    "autorecover_voltage_errors": false,
    "current_limit": 10.0,
    "reverse": false
}
```

### Paràmetres Importants dels Switches
- **in_mode**: `detached` - Els inputs no controlen directament els relés
- **initial_state**: `off` - Estat inicial després de reinici
- **power_limit**: 2800W - Límit de potència màxima
- **voltage_limit**: 280V - Límit de voltatge
- **current_limit**: 10.0A - Límit de corrent

---

## 4. Configuració d'Inputs

### Input 0 (Switch)
```json
{
    "id": 0,
    "name": null,
    "type": "switch",
    "enable": true,
    "invert": false,
    "factory_reset": true
}
```

### Input 1 (Button)
```json
{
    "id": 1,
    "name": null,
    "type": "button",
    "enable": true,
    "invert": false,
    "factory_reset": true
}
```

---

## 5. Connectivitat

### 5.1 WiFi
```json
{
    "sta": {
        "ssid": "Router",
        "is_open": false,
        "enable": true,
        "ipv4mode": "dhcp",
        "ip": null,
        "netmask": null,
        "gw": null,
        "nameserver": null
    },
    "ap": {
        "ssid": "ShellyPlus2PM-2CBCBB2D7A34",
        "is_open": true,
        "enable": false
    },
    "roam": {
        "rssi_thr": -80,
        "interval": 60
    }
}
```

**Configuració WiFi Clau:**
- Connectat a xarxa `Router`
- Mode DHCP activat
- AP mode desactivat
- Roaming: RSSI threshold -80 dBm, interval 60s

### 5.2 Cloud
```json
{
    "enable": true,
    "server": "shelly-19-eu.shelly.cloud:6022/jrpc"
}
```

**Estat**: Connectat i operatiu

### 5.3 MQTT
```json
{
    "enable": false,
    "server": null,
    "client_id": "shellyplus2pm-2cbcbb2d7a34",
    "rpc_ntf": true,
    "status_ntf": false,
    "enable_rpc": true,
    "enable_control": true
}
```

**Estat**: Desactivat (no s'utilitza)

### 5.4 Bluetooth (BLE)
```json
{
    "enable": false,
    "rpc": {
        "enable": true
    }
}
```

**Estat**: BLE desactivat, però RPC via BLE disponible

---

## 6. Scripts

### Script Actiu: control_porta
```json
{
    "id": 1,
    "name": "control_porta",
    "enable": true
}
```

**Important**: Aquest script gestiona la lògica de control dels lockers
- Veure fitxer: `control_porta_lk.js`

---

## 7. Actualitzacions de Firmware

### Estat Actual
- **Firmware Version**: 1.7.1
- **Firmware ID**: 20250924-062729/1.7.1-gd336f31
- **Available Updates**: Cap actualització pendent

### Política d'Actualitzacions
**NOTA IMPORTANT**: La configuració d'actualitzacions automàtiques no està exposada directament via API local. S'ha de configurar manualment via:
1. **App Shelly** → Configuració del dispositiu → Actualitzacions
2. **Shelly Cloud** → Configuració del grup
3. **Web Interface** del dispositiu → Settings → Firmware

**Recomanació**: Desactivar les actualitzacions automàtiques en entorns de producció per evitar interrupcions i provar les noves versions en un dispositiu de test primer.

---

## 8. Estat del Sistema (Referència)

```json
{
    "mac": "2CBCBB2D7A34",
    "restart_required": false,
    "uptime": 308,
    "ram_size": 249328,
    "ram_free": 127372,
    "ram_min_free": 116432,
    "fs_size": 393216,
    "fs_free": 106496,
    "available_updates": {},
    "utc_offset": 3600
}
```

### Recursos del Sistema
- **RAM Total**: 244 KB
- **RAM Lliure**: ~124 KB
- **Sistema de Fitxers**: 384 KB total, ~104 KB lliure
- **Offset UTC**: +1h (Europa/Madrid)

---

## 9. Patró de Nomenclatura

### Dispositius
- Format: `LkXX` on XX va de 01 a 09
- Exemple: LK01, LK02, ... LK09

### Switches
- **Switch 0**: `LkXX_P` (Pujar/Up)
- **Switch 1**: `LkXX_L` (Baixar/Down)

### Exemples
```
LK01:
  - switch:0 → "Lk01_P"
  - switch:1 → "Lk01_L"

LK05:
  - switch:0 → "Lk05_P"
  - switch:1 → "Lk05_L"
```

---

## 10. Comandes d'API Útils

### Obtenir informació del dispositiu
```bash
curl -s "http://DEVICE_IP/rpc/Shelly.GetDeviceInfo" | python3 -m json.tool
```

### Obtenir configuració completa
```bash
curl -s "http://DEVICE_IP/rpc/Shelly.GetConfig" | python3 -m json.tool
```

### Obtenir estat
```bash
curl -s "http://DEVICE_IP/rpc/Shelly.GetStatus" | python3 -m json.tool
```

### Configurar nom de switch
```bash
curl -s -X POST "http://DEVICE_IP/rpc/Switch.SetConfig" \
  -H "Content-Type: application/json" \
  -d '{"id":0,"config":{"name":"LkXX_P"}}'
```

### Activar/Desactivar switch
```bash
# Activar
curl -s -X POST "http://DEVICE_IP/rpc/Switch.Set" \
  -d '{"id":0,"on":true}'

# Desactivar
curl -s -X POST "http://DEVICE_IP/rpc/Switch.Set" \
  -d '{"id":0,"on":false}'
```

### Comprovar actualitzacions
```bash
curl -s "http://DEVICE_IP/rpc/Shelly.CheckForUpdate" | python3 -m json.tool
```

---

## 11. Checklist per a Noves Instal·lacions

### Pas 1: Configuració Inicial
- [ ] Connectar el dispositiu a la xarxa WiFi "Router"
- [ ] Verificar connexió Cloud (shelly-19-eu.shelly.cloud)
- [ ] Configurar zona horària: Europe/Madrid
- [ ] Assignar nom del dispositiu: LkXX

### Pas 2: Configuració de Switches
- [ ] Configurar switch 0 amb nom `LkXX_P`
- [ ] Configurar switch 1 amb nom `LkXX_L`
- [ ] Verificar `in_mode: detached`
- [ ] Verificar `initial_state: off`
- [ ] Verificar límits de potència (2800W)

### Pas 3: Configuració de Inputs
- [ ] Input 0: type=switch, enable=true
- [ ] Input 1: type=button, enable=true
- [ ] Factory reset: activat per ambdós

### Pas 4: Script de Control
- [ ] Carregar script `control_porta_lk.js`
- [ ] Habilitar script (enable=true)
- [ ] Verificar funcionament

### Pas 5: Verificació Final
- [ ] Provar switch 0 (pujar)
- [ ] Provar switch 1 (baixar)
- [ ] Verificar connectivitat Cloud
- [ ] Comprovar que apareix al grup "Locker"

### Pas 6: Documentació
- [ ] Registrar IP assignada
- [ ] Registrar MAC address
- [ ] Afegir al fitxer de dispositius

---

## 12. Configuració Completa (JSON)

Per obtenir la configuració completa del dispositiu:

```bash
curl -s "http://10.160.61.192/rpc/Shelly.GetConfig" > lk_reference_config.json
```

Fitxer generat: Veure configuració completa a continuació o al fitxer adjunt.

### Configuració Completa
```json
{
    "ble": {
        "enable": false,
        "rpc": {
            "enable": true
        }
    },
    "cloud": {
        "enable": true,
        "server": "shelly-19-eu.shelly.cloud:6022/jrpc"
    },
    "input:0": {
        "id": 0,
        "name": null,
        "type": "switch",
        "enable": true,
        "invert": false,
        "factory_reset": true
    },
    "input:1": {
        "id": 1,
        "name": null,
        "type": "button",
        "enable": true,
        "invert": false,
        "factory_reset": true
    },
    "mqtt": {
        "enable": false,
        "server": null,
        "client_id": "shellyplus2pm-2cbcbb2d7a34",
        "user": null,
        "ssl_ca": null,
        "topic_prefix": "shellyplus2pm-2cbcbb2d7a34",
        "rpc_ntf": true,
        "status_ntf": false,
        "use_client_cert": false,
        "enable_rpc": true,
        "enable_control": true
    },
    "script:1": {
        "id": 1,
        "name": "control_porta",
        "enable": true
    },
    "switch:0": {
        "id": 0,
        "name": "Lk01_P",
        "in_mode": "detached",
        "in_locked": false,
        "initial_state": "off",
        "auto_on": false,
        "auto_on_delay": 60.0,
        "auto_off": false,
        "auto_off_delay": 60.0,
        "power_limit": 2800,
        "voltage_limit": 280,
        "undervoltage_limit": 0,
        "autorecover_voltage_errors": false,
        "current_limit": 10.0,
        "reverse": false
    },
    "switch:1": {
        "id": 1,
        "name": "Lk01_L",
        "in_mode": "detached",
        "in_locked": false,
        "initial_state": "off",
        "auto_on": false,
        "auto_on_delay": 60.0,
        "auto_off": false,
        "auto_off_delay": 60.0,
        "power_limit": 2800,
        "voltage_limit": 280,
        "undervoltage_limit": 0,
        "autorecover_voltage_errors": false,
        "current_limit": 10.0,
        "reverse": false
    },
    "sys": {
        "device": {
            "name": "LK01",
            "mac": "2CBCBB2D7A34",
            "fw_id": "20250924-062729/1.7.1-gd336f31",
            "discoverable": true,
            "eco_mode": false,
            "profile": "switch",
            "addon_type": null
        },
        "location": {
            "tz": "Europe/Madrid",
            "lat": 41.4964,
            "lon": 2.292
        },
        "debug": {
            "level": 2,
            "file_level": null,
            "mqtt": {
                "enable": false
            },
            "websocket": {
                "enable": false
            },
            "udp": {
                "addr": null
            }
        },
        "ui_data": {},
        "rpc_udp": {
            "dst_addr": null,
            "listen_port": null
        },
        "sntp": {
            "server": "time.cloudflare.com"
        },
        "cfg_rev": 23
    },
    "wifi": {
        "ap": {
            "ssid": "ShellyPlus2PM-2CBCBB2D7A34",
            "is_open": true,
            "enable": false,
            "range_extender": {
                "enable": false
            }
        },
        "sta": {
            "ssid": "Router",
            "is_open": false,
            "enable": true,
            "ipv4mode": "dhcp",
            "ip": null,
            "netmask": null,
            "gw": null,
            "nameserver": null
        },
        "sta1": {
            "ssid": null,
            "is_open": true,
            "enable": false,
            "ipv4mode": "dhcp",
            "ip": null,
            "netmask": null,
            "gw": null,
            "nameserver": null
        },
        "roam": {
            "rssi_thr": -80,
            "interval": 60
        }
    },
    "ws": {
        "enable": false,
        "server": null,
        "ssl_ca": "ca.pem"
    }
}
```

---

## 13. Notes Addicionals

### Seguretat
- Autenticació desactivada (entorn de xarxa interna controlada)
- Cloud habilitat per gestió remota
- MQTT desactivat (no necessari)

### Rendiment
- Uptime estable
- Recursos de RAM suficients (~50% lliure)
- Sistema de fitxers amb espai disponible

### Manteniment
- Revisar logs periòdicament
- Monitoritzar disponibilitat Cloud
- Fer backup dels scripts abans d'actualitzar

---

**Fi del Document de Referència**
