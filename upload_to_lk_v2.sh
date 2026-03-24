#!/bin/bash

# Script per configurar i carregar l'script de control als dispositius Lk
# Versió compatible amb bash 3.x (macOS)

# Colors per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Llegir el codi de l'script
SCRIPT_CODE=$(cat control_porta_v2.js)

# Escapar el codi JavaScript per JSON
ESCAPED_CODE=$(echo "$SCRIPT_CODE" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')

echo "======================================"
echo "CONFIGURACIÓ DISPOSITIUS SHELLY LK"
echo "======================================"
echo ""

# Funció per configurar un dispositiu
configure_device() {
    local device_name=$1
    local ip=$2

    echo -e "${YELLOW}Processing $device_name ($ip)${NC}"
    echo "---"

    # 1. Obtenir informació del dispositiu
    echo "1. Obtenint informació del dispositiu..."
    device_info=$(curl -s -m 5 "http://$ip/rpc/Shelly.GetDeviceInfo" 2>/dev/null)

    if [ $? -ne 0 ] || [ -z "$device_info" ]; then
        echo -e "${RED}   ✗ ERROR: No es pot connectar amb $device_name${NC}"
        echo ""
        return 1
    fi

    echo -e "${GREEN}   ✓ Connectat${NC}"

    # Verificar el perfil actual
    profile=$(echo "$device_info" | python3 -c "import json,sys; data=json.load(sys.stdin); print(data.get('profile','unknown'))" 2>/dev/null)
    echo "   Perfil actual: $profile"

    # Si està en mode cover, canviar a switch
    if [ "$profile" = "cover" ]; then
        echo "   Canviant perfil de COVER a SWITCH..."
        result=$(curl -s -m 10 -X POST "http://$ip/rpc/Shelly.SetProfile" \
            -H "Content-Type: application/json" \
            -d '{"name":"switch"}' 2>/dev/null)

        if echo "$result" | grep -q '"name":"switch"'; then
            echo -e "${GREEN}   ✓ Perfil canviat a SWITCH${NC}"
            echo -e "${YELLOW}   ⚠ REINICI REQUERIT - esperant 15 segons...${NC}"
            sleep 15
        else
            echo -e "${RED}   ✗ Error canviant perfil${NC}"
        fi
    fi

    # 2. Configurar Input 0 (Sensor porta)
    echo "2. Configurant Input 0 (Sensor porta)..."
    result=$(curl -s -m 5 -X POST "http://$ip/rpc/Input.SetConfig" \
        -H "Content-Type: application/json" \
        -d '{"id":0,"config":{"type":"switch","enable":true,"invert":false}}' 2>/dev/null)

    if echo "$result" | grep -q '"restart_required":true'; then
        echo -e "${YELLOW}   ⚠ Reinici requerit per Input 0${NC}"
    else
        echo -e "${GREEN}   ✓ Input 0 configurat${NC}"
    fi

    # 3. Configurar Input 1 (Botó client)
    echo "3. Configurant Input 1 (Botó client)..."
    result=$(curl -s -m 5 -X POST "http://$ip/rpc/Input.SetConfig" \
        -H "Content-Type: application/json" \
        -d '{"id":1,"config":{"type":"button","enable":true,"invert":false}}' 2>/dev/null)

    if echo "$result" | grep -q '"restart_required":true'; then
        echo -e "${YELLOW}   ⚠ Reinici requerit per Input 1${NC}"
    else
        echo -e "${GREEN}   ✓ Input 1 configurat${NC}"
    fi

    # 4. Configurar Switch 0 (Actuador)
    echo "4. Configurant Switch 0 (Actuador)..."
    result=$(curl -s -m 5 -X POST "http://$ip/rpc/Switch.SetConfig" \
        -H "Content-Type: application/json" \
        -d '{"id":0,"config":{"in_mode":"detached","initial_state":"off","auto_on":false,"auto_off":false}}' 2>/dev/null)

    if echo "$result" | grep -q '"restart_required":true'; then
        echo -e "${YELLOW}   ⚠ Reinici requerit per Switch 0${NC}"
    else
        echo -e "${GREEN}   ✓ Switch 0 configurat${NC}"
    fi

    # 5. Configurar Switch 1 (Llum verda)
    echo "5. Configurant Switch 1 (Llum verda)..."
    result=$(curl -s -m 5 -X POST "http://$ip/rpc/Switch.SetConfig" \
        -H "Content-Type: application/json" \
        -d '{"id":1,"config":{"in_mode":"detached","initial_state":"off","auto_on":false,"auto_off":false}}' 2>/dev/null)

    if echo "$result" | grep -q '"restart_required":true'; then
        echo -e "${YELLOW}   ⚠ Reinici requerit per Switch 1${NC}"
    else
        echo -e "${GREEN}   ✓ Switch 1 configurat${NC}"
    fi

    # 6. Pujar l'script
    echo "6. Pujant script de control..."

    # Crear l'script si no existeix
    curl -s -m 5 -X POST "http://$ip/rpc/Script.Create" \
        -H "Content-Type: application/json" \
        -d '{"name":"control_porta"}' 2>/dev/null > /dev/null

    # Pujar el codi
    result=$(curl -s -m 15 -X POST "http://$ip/rpc/Script.PutCode" \
        -H "Content-Type: application/json" \
        -d "{\"id\":1,\"code\":$ESCAPED_CODE,\"append\":false}" 2>/dev/null)

    if echo "$result" | grep -q '"len"'; then
        echo -e "${GREEN}   ✓ Script pujat correctament${NC}"

        # 7. Activar l'script
        echo "7. Activant script..."
        curl -s -m 5 -X POST "http://$ip/rpc/Script.SetConfig" \
            -H "Content-Type: application/json" \
            -d '{"id":1,"config":{"enable":true}}' 2>/dev/null > /dev/null

        result=$(curl -s -m 5 -X POST "http://$ip/rpc/Script.Start" \
            -H "Content-Type: application/json" \
            -d '{"id":1}' 2>/dev/null)

        if echo "$result" | grep -q '"was_running"'; then
            echo -e "${GREEN}   ✓ Script activat i en execució${NC}"
        else
            echo -e "${YELLOW}   ⚠ Script pujat però no activat automàticament${NC}"
        fi
    else
        echo -e "${RED}   ✗ Error pujant l'script${NC}"
        echo "   Resposta: $result"
    fi

    echo -e "${GREEN}=== $device_name completat ===${NC}"
    echo ""
}

# Processar cada dispositiu
configure_device "Lk01" "10.160.121.190"
configure_device "Lk02" "10.160.121.184"
configure_device "Lk03" "10.160.121.147"
configure_device "Lk04" "10.160.61.122"
configure_device "Lk05" "10.160.121.126"
configure_device "Lk06" "10.160.121.181"

echo "======================================"
echo "PROCÉS COMPLETAT"
echo "======================================"
