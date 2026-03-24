#!/bin/bash

# Script de configuració completa per dispositius Locker
# Usage: ./configurar_locker.sh <ip> <num_locker>
# Exemple: ./configurar_locker.sh 10.160.61.197 8

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuració WiFi
WIFI1_SSID="Locker"
WIFI1_PASS="TorreSerps123"
WIFI2_SSID="Hit"
WIFI2_PASS="socorro18"

if [ $# -ne 2 ]; then
    echo -e "${RED}Error: Falten paràmetres${NC}"
    echo "Usage: $0 <ip> <num_locker>"
    echo "Exemple: $0 10.160.61.197 8"
    exit 1
fi

DEVICE_IP=$1
LOCKER_NUM=$2
DEVICE_NAME="Lk$(printf "%02d" $LOCKER_NUM)"
SCRIPT_FILE="control_porta_locker.js"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CONFIGURACIÓ LOCKER ${DEVICE_NAME}${NC}"
echo -e "${BLUE}IP: $DEVICE_IP${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test connexió
echo "1. Verificant connexió..."
if ! curl -s -m 3 "http://$DEVICE_IP/rpc/Shelly.GetDeviceInfo" > /dev/null 2>&1; then
    echo -e "${RED}✗ Dispositiu offline - no es pot connectar${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dispositiu online${NC}"

# Configurar nom del dispositiu
echo "2. Configurant nom del dispositiu..."
curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/Sys.SetConfig" \
    -H "Content-Type: application/json" \
    -d '{"config":{"device":{"name":"'${DEVICE_NAME}'"}}}' > /dev/null 2>&1
echo -e "${GREEN}✓ Nom configurat: ${DEVICE_NAME}${NC}"

# Configurar WiFi 1 (Locker)
echo "3. Configurant WiFi 1 (${WIFI1_SSID})..."
curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/WiFi.SetConfig" \
    -H "Content-Type: application/json" \
    -d '{
        "config": {
            "sta": {
                "ssid": "'${WIFI1_SSID}'",
                "pass": "'${WIFI1_PASS}'",
                "enable": true,
                "ipv4mode": "dhcp"
            }
        }
    }' > /dev/null 2>&1
echo -e "${GREEN}✓ WiFi 1 configurat: ${WIFI1_SSID}${NC}"

# Configurar WiFi 2 (Hit) - backup
echo "4. Configurant WiFi 2 (${WIFI2_SSID}) com a backup..."
curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/WiFi.SetConfig" \
    -H "Content-Type: application/json" \
    -d '{
        "config": {
            "sta1": {
                "ssid": "'${WIFI2_SSID}'",
                "pass": "'${WIFI2_PASS}'",
                "enable": true,
                "ipv4mode": "dhcp"
            }
        }
    }' > /dev/null 2>&1
echo -e "${GREEN}✓ WiFi 2 configurat: ${WIFI2_SSID}${NC}"

# Obtenir perfil actual
echo "5. Verificant perfil..."
profile=$(curl -s -m 3 "http://$DEVICE_IP/rpc/Shelly.GetDeviceInfo" | python3 -c "import json,sys; print(json.load(sys.stdin).get('profile','unknown'))" 2>/dev/null)
echo "   Perfil actual: $profile"

# Canviar a switch si cal
if [ "$profile" = "cover" ]; then
    echo -e "${YELLOW}   Canviant perfil a SWITCH...${NC}"
    curl -s -m 10 -X POST "http://$DEVICE_IP/rpc/Shelly.SetProfile" \
        -H "Content-Type: application/json" \
        -d '{"name":"switch"}' > /dev/null 2>&1
    echo -e "${YELLOW}   Esperant reinici (20s)...${NC}"
    sleep 20
    echo -e "${GREEN}✓ Perfil canviat${NC}"
else
    echo -e "${GREEN}✓ Perfil correcte (switch)${NC}"
fi

# Configurar Input 0 (Sensor porta)
echo "6. Configurant Input 0 (sensor porta)..."
curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/Input.SetConfig" \
    -H "Content-Type: application/json" \
    -d '{"id":0,"config":{"type":"switch","enable":true,"invert":false}}' > /dev/null 2>&1
echo -e "${GREEN}✓ Input 0 configurat${NC}"

# Configurar Input 1 (Botó client) - tipus BUTTON
echo "7. Configurant Input 1 (botó client)..."
curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/Input.SetConfig" \
    -H "Content-Type: application/json" \
    -d '{"id":1,"config":{"type":"button","enable":true,"invert":false}}' > /dev/null 2>&1
echo -e "${GREEN}✓ Input 1 configurat (tipus: button)${NC}"

# Configurar Switch 0 (Actuador porta) - AUTO-OFF 1 segon, CURRENT_LIMIT 2A
echo "8. Configurant Switch 0 (actuador porta)..."
curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/Switch.SetConfig" \
    -H "Content-Type: application/json" \
    -d '{"id":0,"config":{"name":"'${DEVICE_NAME}'_P","in_mode":"detached","initial_state":"off","auto_on":false,"auto_off":true,"auto_off_delay":1.0,"current_limit":2.0}}' > /dev/null 2>&1
echo -e "${GREEN}✓ Switch 0 configurat (${DEVICE_NAME}_P, auto-off: 1s, current_limit: 2A)${NC}"

# Configurar Switch 1 (Llum verda) - AUTO-OFF 180 segons, CURRENT_LIMIT 2A
echo "9. Configurant Switch 1 (llum verda)..."
curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/Switch.SetConfig" \
    -H "Content-Type: application/json" \
    -d '{"id":1,"config":{"name":"'${DEVICE_NAME}'_L","in_mode":"detached","initial_state":"off","auto_on":false,"auto_off":true,"auto_off_delay":180.0,"current_limit":2.0}}' > /dev/null 2>&1
echo -e "${GREEN}✓ Switch 1 configurat (${DEVICE_NAME}_L, auto-off: 180s, current_limit: 2A)${NC}"

# Verificar si l'script existeix
if [ ! -f "$SCRIPT_FILE" ]; then
    echo -e "${RED}✗ Error: Script no trobat: $SCRIPT_FILE${NC}"
    exit 1
fi

# Llegir i escapar l'script
echo "10. Preparant script..."
SCRIPT_CODE=$(cat "$SCRIPT_FILE")
ESCAPED_CODE=$(echo "$SCRIPT_CODE" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')

# Aturar script si existeix
echo "11. Aturant script existent (si n'hi ha)..."
curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/Script.Stop" \
    -H "Content-Type: application/json" \
    -d '{"id":1}' > /dev/null 2>&1
echo -e "${GREEN}✓ Script aturat${NC}"

# Crear script
echo "12. Creant script..."
curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/Script.Create" \
    -H "Content-Type: application/json" \
    -d '{"name":"control_porta"}' > /dev/null 2>&1

# Pujar codi
echo "13. Pujant codi de l'script..."
result=$(curl -s -m 20 -X POST "http://$DEVICE_IP/rpc/Script.PutCode" \
    -H "Content-Type: application/json" \
    -d "{\"id\":1,\"code\":$ESCAPED_CODE,\"append\":false}" 2>&1)

if echo "$result" | grep -q '"len"'; then
    script_len=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin).get('len','?'))" 2>/dev/null)
    echo -e "${GREEN}✓ Script pujat correctament ($script_len bytes)${NC}"

    # Habilitar script
    echo "14. Habilitant script..."
    curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/Script.SetConfig" \
        -H "Content-Type: application/json" \
        -d '{"id":1,"config":{"enable":true}}' > /dev/null 2>&1
    echo -e "${GREEN}✓ Script habilitat${NC}"

    # Iniciar script
    echo "15. Iniciant script..."
    result=$(curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/Script.Start" \
        -H "Content-Type: application/json" \
        -d '{"id":1}' 2>&1)

    if echo "$result" | grep -q '"was_running"'; then
        echo -e "${GREEN}✓ Script activat i en execució${NC}"
    else
        echo -e "${YELLOW}⚠ Script pujat però hi ha hagut un problema iniciant-lo${NC}"
        echo "$result"
    fi
else
    echo -e "${RED}✗ Error pujant script${NC}"
    echo "$result"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓✓✓ ${DEVICE_NAME} CONFIGURAT ✓✓✓${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Configuració aplicada:"
echo "  - Nom dispositiu: ${DEVICE_NAME}"
echo "  - WiFi 1: ${WIFI1_SSID} (principal)"
echo "  - WiFi 2: ${WIFI2_SSID} (backup)"
echo "  - Input 0: Sensor porta (switch)"
echo "  - Input 1: Botó client (button)"
echo "  - Switch 0: Actuador (${DEVICE_NAME}_P, auto-off: 1s)"
echo "  - Switch 1: Llum verda (${DEVICE_NAME}_L, auto-off: 180s)"
echo "  - Script: control_porta (actiu)"
echo ""

# Mostrar configuració WiFi actual
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CONFIGURACIÓ WIFI ACTUAL${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

wifi_status=$(curl -s -m 5 "http://$DEVICE_IP/rpc/WiFi.GetStatus" 2>&1)
if [ $? -eq 0 ]; then
    echo "$wifi_status" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print('WiFi Principal (sta):')
    if 'sta_ip' in data:
        print('  - IP:', data.get('sta_ip', 'N/A'))
        print('  - SSID:', data.get('ssid', 'N/A'))
        print('  - RSSI:', data.get('rssi', 'N/A'), 'dBm')
        print('  - Estat:', 'Connectat' if data.get('status') == 'got ip' else data.get('status', 'N/A'))
    else:
        print('  - No connectat')
    print()
    print('WiFi Backup (sta1):')
    if 'sta1_ip' in data:
        print('  - IP:', data.get('sta1_ip', 'N/A'))
        print('  - SSID:', data.get('sta1_ssid', 'N/A'))
        print('  - Estat: Configurat')
    else:
        print('  - Configurat però no connectat')
except:
    print('Error processant dades WiFi')
" 2>/dev/null
else
    echo -e "${YELLOW}⚠ No s'ha pogut obtenir l'estat WiFi${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}CONFIGURACIÓ COMPLETADA!${NC}"
echo -e "${GREEN}========================================${NC}"
