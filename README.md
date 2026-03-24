# Control de Porta amb Shelly

Aquest projecte conté scripts per controlar l'obertura d'una porta amb un Shelly, utilitzant un botó i una llum verda com a sistema d'autorització.

## Versions Disponibles

### V1 - Mode Bàsic (`control_porta_v1.js`)
- Control amb llum verda d'autorització
- El botó només funciona si la llum verda està encesa i la porta tancada

### V2 - Amb Combinació Secreta (`control_porta_v2.js`) ⭐ ACTUAL
- **Mode Normal**: Igual que V1 - resposta instantània amb llum verda encesa
- **Mode Combinació Secreta**: Sistema d'emergència quan la llum verda està apagada
- **Combinació secreta**: LLARG-CURT-CURT-CURT-LLARG-CURT
- **Detecció intel·ligent**: Comprova l'estat de la llum verda abans de processar cada pulsació
- **Resposta immediata**: Amb llum verda encesa, obre instantàniament (com V1)
- **Timeout automàtic**: 5 segons d'inactivitat reinicia la combinació
- **Memòria optimitzada**: ~1470 bytes (només 728 bytes més que V1)

## Informació del Dispositiu

- **Model**: Shelly Plus 2PM (SNSW-102P16EU)
- **MAC**: 30C9224F8724
- **Firmware**: 1.7.1 (20250924-062729/1.7.1-gd336f31)
- **Perfil**: switch
- **IP**: 10.160.61.230 (DHCP)

### Configuració WiFi

**Xarxa WiFi (STA - Station Mode)**:
- **SSID**: Router
- **Seguretat**: WPA (protegida amb password)
- **Mode IP**: DHCP
- **Enable**: true
- **Roaming**: Activat (threshold: -80 dBm, interval: 60s)

**Punt d'Accés (AP Mode)**:
- **SSID**: ShellyPlus2PM-30C9224F8724
- **Seguretat**: Oberta (sense password)
- **Enable**: true (disponible com a fallback)

### Altres Configuracions del Sistema

- **Zona Horària**: Europe/Madrid
- **Ubicació**: 41.496400, 2.292000
- **Servidor SNTP**: time.cloudflare.com
- **BLE**: Activat (Bluetooth Low Energy)
- **Cloud**: Activat (shelly-19-eu.shelly.cloud:6022/jrpc)
- **MQTT**: Desactivat
- **Autenticació**: Desactivada
- **Debug Level**: 2

## Configuració del Hardware

### Connexions

- **Input 0 (S1)**: Sensor d'estat de la porta
  - Detecta si la porta està oberta o tancada
  - `true` (ON) = porta tancada
  - `false` (OFF) = porta oberta

- **Input 1 (S2)**: Botó d'obertura
  - Botó físic que prem el client per obrir la porta

- **Switch 0**: Actuador d'obertura
  - Controlat pel script
  - S'activa per obrir la porta
  - Es desactiva automàticament quan la porta s'obre

- **Switch 1**: Llum verda (botó amb llum)
  - Controlada manualment per tu
  - Indica quan està autoritzat l'accés
  - Quan està encesa, el botó pot obrir la porta
  - S'apaga automàticament quan la porta s'obre

## Funcionament Detallat

### Mode Normal (V1 i V2 amb llum verda encesa)

**Prerequisit**: La llum verda (Switch 1) ha d'estar encesa manualment per tu

**Flux complet:**

1. **Autorització prèvia**:
   - Tu encens manualment la llum verda (Switch 1)
   - Això indica que autoritzis l'accés del client

2. **Pulsació del botó**:
   - El client prem el botó (Input 1)
   - Pot ser una pulsació **CURTA** (ràpida) o **LLARGA** (mantenir premut >1 segon)
   - Ambdues pulsacions funcionen igual amb la llum verda encesa

3. **Detecció automàtica** (V2):
   - L'script detecta instantàniament que la llum verda està encesa
   - **NO** busca combinació secreta
   - Processa com a mode normal immediatament

4. **Verificacions de seguretat**:
   - ✅ Llum verda encesa (Switch 1 = ON)?
   - ✅ Porta tancada (Input 0 = true)?

5. **Obertura**:
   - Si totes les verificacions passen:
     - S'activa l'actuador (Switch 0 → ON)
     - El motor comença a obrir la porta
     - Temps d'obertura: depèn del motor

6. **Finalització automàtica**:
   - El sensor detecta que la porta s'ha obert (Input 0: true → false)
   - L'script desactiva l'actuador automàticament (Switch 0 → OFF)
   - L'script apaga la llum verda automàticament (Switch 1 → OFF)
   - Motiu: Protecció del motor i seguretat (requereix reautorització per cada accés)

**Temps de resposta**: <100ms des de prémer el botó fins activar l'actuador

---

### Mode Combinació Secreta (només V2, llum verda apagada)

**Prerequisit**: La llum verda (Switch 1) ha d'estar **apagada**

**Quan utilitzar-lo:**
- Emergències (llum verda no funciona)
- Accés d'urgència sense autorització prèvia
- Proves del sistema
- Manteniment

**Combinació secreta**: **LLARG - CURT - CURT - CURT - LLARG - CURT**

**Flux complet:**

1. **Inici de la combinació**:
   - Amb la llum verda apagada, prem **LLARG** (mantenir >1 segon)
   - L'script detecta que la llum està apagada
   - Afegeix "long" a la combinació: `["long"]`
   - Inicia el timer de 5 segons

2. **Continuació de la seqüència**:
   - Prem **CURT** → `["long","short"]`
   - Prem **CURT** → `["long","short","short"]`
   - Prem **CURT** → `["long","short","short","short"]`
   - Prem **LLARG** → `["long","short","short","short","long"]`
   - Cada pulsació reinicia el timer de 5 segons

3. **Última pulsació**:
   - Prem **CURT** → `["long","short","short","short","long","short"]`
   - L'script detecta que la combinació és correcta! ✅

4. **Obertura immediata**:
   - **NO** comprova la llum verda (pot estar apagada)
   - **NO** comprova l'estat de la porta (pot estar ja oberta)
   - Activa l'actuador immediatament (Switch 0 → ON)
   - La porta s'obre

5. **Finalització**:
   - Quan la porta s'obre (Input 0: true → false)
   - Desactiva l'actuador (Switch 0 → OFF)
   - Apaga la llum verda si estava encesa (Switch 1 → OFF)
   - Reinicia la combinació

**Toleràncies:**
- **Timeout entre pulsacions**: 5 segons màxim
- **Pulsació LLARGA**: >1 segon mantenir premut
- **Pulsació CURTA**: <1 segon
- **Double push**: Si fas 2 pulsacions CURTES molt ràpides, es compten com 2 CURTES individuals

**Reinici automàtic:**
- Si passen 5 segons sense prémer cap botó → Combinació reiniciada
- Si la combinació és incorrecta → Continua esperant més pulsacions
- Si fas més de 6 pulsacions → Elimina les primeres i manté les últimes 6

---

### Diagrama de Flux (V2)

```
┌─────────────────────┐
│  Pulsació detectada │
│   (LLARG o CURT)    │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────┐
│ Comprovar llum verda │
└──────────┬───────────┘
           │
     ┌─────┴─────┐
     │           │
  ENCESA      APAGADA
     │           │
     ▼           ▼
┌─────────┐  ┌──────────────┐
│  MODE   │  │ AFEGIR A     │
│ NORMAL  │  │ COMBINACIÓ   │
│ (ràpid) │  │ (timeout 5s) │
└────┬────┘  └──────┬───────┘
     │              │
     │              ▼
     │       ┌─────────────┐
     │       │ Combinació  │
     │       │ correcta?   │
     │       └──────┬──────┘
     │              │
     │         ┌────┴────┐
     │         │         │
     │        SÍ        NO
     │         │         │
     │         ▼         ▼
     │    ┌────────┐ ┌──────────┐
     │    │ OBRIR  │ │ Esperar  │
     │    │        │ │ més      │
     │    └────────┘ │ pulsaci. │
     │               └──────────┘
     │
     ▼
┌────────────────┐
│ Comprovar      │
│ porta tancada? │
└────────┬───────┘
         │
    ┌────┴────┐
    │         │
   SÍ        NO
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│ OBRIR  │ │ DENEGAT  │
└────────┘ └──────────┘
```

## Exemples de Logs

### Exemple 1: Mode Normal (Llum Verda Encesa)

**Escenari**: Client prem el botó amb la llum verda encesa i la porta tancada

```
CURT - MODE NORMAL
>>> MODE NORMAL - OBRINT PORTA
*** ACTUADOR ACTIVAT ***
*** PORTA OBERTA ***
*** ACTUADOR DESACTIVAT ***
*** LLUM VERDA APAGADA ***
```

**Temps total**: ~200-500ms

---

### Exemple 2: Mode Normal amb Pulsació Llarga

**Escenari**: Client manté premut el botó amb la llum verda encesa

```
LLARG - MODE NORMAL
>>> MODE NORMAL - OBRINT PORTA
*** ACTUADOR ACTIVAT ***
*** PORTA OBERTA ***
*** ACTUADOR DESACTIVAT ***
*** LLUM VERDA APAGADA ***
```

**Resultat**: Igual que amb pulsació curta

---

### Exemple 3: Accés Denegat (Llum Verda Apagada)

**Escenari**: Client prem el botó sense llum verda

```
CURT
["short"]
(esperant més pulsacions...)
```

**Després de 5 segons sense més pulsacions**:
- Combinació reiniciada automàticament
- No s'obre la porta

---

### Exemple 4: Accés Denegat (Porta Ja Oberta)

**Escenari**: Client prem el botó amb llum verda encesa però porta ja oberta

```
CURT - MODE NORMAL
>>> ACCES DENEGAT: Porta ja oberta
```

**Resultat**: No s'activa l'actuador (protecció)

---

### Exemple 5: Combinació Secreta Correcta

**Escenari**: Combinació secreta completa sense llum verda

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
>>> COMBINACIO SECRETA!
*** ACTUADOR ACTIVAT ***
*** PORTA OBERTA ***
*** ACTUADOR DESACTIVAT ***
*** LLUM VERDA APAGADA ***
```

**Temps total**: ~6-10 segons (depèn de la velocitat de pulsació)

---

### Exemple 6: Combinació Secreta Incorrecta

**Escenari**: Pulsacions incorrectes

```
LLARG
["long"]
LLARG
["long","long"]
CURT
["long","long","short"]
```

**Després de 5 segons**: Combinació reiniciada, no s'obre

---

### Exemple 7: Combinació amb Timeout

**Escenari**: Pulsacions correctes però massa lentes

```
LLARG
["long"]
CURT
["long","short"]
(5 segons sense prémer res)
(timeout - reinici automàtic)
```

**Resultat**: Cal tornar a començar

---

### Exemple 8: Double Push (Pulsacions Ràpides)

**Escenari**: Últimes 2 pulsacions molt ràpides

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
DOBLE
["long","short","short","short","long","short"]
>>> COMBINACIO SECRETA!
*** ACTUADOR ACTIVAT ***
```

**Nota**: El sistema detecta automàticament el double_push i el compta com 2 pulsacions curtes

---

## Instal·lació

### 1. Connectar al Shelly

1. Assegura't que el teu ordinador està a la mateixa xarxa que el Shelly
2. Obre el navegador i ves a: `http://10.160.61.230`
3. Accedeix a la interfície web del Shelly

### 2. Configurar els Inputs i Switches

Abans de pujar l'script, configura els components exactament així:

#### Input 0 (S1) - Sensor Porta
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

#### Input 1 (S2) - Botó Client
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
**IMPORTANT**: L'Input 1 ha de ser tipus `"button"`, no `"switch"`, perquè generi els events correctes!

#### Switch 0 - Actuador Porta
```json
{
  "id": 0,
  "name": null,
  "in_mode": "detached",
  "initial_state": "off",
  "auto_on": false,
  "auto_off": false,
  "power_limit": 2800,
  "voltage_limit": 280,
  "current_limit": 10.0
}
```

#### Switch 1 - Llum Verda
```json
{
  "id": 1,
  "name": null,
  "in_mode": "detached",
  "initial_state": "off",
  "auto_on": false,
  "auto_off": false,
  "power_limit": 2800,
  "voltage_limit": 280,
  "current_limit": 10.0
}
```

### 3. Pujar l'Script

#### Opció A: V2 amb Combinació Secreta (Recomanat)

1. A la interfície web del Shelly, ves a **Scripts**
2. Fes clic a **Add Script** o **Nou Script**
3. Copia el contingut del fitxer `control_porta_v2.js`
4. Enganxa'l a l'editor de scripts
5. Guarda l'script
6. **Activa l'script** perquè s'executi

**Configuració de l'Script V2**:
```json
{
  "id": 1,
  "name": "control_porta",
  "enable": true
}
```

L'script V2 utilitzarà aproximadament 1400 bytes de memòria quan s'executi.

#### Opció B: V1 Mode Bàsic

Utilitza el fitxer `control_porta_v1.js` si no necessites la combinació secreta.
Memòria utilitzada: ~742 bytes.

### 4. Verificació

Després de pujar l'script, pots veure els logs a la consola de scripts per verificar que funciona:

**V1:**
```
SCRIPT CONTROL PORTA ACTIU (DEBUG MODE)
Input 0: Sensor porta (true=tancada, false=oberta)
Input 1: Boto client
Output 0: Actuador porta
Output 1: Llum verda
```

**V2:**
```
SCRIPT CONTROL PORTA V2 ACTIU
Input 0: Sensor porta (true=tancada, false=oberta)
Input 1: Boto client
Output 0: Actuador porta
Output 1: Llum verda
Combinacio secreta: LLARG-CURT-CURT-CURT-LLARG-CURT
```

## Proves

### Prova 1: Llum verda apagada
1. Assegura't que la llum verda (Switch 1) està apagada
2. Prem el botó (Input 1)
3. **Resultat esperat**: No passa res, als logs veuràs "ACCES DENEGAT: Llum verda apagada"

### Prova 2: Llum verda encesa, porta tancada
1. Activa la llum verda (Switch 1)
2. Assegura't que la porta està tancada (Input 0 = true)
3. Prem el botó (Input 1)
4. **Resultat esperat**:
   - L'actuador (Switch 0) s'activa
   - La porta s'obre
   - Quan el sensor detecta l'obertura (Input 0 canvia a false), l'actuador i la llum verda s'apaguen automàticament

### Prova 3: Llum verda encesa, porta ja oberta
1. Activa la llum verda (Switch 1)
2. Assegura't que la porta ja està oberta (Input 0 = false)
3. Prem el botó (Input 1)
4. **Resultat esperat**: No passa res, als logs veuràs "ACCES DENEGAT: Porta ja oberta"

### Prova 4: Combinació secreta (només V2)
1. **NO** activis la llum verda (deixa-la apagada)
2. Prem la combinació: LLARG-CURT-CURT-CURT-LLARG-CURT (en menys de 5 segons)
3. **Resultat esperat**:
   - Als logs veuràs "COMBINACIO SECRETA CORRECTA!"
   - L'actuador s'activa immediatament
   - La porta s'obre encara que la llum verda estigui apagada

### Prova 5: Combinació secreta amb timeout (només V2)
1. Prem: LLARG-CURT-CURT
2. Espera més de 5 segons **sense prémer res**
3. **Resultat esperat**:
   - Als logs veuràs "Timeout - Reiniciant combinació per inactivitat"
   - La combinació es reinicia automàticament
4. Si després prems: CURT-LLARG-CURT
5. **Resultat**: No s'obre la porta (la combinació s'ha reiniciat)

## Ajustaments

La configuració actual dels components:

```javascript
// Input 0 (S1): Sensor porta (true=tancada, false=oberta)
// Input 1 (S2): Botó client
// Switch 0 (Output 0): Actuador porta
// Switch 1 (Output 1): Llum verda
```

Si els teus components estan connectats de manera diferent, modifica els IDs al codi de l'script.

### Modificar la Combinació Secreta (V2)

Per canviar la combinació secreta, edita aquesta línia al codi de `control_porta_v2.js`:

```javascript
let combinacioSecreta = ["long", "short", "short", "short", "long", "short"];
```

Valors possibles:
- `"long"` - Pulsació llarga (mantenir premut)
- `"short"` - Pulsació curta (pulsació ràpida)

### Modificar el Timeout (V2)

Per canviar el temps màxim entre pulsacions (per defecte 5 segons):

```javascript
let TIMEOUT_COMBINACIO = 5000; // Valor en mil·lisegons
```

## Seguretat

**Mode Normal:**
- El sistema requereix que la llum verda (Switch 1) estigui encesa per permetre l'obertura
- La porta només s'obre si està tancada (Input 0 = true) (evita cicles repetitius)
- L'actuador (Switch 0) es desactiva automàticament quan la porta s'obre (protecció del motor)
- La llum verda s'apaga automàticament després de cada obertura (requereix reautorització manual per cada accés)

**Combinació Secreta (V2):**
- La combinació secreta bypassa TOTES les comprovacions de seguretat
- Només usar en emergències o quan el sistema normal falla
- Recomanat: Canvia la combinació periòdicament per seguretat
- La combinació NO es mostra als logs per evitar divulgació accidental

## Solució de Problemes

### L'script no respon al botó
- Verifica que l'Input 1 està configurat com a `button`
- Comprova els logs per veure si detecta l'esdeveniment
- Assegura't que l'script està activat

### L'actuador no es desactiva
- Verifica que l'Input 0 detecta correctament l'estat de la porta
- Comprova la connexió del sensor de porta
- Revisa els logs per veure si detecta el canvi d'estat

### La llum verda no funciona
- Assegura't que el Switch 1 està en mode desacoblat (detached)
- Controla'l manualment des de la interfície web per verificar

### La porta s'obre sense prémer el botó
- Verifica que no hi ha cap switch activat manualment
- Comprova que l'script està carregat i executant-se al Shelly
- Revisa els logs de l'script per veure si hi ha events inesperats

## Restaurar Configuració Completa

Si necessites restaurar la configuració exacta, pots utilitzar aquestes comandes via API:

### Configurar Input 1 com a Button (CRÍTIC)
```bash
curl -X POST http://10.160.61.230/rpc/Input.SetConfig \
  -H "Content-Type: application/json" \
  -d '{"id":1,"config":{"type":"button","enable":true}}'
```

### Configurar Switches en Mode Detached
```bash
# Switch 0 (Actuador)
curl -X POST http://10.160.61.230/rpc/Switch.SetConfig \
  -d '{"id":0,"config":{"in_mode":"detached","initial_state":"off"}}'

# Switch 1 (Llum Verda)
curl -X POST http://10.160.61.230/rpc/Switch.SetConfig \
  -d '{"id":1,"config":{"in_mode":"detached","initial_state":"off"}}'
```

### Verificar Configuració Actual
```bash
# Veure tots els inputs
curl -X POST http://10.160.61.230/rpc/Input.GetConfig -d '{"id":0}'
curl -X POST http://10.160.61.230/rpc/Input.GetConfig -d '{"id":1}'

# Veure tots els switches
curl -X POST http://10.160.61.230/rpc/Switch.GetConfig -d '{"id":0}'
curl -X POST http://10.160.61.230/rpc/Switch.GetConfig -d '{"id":1}'

# Veure estat de l'script
curl -X POST http://10.160.61.230/rpc/Script.GetStatus -d '{"id":1}'
```

## Referències

- [Shelly Scripts Tutorial](https://shelly-api-docs.shelly.cloud/gen2/Scripts/Tutorial/)
- [Shelly Input API](https://shelly-api-docs.shelly.cloud/gen2/ComponentsAndServices/Input/)
- [Shelly Switch API](https://shelly-api-docs.shelly.cloud/gen2/ComponentsAndServices/Switch/)
- [Shelly Script Examples (GitHub)](https://github.com/ALLTERCO/shelly-script-examples)
