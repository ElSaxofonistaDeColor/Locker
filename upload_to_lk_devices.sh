#!/bin/bash

# Script per configurar i carregar l'script de control als dispositius Lk
# Basant-se en la documentació oficial de Shelly Scripts API

# Colors per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Llista de dispositius Lk amb les seves IPs
declare -A LK_DEVICES
LK_DEVICES["Lk01"]="10.160.121.190"
LK_DEVICES["Lk02"]="10.160.121.184"
LK_DEVICES["Lk03"]="10.160.121.147"
LK_DEVICES["Lk04"]="10.160.61.122"
LK_DEVICES["Lk05"]="10.160.121.126"
LK_DEVICES["Lk06"]="10.160.121.181"

# Llegir el codi de l'script (versió per Shelly Plus 2PM)
SCRIPT_CODE=$(cat control_porta_v2.js)

# Funció per escapar el codi per JSON
escape_json() {
    echo "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'
}

echo "======================================"
echo "CONFIGURACIÓ DISPOSITIUS SHELLY LK"
echo "======================================"
echo ""

# Escapar el codi JavaScript per JSON
ESCAPED_CODE=$(escape_json "$SCRIPT_CODE")

for device_name in "${!LK_DEVICES[@]}"; do
    ip="${LK_DEVICES[$device_name]}"

    echo -e "${YELLOW}Processing $device_name ($ip)${NC}"
    echo "---"

    # 1. Obtenir informació del dispositiu
    echo "1. Obtenint informació del dispositiu..."
    device_info=$(curl -s -m 5 "http://$ip/rpc/Shelly.GetDeviceInfo" 2>/dev/null)

    if [ $? -ne 0 ] || [ -z "$device_info" ]; then
        echo -e "${RED}   ✗ ERROR: No es pot connectar amb $device_name${NC}"
        echo ""
        continue
    fi

    echo -e "${GREEN}   ✓ Connectat${NC}"

    # Verificar el perfil actual
    profile=$(echo "$device_info" | python3 -c "import json,sys; print(json.load(sys.stdin).get('profile','unknown'))" 2>/dev/null)
    echo "   Perfil actual: $profile"

    # Si està en mode cover, canviar a switch
    if [ "$profile" = "cover" ]; then
        echo "   Canviant perfil de COVER a SWITCH..."
        result=$(curl -s -m 10 -X POST "http://$ip/rpc/Shelly.SetProfile" \
            -H "Content-Type: application/json" \
            -d '{"name":"switch"}' 2>/dev/null)

        if echo "$result" | grep -q '"name":"switch"'; then
            echo -e "${GREEN}   ✓ Perfil canviat a SWITCH${NC}"
            echo -e "${YELLOW}   ⚠ REINICI REQUERIT - el dispositiu es reiniciarà...${NC}"
            # Esperar reinici
            sleep 10
        else
            echo -e "${RED}   ✗ Error canviant perfil${NC}"
            echo "   Resposta: $result"
        fi
    fi

    # 2. Configurar Input 0 (Sensor porta) com a switch
    echo "2. Configurant Input 0 (Sensor porta)..."
    result=$(curl -s -m 5 -X POST "http://$ip/rpc/Input.SetConfig" \
        -H "Content-Type: application/json" \
        -d '{"id":0,"config":{"type":"switch","enable":true,"invert":false}}' 2>/dev/null)

    if echo "$result" | grep -q '"restart_required":true'; then
        echo -e "${YELLOW}   ⚠ Reinici requerit per Input 0${NC}"
    else
        echo -e "${GREEN}   ✓ Input 0 configurat${NC}"
    fi

    # 3. Configurar Input 1 (Botó client) com a button
    echo "3. Configurant Input 1 (Botó client)..."
    result=$(curl -s -m 5 -X POST "http://$ip/rpc/Input.SetConfig" \
        -H "Content-Type: application/json" \
        -d '{"id":1,"config":{"type":"button","enable":true,"invert":false}}' 2>/dev/null)

    if echo "$result" | grep -q '"restart_required":true'; then
        echo -e "${YELLOW}   ⚠ Reinici requerit per Input 1${NC}"
    else
        echo -e "${GREEN}   ✓ Input 1 configurat${NC}"
    fi

    # 4. Configurar Switches (Shelly Plus 2PM té 2 switches)
    echo "4. Configurant switches..."

    # Configurar Switch 0 (Actuador porta) en mode detached
    result=$(curl -s -m 5 -X POST "http://$ip/rpc/Switch.SetConfig" \
        -H "Content-Type: application/json" \
        -d '{"id":0,"config":{"in_mode":"detached","initial_state":"off","auto_on":false,"auto_off":false}}' 2>/dev/null)

    if echo "$result" | grep -q '"restart_required":true'; then
        echo -e "${YELLOW}   ⚠ Reinici requerit per Switch 0${NC}"
    else
        echo -e "${GREEN}   ✓ Switch 0 (Actuador) configurat${NC}"
    fi

    # Configurar Switch 1 (Llum verda) en mode detached
    result=$(curl -s -m 5 -X POST "http://$ip/rpc/Switch.SetConfig" \
        -H "Content-Type: application/json" \
        -d '{"id":1,"config":{"in_mode":"detached","initial_state":"off","auto_on":false,"auto_off":false}}' 2>/dev/null)

    if echo "$result" | grep -q '"restart_required":true'; then
        echo -e "${YELLOW}   ⚠ Reinici requerit per Switch 1${NC}"
    else
        echo -e "${GREEN}   ✓ Switch 1 (Llum verda) configurat${NC}"
    fi

    # 5. Pujar l'script
    echo "5. Pujant script de control..."

    # Crear l'script si no existeix (ID 1)
    result=$(curl -s -m 5 -X POST "http://$ip/rpc/Script.Create" \
        -H "Content-Type: application/json" \
        -d '{"name":"control_porta"}' 2>/dev/null)

    # Pujar el codi
    result=$(curl -s -m 10 -X POST "http://$ip/rpc/Script.PutCode" \
        -H "Content-Type: application/json" \
        -d "{\"id\":1,\"code\":$ESCAPED_CODE,\"append\":false}" 2>/dev/null)

    if echo "$result" | grep -q '"len"'; then
        echo -e "${GREEN}   ✓ Script pujat correctament${NC}"

        # 6. Activar l'script
        echo "6. Activant script..."
        result=$(curl -s -m 5 -X POST "http://$ip/rpc/Script.SetConfig" \
            -H "Content-Type: application/json" \
            -d '{"id":1,"config":{"enable":true}}' 2>/dev/null)

        result=$(curl -s -m 5 -X POST "http://$ip/rpc/Script.Start" \
            -H "Content-Type: application/json" \
            -d '{"id":1}' 2>/dev/null)

        if echo "$result" | grep -q '"was_running":'; then
            echo -e "${GREEN}   ✓ Script activat i en execució${NC}"
        else
            echo -e "${YELLOW}   ⚠ Script pujat però no s'ha pogut activar${NC}"
        fi
    else
        echo -e "${RED}   ✗ Error pujant l'script${NC}"
        echo "   Resposta: $result"
    fi

    echo -e "${GREEN}=== $device_name completat ===${NC}"
    echo ""
done

echo "======================================"
echo "PROCÉS COMPLETAT"
echo "======================================"
echo ""
echo "NOTES:"
echo "- Si algun dispositiu està en mode COVER, cal canviar-lo a SWITCH manualment"
echo "- Els dispositius que requereixen reinici cal reiniciar-los manualment"
echo "- Comprova els logs dels scripts a la interfície web de cada dispositiu"
