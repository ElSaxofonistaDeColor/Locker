# Dispositius Shelly Lk

**Data**: 2025-11-28
**Total dispositius**: 6

---

## Llista Completa Lk01-Lk06

| Nom | ID | IP | Model | Online | SSID |
|-----|----|----|-------|--------|------|
| Lk01 | 2cbcbb2d7a34 | 10.160.121.190 | SNSW-102P16EU | ✅ | Router |
| Lk02 | 8813bfd187b0 | 10.160.121.184 | SNSW-102P16EU | ✅ | Router |
| Lk03 | 2cbcbb3d80b8 | 10.160.121.147 | SNSW-102P16EU | ✅ | Router |
| Lk04 | ecc9ffc123b8 | 10.160.61.122 | SNSW-102P16EU | ✅ | Router |
| Lk05 | f8b3b7be4688 | 10.160.121.126 | SNSW-102P16EU | ✅ | Router |
| Lk06 | 2cbcbb3dd640 | 10.160.121.181 | SNSW-102P16EU | ✅ | Router |

---

## Informació Detallada

### Lk01
- **ID Cloud**: 2cbcbb2d7a34
- **IP Local**: 10.160.121.190
- **Model**: Shelly Plus 1 PM (SNSW-102P16EU)
- **Generació**: Gen 2
- **Perfil**: Roller (persiana/cortina)
- **Estat**: Online ✅
- **WiFi**: Router
- **URL**: http://10.160.121.190

### Lk02
- **ID Cloud**: 8813bfd187b0
- **IP Local**: 10.160.121.184
- **Model**: Shelly Plus 1 PM (SNSW-102P16EU)
- **Generació**: Gen 2
- **Perfil**: Roller (persiana/cortina)
- **Estat**: Online ✅
- **WiFi**: Router
- **URL**: http://10.160.121.184

### Lk03
- **ID Cloud**: 2cbcbb3d80b8
- **IP Local**: 10.160.121.147
- **Model**: Shelly Plus 1 PM (SNSW-102P16EU)
- **Generació**: Gen 2
- **Perfil**: Roller (persiana/cortina)
- **Estat**: Online ✅
- **WiFi**: Router
- **URL**: http://10.160.121.147

### Lk04
- **ID Cloud**: ecc9ffc123b8
- **IP Local**: 10.160.61.122
- **Model**: Shelly Plus 1 PM (SNSW-102P16EU)
- **Generació**: Gen 2
- **Perfil**: Roller (persiana/cortina)
- **Estat**: Online ✅
- **WiFi**: Router
- **URL**: http://10.160.61.122

### Lk05
- **ID Cloud**: f8b3b7be4688
- **IP Local**: 10.160.121.126
- **Model**: Shelly Plus 1 PM (SNSW-102P16EU)
- **Generació**: Gen 2
- **Perfil**: Roller (persiana/cortina)
- **Estat**: Online ✅
- **WiFi**: Router
- **URL**: http://10.160.121.126

### Lk06
- **ID Cloud**: 2cbcbb3dd640
- **IP Local**: 10.160.121.181
- **Model**: Shelly Plus 1 PM (SNSW-102P16EU)
- **Generació**: Gen 2
- **Perfil**: Roller (persiana/cortina)
- **Estat**: Online ✅
- **WiFi**: Router
- **URL**: http://10.160.121.181

---

## Característiques Comunes

- **Model**: Tots són Shelly Plus 1 PM (SNSW-102P16EU)
- **Generació**: Gen 2
- **Configuració**: Roller/Cover (control de persianes)
- **Connectivitat**: Tots connectats a la xarxa WiFi "Router"
- **Estat**: Tots online i funcionant
- **Xarxa**: 10.160.61.x

---

## Accés Ràpid

### Via API Local (RPC)
```bash
# Obtenir estat
curl -s http://10.160.61.191/rpc/Shelly.GetStatus

# Obrir
curl -s -X POST http://10.160.61.191/rpc/Cover.Open -d '{"id":0}'

# Tancar
curl -s -X POST http://10.160.61.191/rpc/Cover.Close -d '{"id":0}'

# Parar
curl -s -X POST http://10.160.61.191/rpc/Cover.Stop -d '{"id":0}'
```

### Via Shelly Cloud API
```bash
# Utilitzant l'auth_key del fitxer .env
# Server: https://shelly-19-eu.shelly.cloud
```
