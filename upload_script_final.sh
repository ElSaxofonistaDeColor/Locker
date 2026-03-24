#!/bin/bash

# Script per configurar Shelly Plus 2PM amb control de porta V2
# Dispositius: Lk01-Lk06

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Llegir i escapar l'script
echo "Preparant script..."
SCRIPT_CODE=$(cat control_porta_v2.js)
ESCAPED_CODE=$(echo "$SCRIPT_CODE" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')

configure_device() {
    local name=$1
    local ip=$2

    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Configurant $name ($ip)${NC}"
    echo -e "${BLUE}========================================${NC}"

    # Test connexió
    if ! curl -s -m 3 "http://$ip/rpc/Shelly.GetDeviceInfo" > /dev/null 2>&1; then
        echo -e "${RED}✗ Dispositiu offline - saltant${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ Dispositiu online${NC}"

    # Obtenir perfil actual
    profile=$(curl -s -m 3 "http://$ip/rpc/Shelly.GetDeviceInfo" | python3 -c "import json,sys; print(json.load(sys.stdin).get('profile','unknown'))" 2>/dev/null)
    echo "Perfil actual: $profile"

    # Canviar a switch si cal
    if [ "$profile" = "cover" ]; then
        echo -e "${YELLOW}Canviant perfil a SWITCH...${NC}"
        curl -s -m 10 -X POST "http://$ip/rpc/Shelly.SetProfile" \
            -H "Content-Type: application/json" \
            -d '{"name":"switch"}' > /dev/null 2>&1
        echo -e "${YELLOW}Esperant reinici (20s)...${NC}"
        sleep 20
        echo -e "${GREEN}✓ Perfil canviat${NC}"
    fi

    # Configurar Input 0 (Sensor porta)
    echo "Configurant Input 0 (sensor porta)..."
    curl -s -m 5 -X POST "http://$ip/rpc/Input.SetConfig" \
        -H "Content-Type: application/json" \
        -d '{"id":0,"config":{"type":"switch","enable":true,"invert":false}}' > /dev/null 2>&1
    echo -e "${GREEN}✓ Input 0 configurat${NC}"

    # Configurar Input 1 (Botó client) - IMPORTANT: tipus BUTTON
    echo "Configurant Input 1 (botó client)..."
    curl -s -m 5 -X POST "http://$ip/rpc/Input.SetConfig" \
        -H "Content-Type: application/json" \
        -d '{"id":1,"config":{"type":"button","enable":true,"invert":false}}' > /dev/null 2>&1
    echo -e "${GREEN}✓ Input 1 configurat (tipus: button)${NC}"

    # Configurar Switch 0 (Actuador porta)
    echo "Configurant Switch 0 (actuador)..."
    curl -s -m 5 -X POST "http://$ip/rpc/Switch.SetConfig" \
        -H "Content-Type: application/json" \
        -d '{"id":0,"config":{"in_mode":"detached","initial_state":"off","auto_on":false,"auto_off":false}}' > /dev/null 2>&1
    echo -e "${GREEN}✓ Switch 0 configurat (mode detached)${NC}"

    # Configurar Switch 1 (Llum verda)
    echo "Configurant Switch 1 (llum verda)..."
    curl -s -m 5 -X POST "http://$ip/rpc/Switch.SetConfig" \
        -H "Content-Type: application/json" \
        -d '{"id":1,"config":{"in_mode":"detached","initial_state":"off","auto_on":false,"auto_off":false}}' > /dev/null 2>&1
    echo -e "${GREEN}✓ Switch 1 configurat (mode detached)${NC}"

    # Crear script
    echo "Creant script..."
    curl -s -m 5 -X POST "http://$ip/rpc/Script.Create" \
        -H "Content-Type: application/json" \
        -d '{"name":"control_porta"}' > /dev/null 2>&1

    # Pujar codi
    echo "Pujant codi de l'script..."
    result=$(curl -s -m 20 -X POST "http://$ip/rpc/Script.PutCode" \
        -H "Content-Type: application/json" \
        -d "{\"id\":1,\"code\":$ESCAPED_CODE,\"append\":false}" 2>&1)

    if echo "$result" | grep -q '"len"'; then
        echo -e "${GREEN}✓ Script pujat correctament${NC}"

        # Habilitar script
        curl -s -m 5 -X POST "http://$ip/rpc/Script.SetConfig" \
            -H "Content-Type: application/json" \
            -d '{"id":1,"config":{"enable":true}}' > /dev/null 2>&1

        # Iniciar script
        result=$(curl -s -m 5 -X POST "http://$ip/rpc/Script.Start" \
            -H "Content-Type: application/json" \
            -d '{"id":1}' 2>&1)

        if echo "$result" | grep -q '"was_running"'; then
            echo -e "${GREEN}✓ Script activat i en execució${NC}"
        fi
    else
        echo -e "${RED}✗ Error pujant script${NC}"
        echo "$result"
    fi

    echo -e "${GREEN}✓✓✓ $name completat ✓✓✓${NC}"
}

# Configurar tots els dispositius
echo -e "${BLUE}======================================"
echo "CONFIGURACIÓ DISPOSITIUS LK (Plus 2PM)"
echo "Total: 9 dispositius"
echo "======================================${NC}"

configure_device "Lk01" "10.160.61.192"
configure_device "Lk02" "10.160.61.186"
configure_device "Lk03" "10.160.61.148"
configure_device "Lk04" "10.160.61.123"
configure_device "Lk05" "10.160.121.126"
configure_device "Lk06" "10.160.61.184"
configure_device "Lk07" "10.160.61.247"
configure_device "Lk08" "10.160.61.197"
configure_device "Lk09" "10.160.61.122"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}PROCÉS COMPLETAT${NC}"
echo -e "${GREEN}========================================${NC}"
