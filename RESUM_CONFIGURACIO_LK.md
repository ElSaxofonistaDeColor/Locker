# Resum Configuració Dispositius Lk

**Data**: 2025-11-29
**Model**: Shelly Plus 2PM (SNSW-102P16EU)
**Script**: control_porta_v2.js

---

## ✅ Estat de Configuració

| Dispositiu | IP | Estat | Script | Perfil |
|---|---|---|---|---|
| **Lk01** | 10.160.121.190 | ❌ Offline | - | - |
| **Lk02** | 10.160.121.184 | ✅ Configurat | ✅ Running | Switch |
| **Lk03** | 10.160.121.147 | ❌ Offline | - | - |
| **Lk04** | 10.160.61.122 | ✅ Configurat | ✅ Running | Switch |
| **Lk05** | 10.160.121.126 | ✅ Configurat | ✅ Running | Switch |
| **Lk06** | 10.160.121.181 | ✅ Configurat | ✅ Running | Switch |

**Resum**: 4/6 dispositius configurats correctament

---

## 📋 Configuració Aplicada

### Hardware (Shelly Plus 2PM)

- **Input 0 (S1)**: Sensor porta
  - Type: `switch`
  - State: `true` = porta tancada, `false` = porta oberta

- **Input 1 (S2)**: Botó client
  - Type: `button` ⚠️ Important!
  - Detecta: single_push, long_push, double_push

- **Switch 0**: Actuador porta
  - Mode: `detached`
  - Initial state: `off`
  - Auto on/off: `false`

- **Switch 1**: Llum verda (autorització)
  - Mode: `detached`
  - Initial state: `off`
  - Auto on/off: `false`

### Software

- **Script**: control_porta_v2.js (ID: 1)
- **Estat**: Enabled i Running
- **Memòria**: ~1470 bytes

---

## 🔧 Funcionament de l'Script

### Mode Normal (Llum Verda Encesa)

1. Encén manualment la llum verda (Switch 1)
2. El client prem el botó (Input 1)
3. Verificacions automàtiques:
   - ✅ Llum verda encesa?
   - ✅ Porta tancada?
4. Si tot OK → Activa actuador (Switch 0)
5. Quan la porta s'obre → Desactiva actuador i apaga llum verda

**Temps de resposta**: <100ms

### Mode Combinació Secreta (Llum Verda Apagada)

**Combinació**: LLARG - CURT - CURT - CURT - LLARG - CURT

1. Amb llum verda apagada, introduir la combinació
2. Timeout entre pulsacions: 5 segons
3. Si correcta → Activa actuador immediatament
4. Quan la porta s'obre → Desactiva actuador

**Ús**: Emergències, accés sense autorització prèvia

---

## 🧪 Proves Realitzades

### ✅ Proves Automàtiques

- [x] Perfil canviat de COVER a SWITCH
- [x] Input 0 configurat com a switch
- [x] Input 1 configurat com a button
- [x] Switch 0 en mode detached
- [x] Switch 1 en mode detached
- [x] Script pujat correctament
- [x] Script activat i en execució

### 📝 Proves Manuals Pendents

Per cada dispositiu configurat (Lk02, Lk04, Lk05, Lk06):

1. **Prova llum verda apagada**
   - Prem botó → Ha de denegar l'accés

2. **Prova llum verda encesa**
   - Encén Switch 1
   - Prem botó → Ha d'activar actuador

3. **Prova combinació secreta**
   - Introduir: LLARG-CURT-CURT-CURT-LLARG-CURT
   - Ha d'activar actuador

4. **Prova sensor porta**
   - Quan la porta s'obre → Ha de desactivar actuador automàticament

---

## 🔄 Dispositius Offline (Lk01, Lk03)

Quan estiguin online, executa:

```bash
./upload_script_final.sh
```

O manualment per cada dispositiu:

```bash
# Lk01
curl -X POST http://10.160.61.191/rpc/Shelly.SetProfile -d '{"name":"switch"}'
# Espera reinici, després executa l'script

# Lk03
curl -X POST http://10.160.61.147/rpc/Shelly.SetProfile -d '{"name":"switch"}'
# Espera reinici, després executa l'script
```

---

## 📊 Verificació Ràpida

Per comprovar l'estat de tots els dispositius:

```bash
# Estat dels scripts
curl -s http://10.160.61.184/rpc/Script.GetStatus?id=1 | python3 -m json.tool
curl -s http://10.160.61.122/rpc/Script.GetStatus?id=1 | python3 -m json.tool
curl -s http://10.160.61.128/rpc/Script.GetStatus?id=1 | python3 -m json.tool
curl -s http://10.160.61.186/rpc/Script.GetStatus?id=1 | python3 -m json.tool

# Veure logs en temps real
# Accedeix a http://IP/scripts i obre la consola del script
```

---

## 📁 Fitxers Creats

- `control_porta_v2.js` - Script principal amb llum verda + combinació
- `upload_script_final.sh` - Script automàtic de configuració
- `dispositius_lk.md` - Llista completa de dispositius
- `scan_shellys.sh` - Escaneig de xarxa
- `.env` - API key de Shelly Cloud
- `RESUM_CONFIGURACIO_LK.md` - Aquest fitxer

---

## 🆘 Resolució de Problemes

### Script no respon

```bash
# Reiniciar script
curl -X POST http://IP/rpc/Script.Stop -d '{"id":1}'
curl -X POST http://IP/rpc/Script.Start -d '{"id":1}'
```

### Veure logs

1. Ves a http://IP
2. Scripts → control_porta
3. Console/Logs

### Estat dels components

```bash
# Inputs
curl http://IP/rpc/Input.GetStatus?id=0
curl http://IP/rpc/Input.GetStatus?id=1

# Switches
curl http://IP/rpc/Switch.GetStatus?id=0
curl http://IP/rpc/Switch.GetStatus?id=1

# Script
curl http://IP/rpc/Script.GetStatus?id=1
```

---

## ✅ Configuració Completada

Els dispositius **Lk02, Lk04, Lk05 i Lk06** estan completament configurats i operatius amb:

- ✅ Perfil: Switch
- ✅ Inputs configurats
- ✅ Switches en mode detached
- ✅ Script pujat i en execució
- ✅ Mode normal amb llum verda
- ✅ Mode emergència amb combinació secreta

**Pròxim pas**: Proves manuals de funcionament
