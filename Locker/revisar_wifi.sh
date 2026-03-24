#!/bin/bash

# Script per revisar la configuració WiFi d'un dispositiu Locker
# Usage: ./revisar_wifi.sh <ip>
# Exemple: ./revisar_wifi.sh 10.160.61.197

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ $# -ne 1 ]; then
    echo -e "${RED}Error: Cal especificar la IP${NC}"
    echo "Usage: $0 <ip>"
    echo "Exemple: $0 10.160.61.197"
    exit 1
fi

DEVICE_IP=$1

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CONFIGURACIÓ WIFI - ${DEVICE_IP}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test connexió
echo "Verificant connexió..."
if ! curl -s -m 3 "http://$DEVICE_IP/rpc/Shelly.GetDeviceInfo" > /dev/null 2>&1; then
    echo -e "${RED}✗ Dispositiu offline - no es pot connectar${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dispositiu online${NC}"
echo ""

# Obtenir nom del dispositiu
device_info=$(curl -s -m 5 "http://$DEVICE_IP/rpc/Shelly.GetDeviceInfo" 2>&1)
device_name=$(echo "$device_info" | python3 -c "import json,sys; print(json.load(sys.stdin).get('name', 'N/A'))" 2>/dev/null)
echo -e "${BLUE}Dispositiu: ${device_name}${NC}"
echo ""

# Obtenir configuració WiFi
echo -e "${YELLOW}=== CONFIGURACIÓ WIFI ===${NC}"
wifi_config=$(curl -s -m 5 "http://$DEVICE_IP/rpc/WiFi.GetConfig" 2>&1)
if [ $? -eq 0 ]; then
    echo "$wifi_config" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)

    print('WiFi Principal (sta):')
    sta = data.get('sta', {})
    print('  - Habilitat:', 'SÍ' if sta.get('enable', False) else 'NO')
    print('  - SSID:', sta.get('ssid', 'N/A'))
    print('  - Mode IP:', sta.get('ipv4mode', 'N/A'))
    if sta.get('ipv4mode') == 'static':
        print('  - IP estàtica:', sta.get('ip', 'N/A'))

    print()
    print('WiFi Backup (sta1):')
    sta1 = data.get('sta1', {})
    print('  - Habilitat:', 'SÍ' if sta1.get('enable', False) else 'NO')
    print('  - SSID:', sta1.get('ssid', 'N/A'))
    print('  - Mode IP:', sta1.get('ipv4mode', 'N/A'))
    if sta1.get('ipv4mode') == 'static':
        print('  - IP estàtica:', sta1.get('ip', 'N/A'))
except Exception as e:
    print('Error processant configuració WiFi:', e)
" 2>/dev/null
else
    echo -e "${RED}✗ Error obtenint configuració WiFi${NC}"
fi

echo ""
echo -e "${YELLOW}=== ESTAT WIFI ACTUAL ===${NC}"
wifi_status=$(curl -s -m 5 "http://$DEVICE_IP/rpc/WiFi.GetStatus" 2>&1)
if [ $? -eq 0 ]; then
    echo "$wifi_status" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)

    print('Connexió Activa:')
    print('  - IP:', data.get('sta_ip', 'N/A'))
    print('  - SSID:', data.get('ssid', 'N/A'))
    print('  - RSSI:', data.get('rssi', 'N/A'), 'dBm')

    # Qualitat de senyal
    rssi = data.get('rssi', -100)
    if rssi > -50:
        qualitat = 'Excel·lent'
    elif rssi > -60:
        qualitat = 'Bona'
    elif rssi > -70:
        qualitat = 'Regular'
    else:
        qualitat = 'Pobre'
    print('  - Qualitat:', qualitat)

    print('  - Estat:', data.get('status', 'N/A'))

    print()
    print('WiFi Backup:')
    if 'sta1_ip' in data and data['sta1_ip']:
        print('  - IP:', data.get('sta1_ip', 'N/A'))
        print('  - SSID:', data.get('sta1_ssid', 'N/A'))
        print('  - Estat: Disponible')
    else:
        print('  - Estat: Configurat però no connectat')

except Exception as e:
    print('Error processant estat WiFi:', e)
" 2>/dev/null
else
    echo -e "${RED}✗ Error obtenint estat WiFi${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
