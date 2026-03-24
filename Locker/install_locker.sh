#!/bin/bash

# Script d'instal·lació automatitzada per dispositius Locker
# Usage: ./install_locker.sh <nom_dispositiu> <ip>
# Exemple: ./install_locker.sh Lk08 10.160.61.197

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ $# -ne 2 ]; then
    echo -e "${RED}Error: Falten paràmetres${NC}"
    echo "Usage: $0 <nom_dispositiu> <ip>"
    echo "Exemple: $0 Lk08 10.160.61.197"
    exit 1
fi

DEVICE_NAME=$1
DEVICE_IP=$2
SCRIPT_FILE="control_porta_locker.js"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Instal·lació dispositiu $DEVICE_NAME${NC}"
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

# Obtenir perfil actual
echo "2. Verificant perfil..."
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
echo "3. Configurant Input 0 (sensor porta)..."
curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/Input.SetConfig" \
    -H "Content-Type: application/json" \
    -d '{"id":0,"config":{"type":"switch","enable":true,"invert":false}}' > /dev/null 2>&1
echo -e "${GREEN}✓ Input 0 configurat${NC}"

# Configurar Input 1 (Botó client) - IMPORTANT: tipus BUTTON
echo "4. Configurant Input 1 (botó client)..."
curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/Input.SetConfig" \
    -H "Content-Type: application/json" \
    -d '{"id":1,"config":{"type":"button","enable":true,"invert":false}}' > /dev/null 2>&1
echo -e "${GREEN}✓ Input 1 configurat (tipus: button)${NC}"

# Configurar Switch 0 (Actuador porta) - CURRENT_LIMIT 2A
echo "5. Configurant Switch 0 (actuador)..."
curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/Switch.SetConfig" \
    -H "Content-Type: application/json" \
    -d '{"id":0,"config":{"name":"'${DEVICE_NAME}'_P","in_mode":"detached","initial_state":"off","auto_on":false,"auto_off":true,"auto_off_delay":1.0,"current_limit":2.0}}' > /dev/null 2>&1
echo -e "${GREEN}✓ Switch 0 configurat (${DEVICE_NAME}_P, auto-off: 1s, current_limit: 2A)${NC}"

# Configurar Switch 1 (Llum verda) - CURRENT_LIMIT 2A
echo "6. Configurant Switch 1 (llum verda)..."
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
echo "7. Preparant script..."
SCRIPT_CODE=$(cat "$SCRIPT_FILE")
ESCAPED_CODE=$(echo "$SCRIPT_CODE" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')

# Aturar script si existeix
echo "8. Aturant script existent (si n'hi ha)..."
curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/Script.Stop" \
    -H "Content-Type: application/json" \
    -d '{"id":1}' > /dev/null 2>&1
echo -e "${GREEN}✓ Script aturat${NC}"

# Crear script
echo "9. Creant script..."
curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/Script.Create" \
    -H "Content-Type: application/json" \
    -d '{"name":"control_porta"}' > /dev/null 2>&1

# Pujar codi
echo "10. Pujant codi de l'script..."
result=$(curl -s -m 20 -X POST "http://$DEVICE_IP/rpc/Script.PutCode" \
    -H "Content-Type: application/json" \
    -d "{\"id\":1,\"code\":$ESCAPED_CODE,\"append\":false}" 2>&1)

if echo "$result" | grep -q '"len"'; then
    script_len=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin).get('len','?'))" 2>/dev/null)
    echo -e "${GREEN}✓ Script pujat correctament ($script_len bytes)${NC}"

    # Habilitar script
    echo "11. Habilitant script..."
    curl -s -m 5 -X POST "http://$DEVICE_IP/rpc/Script.SetConfig" \
        -H "Content-Type: application/json" \
        -d '{"id":1,"config":{"enable":true}}' > /dev/null 2>&1
    echo -e "${GREEN}✓ Script habilitat${NC}"

    # Iniciar script
    echo "12. Iniciant script..."
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
echo -e "${GREEN}✓✓✓ $DEVICE_NAME COMPLETAT ✓✓✓${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Configuració aplicada:"
echo "  - Input 0: Sensor porta (switch)"
echo "  - Input 1: Botó client (button)"
echo "  - Switch 0: Actuador (${DEVICE_NAME}_P, auto-off: 1s, current_limit: 2A)"
echo "  - Switch 1: Llum verda (${DEVICE_NAME}_L, auto-off: 180s, current_limit: 2A)"
echo "  - Script: control_porta (actiu)"
echo ""
