# Sistema de Control de Porta LOCKER

## Descripció

Sistema de control de portes per caselles (lockers) basat en dispositius Shelly Plus 2PM.
Cada dispositiu controla l'obertura d'una porta mitjançant un actuador electromagnètic, amb llum verda indicadora i combinació secreta d'emergència.

## Dispositius

Total: 9 dispositius Shelly Plus 2PM (Model: SNSW-102P16EU)

| Nom  | IP            | MAC            | Firmware | Estat  |
|------|---------------|----------------|----------|--------|
| Lk01 | 10.160.61.192 | 2CBCBB2D7A34   | 1.7.1    | Online |
| Lk02 | 10.160.61.186 | 8813BFD187B0   | 1.7.1    | Online |
| Lk03 | 10.160.61.148 | -              | -        | Offline|
| Lk04 | 10.160.61.123 | -              | -        | Offline|
| Lk05 | 10.160.61.128 | F8B3B7BE4688   | 1.7.1    | Online |
| Lk06 | 10.160.61.184 | -              | -        | Offline|
| Lk07 | 10.160.61.247 | 8813BFD56F0C   | 1.7.1    | Online |
| Lk08 | 10.160.61.197 | 2043A80A8368   | 1.7.1    | Online |
| Lk09 | 10.160.61.122 | F8B3B7BE47D8   | 1.7.1    | Online |

## Configuració de Xarxa

### WiFi
- **SSID Principal**: "Locker"
- **SSID Secundari**: "Router"
- **Mode IP**: DHCP
- **Roaming**: Activat (RSSI threshold: -80 dBm, interval: 60s)

### Access Point
- **SSID**: ShellyPlus2PM-[MAC]
- **Estat**: Desactivat
- **Seguretat**: Obert (quan activat)

## Configuració Hardware

### Input 0 - Sensor Porta
- **Tipus**: Switch
- **Funció**: Detecta si la porta està oberta o tancada
- **Estat**: true = tancada, false = oberta
- **Invertit**: No
- **Activat**: Sí

### Input 1 - Botó Client
- **Tipus**: Button
- **Funció**: Botó per obrir la porta (requereix llum verda)
- **Modes suportats**: single_push, long_push, double_push
- **Invertit**: No
- **Activat**: Sí

### Switch 0 - Actuador Porta
- **Nom**: Lk[XX]_P (exemple: Lk07_P)
- **Funció**: Controla l'actuador electromagnètic
- **Mode**: Detached (controlat per script)
- **Estat inicial**: OFF
- **Auto-OFF**: Activat (1 segon)
  - Protecció del relé: desactiva automàticament després d'1 segon
- **Límits**:
  - Potència: 2800W
  - Voltatge: 280V
  - Corrent: 10A

### Switch 1 - Llum Verda
- **Nom**: Lk[XX]_L (exemple: Lk07_L)
- **Funció**: Indicador visual d'accés permès
- **Mode**: Detached (controlat per script i manualment)
- **Estat inicial**: OFF
- **Auto-OFF**: Desactivat
- **Límits**: Iguals al Switch 0

## Funcionament del Sistema

### Mode Normal (amb Llum Verda)
1. El personal autoritzat activa la llum verda (manualment o remotament)
2. El client prem el botó (Input 1)
3. L'script verifica:
   - Llum verda està encesa
   - Porta està tancada
4. Si les condicions es compleixen:
   - Activa l'actuador (Switch 0) durant 1 segon
   - Quan detecta que la porta s'ha obert, desactiva l'actuador i apaga la llum verda

### Mode Emergència (Combinació Secreta)
- **Combinació**: LLARG - CURT - CURT - CURT - LLARG - CURT
- **Timeout**: 5 segons entre pulsacions
- **Funcionament**:
  - No requereix llum verda
  - El client introdueix la combinació correcta
  - L'script obre la porta directament

### Events de Botó Suportats
- **single_push**: Pulsació curta normal
- **long_push**: Pulsació llarga
- **double_push**: Doble pulsació (comptat com 2x CURT)
- **btn_down**: Event de botó premut (processat com pulsació normal)

## Arxius del Sistema

### Scripts
- `control_porta_locker.js` - Script principal de control (optimitzat, 6633 bytes)

### Configuracions
- `lk07_device_info.json` - Informació del dispositiu LK07 (referència)
- `lk07_full_config.json` - Configuració completa LK07
- `lk07_wifi_config.json` - Configuració WiFi
- `lk07_wifi_status.json` - Estat actual WiFi
- `lk07_input0_config.json` - Configuració Input 0 (Sensor porta)
- `lk07_input1_config.json` - Configuració Input 1 (Botó)
- `lk07_switch0_config.json` - Configuració Switch 0 (Actuador)
- `lk07_switch1_config.json` - Configuració Switch 1 (Llum verda)

### Inventaris
- `devices_inventory.txt` - Inventari dispositius (format text)
- `devices_inventory.json` - Inventari dispositius (format JSON)

## Paràmetres de Configuració Estàndard

### Input 0 (Sensor Porta)
```json
{
  "id": 0,
  "type": "switch",
  "enable": true,
  "invert": false
}
```

### Input 1 (Botó Client)
```json
{
  "id": 1,
  "type": "button",
  "enable": true,
  "invert": false
}
```

### Switch 0 (Actuador)
```json
{
  "id": 0,
  "name": "Lk[XX]_P",
  "in_mode": "detached",
  "initial_state": "off",
  "auto_on": false,
  "auto_off": true,
  "auto_off_delay": 1.0,
  "power_limit": 2800,
  "voltage_limit": 280,
  "current_limit": 10.0
}
```

### Switch 1 (Llum Verda)
```json
{
  "id": 1,
  "name": "Lk[XX]_L",
  "in_mode": "detached",
  "initial_state": "off",
  "auto_on": false,
  "auto_off": false,
  "power_limit": 2800,
  "voltage_limit": 280,
  "current_limit": 10.0
}
```

## Script de Control

### Variables de Configuració
```javascript
let CONFIG = {
  INPUT_PORTA: 0,        // Sensor estat porta
  INPUT_BOTO: 1,         // Botó client
  SWITCH_LLUM_VERDA: 1,  // Llum verda
  SWITCH_ACTUADOR: 0     // Actuador porta
};

let combinacioSecreta = ["long", "short", "short", "short", "long", "short"];
let TIMEOUT_COMBINACIO = 5000; // 5 segons
```

### Funcions Principals
- `llumVerdaEncesa(callback)` - Verifica si la llum verda està encesa
- `checkPortaTancada(callback)` - Verifica si la porta està tancada
- `activarActuador()` - Activa l'actuador per obrir la porta
- `desactivarActuador()` - Desactiva l'actuador
- `apagarLlumVerda()` - Apaga la llum verda
- `comprovarCombinacio()` - Verifica la combinació secreta
- `afegirPulsacio(tipus)` - Afegeix pulsació a la combinació actual
- `processarPulsacioBoto()` - Processa pulsació normal amb llum verda

## Procediment d'Instal·lació

### 1. Configuració Inicial del Dispositiu
```bash
# Canviar perfil a switch (si està en mode cover)
curl -X POST "http://[IP]/rpc/Shelly.SetProfile" \
  -H "Content-Type: application/json" \
  -d '{"name":"switch"}'

# Esperar reinici (20 segons)
```

### 2. Configurar Inputs
```bash
# Input 0 - Sensor porta
curl -X POST "http://[IP]/rpc/Input.SetConfig" \
  -H "Content-Type: application/json" \
  -d '{"id":0,"config":{"type":"switch","enable":true,"invert":false}}'

# Input 1 - Botó client
curl -X POST "http://[IP]/rpc/Input.SetConfig" \
  -H "Content-Type: application/json" \
  -d '{"id":1,"config":{"type":"button","enable":true,"invert":false}}'
```

### 3. Configurar Switches
```bash
# Switch 0 - Actuador
curl -X POST "http://[IP]/rpc/Switch.SetConfig" \
  -H "Content-Type: application/json" \
  -d '{"id":0,"config":{"in_mode":"detached","initial_state":"off","auto_on":false,"auto_off":false}}'

# Switch 1 - Llum verda
curl -X POST "http://[IP]/rpc/Switch.SetConfig" \
  -H "Content-Type: application/json" \
  -d '{"id":1,"config":{"in_mode":"detached","initial_state":"off","auto_on":false,"auto_off":false}}'
```

### 4. Pujar Script
```bash
# Crear script
curl -X POST "http://[IP]/rpc/Script.Create" \
  -H "Content-Type: application/json" \
  -d '{"name":"control_porta"}'

# Pujar codi (usar Python per escapar correctament)
python3 upload_script.py [IP]

# Habilitar i iniciar script
curl -X POST "http://[IP]/rpc/Script.SetConfig" \
  -H "Content-Type: application/json" \
  -d '{"id":1,"config":{"enable":true}}'

curl -X POST "http://[IP]/rpc/Script.Start" \
  -H "Content-Type: application/json" \
  -d '{"id":1}'
```

## Troubleshooting

### La porta no s'obre
1. Verificar que la llum verda està encesa
2. Verificar que el sensor de porta detecta "tancada" (state=true)
3. Revisar logs del script via WebSocket: `ws://[IP]/debug/log`

### L'actuador no es desactiva
- L'auto-off de Switch 0 està configurat a 1 segon
- El script també desactiva l'actuador quan detecta porta oberta
- Verificar que el sensor de porta funciona correctament

### La combinació secreta no funciona
1. Verificar que no hagin passat més de 5 segons entre pulsacions
2. La combinació és: LLARG - CURT - CURT - CURT - LLARG - CURT
3. Revisar logs per veure la combinació actual introduïda

## Manteniment

### Logs en Temps Real
```bash
# Connectar via WebSocket
wscat -c ws://[IP]/debug/log

# O usar Python script
python3 monitor_logs.py [IP]
```

### Backup Configuració
```bash
# Guardar configuració completa
curl "http://[IP]/rpc/Shelly.GetConfig" > backup_[NAME].json

# Restaurar (no disponible via RPC, cal fer manualment)
```

### Actualització Script
```bash
# Aturar script
curl -X POST "http://[IP]/rpc/Script.Stop" -d '{"id":1}'

# Pujar nova versió
python3 upload_script.py [IP]

# Iniciar script
curl -X POST "http://[IP]/rpc/Script.Start" -d '{"id":1}'
```

## Seguretat

- **Autenticació**: Actualment desactivada (auth_en: false)
- **Accés Wi-Fi**: Protegit per PSK (no inclosa en documentació)
- **Combinació Secreta**: Només personal autoritzat
- **Access Point**: Desactivat per defecte

## Notes Tècniques

- Firmware: 1.7.1 (20250924-062729/1.7.1-gd336f31)
- Generació: Gen 2
- Model: SNSW-102P16EU (Shelly Plus 2PM)
- Límit màxim script: ~8000 bytes (script actual: 6633 bytes)
- Protecció relé: Auto-off a 1 segon per evitar sobrecalentament

## Data de Creació
2025-12-04

## Autor
Sistema configurat per Claude Code
