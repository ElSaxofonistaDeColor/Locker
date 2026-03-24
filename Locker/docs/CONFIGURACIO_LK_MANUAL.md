# Configuració Manual Dispositius Lk01-Lk06

**Data**: 2025-11-28
**Model**: Shelly Plus 1 PM (SNSW-102P16EU)
**Problema detectat**: Els dispositius estan en mode ROLLER (persianes) i necessiten canviar a mode SWITCH

---

## ⚠️ IMPORTANT

Els dispositius Lk són **Shelly Plus 1 PM** que només tenen **1 switch** (no 2 com el Plus 2PM).

Per tant, **NO poden utilitzar** l'script `control_porta_v2.js` que necessita 2 switches (actuador + llum verda).

Utilitza l'script `control_porta_lk.js` que està adaptat per 1 switch.

---

## Dispositius a Configurar

| Nom | IP | ID Cloud |
|-----|----|----|
| Lk01 | 10.160.121.190 | 2cbcbb2d7a34 |
| Lk02 | 10.160.121.184 | 8813bfd187b0 |
| Lk03 | 10.160.121.147 | 2cbcbb3d80b8 |
| Lk04 | 10.160.61.122 | ecc9ffc123b8 |
| Lk05 | 10.160.121.126 | f8b3b7be4688 |
| Lk06 | 10.160.121.181 | 2cbcbb3dd640 |

---

## Pas 1: Accedir a la Interfície Web

Per cada dispositiu:

1. Obre el navegador
2. Ves a: `http://10.160.61.XXX` (la IP del dispositiu)
3. Si no respon, comprova:
   - Que estàs a la mateixa xarxa WiFi ("Router")
   - Que el dispositiu està online al Shelly Cloud
   - Prova accedir via Shelly Cloud App

---

## Pas 2: Canviar Perfil de COVER a SWITCH

**Via Interfície Web:**

1. Ves a **Settings** → **Device**
2. Busca **Device Profile** o **Perfil del Dispositiu**
3. Canvia de **"Cover"** a **"Switch"**
4. Guarda i **reinicia** el dispositiu
5. Espera ~30 segons que el dispositiu es reiniciï

**Via API (si tens accés HTTP):**

```bash
curl -X POST http://10.160.61.XXX/rpc/Shelly.SetProfile \
  -H "Content-Type: application/json" \
  -d '{"name":"switch"}'
```

---

## Pas 3: Configurar Inputs

Un cop el dispositiu estigui en mode SWITCH:

### Input 0 - Sensor Porta

```bash
curl -X POST http://10.160.61.XXX/rpc/Input.SetConfig \
  -H "Content-Type: application/json" \
  -d '{"id":0,"config":{"type":"switch","enable":true,"invert":false}}'
```

**Via Interfície Web:**
1. Ves a **Settings** → **Inputs** → **Input 0**
2. Type: **Switch**
3. Enable: **✓**
4. Invert: **✗**

### Input 1 - Botó Client

```bash
curl -X POST http://10.160.61.XXX/rpc/Input.SetConfig \
  -H "Content-Type: application/json" \
  -d '{"id":1,"config":{"type":"button","enable":true,"invert":false}}'
```

**Via Interfície Web:**
1. Ves a **Settings** → **Inputs** → **Input 1**
2. Type: **Button** ⚠️ **IMPORTANT!**
3. Enable: **✓**
4. Invert: **✗**

---

## Pas 4: Configurar Switch (Actuador)

### Switch 0 - Mode Detached

```bash
curl -X POST http://10.160.61.XXX/rpc/Switch.SetConfig \
  -H "Content-Type: application/json" \
  -d '{"id":0,"config":{"in_mode":"detached","initial_state":"off","auto_on":false,"auto_off":false}}'
```

**Via Interfície Web:**
1. Ves a **Settings** → **Outputs** → **Switch 0**
2. Input Mode: **Detached** ⚠️ **IMPORTANT!**
3. Initial State: **Off**
4. Auto On: **✗**
5. Auto Off: **✗**

---

## Pas 5: Pujar l'Script

### Via Interfície Web (RECOMANAT)

1. Ves a **Scripts**
2. Clica **Add Script** o **Create Script**
3. Nom: `control_porta`
4. Copia tot el contingut del fitxer `control_porta_lk.js`
5. Enganxa'l a l'editor
6. Clica **Save**
7. **Activa l'script** (toggle switch a ON)
8. Clica **Start**

### Via API

```bash
# 1. Crear l'script
curl -X POST http://10.160.61.XXX/rpc/Script.Create \
  -H "Content-Type: application/json" \
  -d '{"name":"control_porta"}'

# 2. Pujar el codi (veure script upload_script_api.sh)

# 3. Activar
curl -X POST http://10.160.61.XXX/rpc/Script.SetConfig \
  -H "Content-Type: application/json" \
  -d '{"id":1,"config":{"enable":true}}'

# 4. Iniciar
curl -X POST http://10.160.61.XXX/rpc/Script.Start \
  -H "Content-Type: application/json" \
  -d '{"id":1}'
```

---

## Pas 6: Verificar Funcionament

### Comprovar Logs

1. Ves a **Scripts** → **control_porta**
2. Clica **Console** o **Logs**
3. Hauries de veure:

```
========================================
SCRIPT CONTROL PORTA LK ACTIU
========================================
Model: Shelly Plus 1 PM
Input 0: Sensor porta (true=tancada, false=oberta)
Input 1: Boto client
Output 0: Actuador porta
Combinacio secreta: LLARG-CURT-CURT-CURT-LLARG-CURT
========================================
```

### Provar la Combinació Secreta

1. Prem la combinació: **LLARG-CURT-CURT-CURT-LLARG-CURT**
2. Als logs hauries de veure:
```
LLARG
["long"]
CURT
["long","short"]
CURT
["long","short","short"]
CURT
["long","short","short","short"]
LLARG
["long","short","short","short","long"]
CURT
["long","short","short","short","long","short"]
>>> COMBINACIO SECRETA CORRECTA!
*** ACTUADOR ACTIVAT ***
```

---

## Diferències amb l'Script V2

| Característica | control_porta_v2.js | control_porta_lk.js |
|---|---|---|
| Model | Plus 2PM (2 switches) | Plus 1PM (1 switch) |
| Llum verda | Switch 1 | ❌ No disponible |
| Mode normal | Llum verda encesa | ❌ No disponible |
| Combinació secreta | ✅ | ✅ |
| Actuador | Switch 0 | Switch 0 |

**⚠️ ATENCIÓ**: Els dispositius Lk **NOMÉS funcionen amb combinació secreta** perquè no tenen switch per la llum verda.

---

## Resolució de Problemes

### No puc accedir a http://10.160.61.XXX

**Solució**:
1. Verifica que estàs connectat a la xarxa WiFi "Router"
2. Prova fer ping: `ping 10.160.61.XXX`
3. Accedeix via l'app Shelly Cloud
4. Comprova la IP actual al Cloud

### L'script no funciona

**Verificacions**:
1. El perfil és "switch" (no "cover")?
2. L'Input 1 és tipus "button" (no "switch")?
3. El Switch 0 està en mode "detached"?
4. L'script està activat i en execució?
5. Hi ha errors als logs?

### El sensor de porta no funciona

**Verificacions**:
1. L'Input 0 detecta correctament l'estat?
2. Comprova: `curl http://10.160.61.XXX/rpc/Input.GetStatus?id=0`
3. Hauria de mostrar `"state": true` (tancada) o `"state": false` (oberta)

---

## Script Automàtic (si tens accés HTTP)

Si aconsegueixes accedir a les IPs locals, pots utilitzar:

```bash
./upload_to_lk_v2.sh
```

Aquest script farà automàticament tots els passos per tots els dispositius.

---

## Referències

- [Shelly Scripts Tutorial](https://shelly-api-docs.shelly.cloud/gen2/Scripts/Tutorial/)
- [Script API Documentation](https://shelly-api-docs.shelly.cloud/gen2/ComponentsAndServices/Script/)
- Fitxer local: `control_porta_lk.js`
- Script d'upload: `upload_to_lk_v2.sh`
