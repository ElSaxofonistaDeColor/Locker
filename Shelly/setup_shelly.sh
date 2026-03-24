#!/bin/bash

# Script per configurar automàticament un Shelly Plus 2PM
# per control de porta amb botó i llum verda

# ==============================================
# CONFIGURACIÓ - Modifica aquests valors
# ==============================================

SHELLY_IP="10.160.61.230"
DEVICE_NAME="Locker_Porta_1"

# ==============================================
# NO MODIFICAR A PARTIR D'AQUÍ
# ==============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  CONFIGURACIÓ SHELLY PLUS 2PM${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "IP: ${YELLOW}${SHELLY_IP}${NC}"
echo -e "Nom dispositiu: ${YELLOW}${DEVICE_NAME}${NC}"
echo ""

# Funció per verificar connexió
check_connection() {
    echo -e "${YELLOW}[1/6]${NC} Comprovant connexió al Shelly..."
    response=$(curl -s -m 5 http://${SHELLY_IP}/shelly)
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: No es pot connectar al Shelly a ${SHELLY_IP}${NC}"
        exit 1
    fi
    model=$(echo $response | jq -r '.model')
    echo -e "${GREEN}✓ Connectat! Model: ${model}${NC}"
    echo ""
}

# Funció per canviar el nom del dispositiu
set_device_name() {
    echo -e "${YELLOW}[2/6]${NC} Configurant nom del dispositiu..."
    response=$(curl -s -X POST http://${SHELLY_IP}/rpc/Sys.SetConfig \
        -H "Content-Type: application/json" \
        -d "{\"config\":{\"device\":{\"name\":\"${DEVICE_NAME}\"}}}")

    if echo $response | jq -e '.restart_required' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Nom del dispositiu configurat: ${DEVICE_NAME}${NC}"
    else
        echo -e "${RED}ERROR configurant nom: $response${NC}"
        exit 1
    fi
    echo ""
}

# Funció per configurar els inputs
configure_inputs() {
    echo -e "${YELLOW}[3/6]${NC} Configurant inputs..."

    # Input 0 (Sensor porta) - tipus switch
    curl -s -X POST http://${SHELLY_IP}/rpc/Input.SetConfig \
        -H "Content-Type: application/json" \
        -d '{"id":0,"config":{"name":"Sensor_Porta","type":"switch"}}' > /dev/null
    echo -e "${GREEN}  ✓ Input 0: Sensor Porta (switch)${NC}"

    # Input 1 (Botó) - tipus button
    curl -s -X POST http://${SHELLY_IP}/rpc/Input.SetConfig \
        -H "Content-Type: application/json" \
        -d '{"id":1,"config":{"name":"Boto_Client","type":"button"}}' > /dev/null
    echo -e "${GREEN}  ✓ Input 1: Botó Client (button)${NC}"
    echo ""
}

# Funció per configurar els switches en mode detached
configure_switches() {
    echo -e "${YELLOW}[4/6]${NC} Configurant outputs (mode detached)..."

    # Switch 0 (Actuador porta)
    curl -s -X POST http://${SHELLY_IP}/rpc/Switch.SetConfig \
        -H "Content-Type: application/json" \
        -d '{"id":0,"config":{"name":"Actuador_Porta","in_mode":"detached","initial_state":"off"}}' > /dev/null
    echo -e "${GREEN}  ✓ Output 0: Actuador Porta (detached)${NC}"

    # Switch 1 (Llum verda)
    curl -s -X POST http://${SHELLY_IP}/rpc/Switch.SetConfig \
        -H "Content-Type: application/json" \
        -d '{"id":1,"config":{"name":"Llum_Verda","in_mode":"detached","initial_state":"off"}}' > /dev/null
    echo -e "${GREEN}  ✓ Output 1: Llum Verda (detached)${NC}"
    echo ""
}

# Funció per pujar l'script
upload_script() {
    echo -e "${YELLOW}[5/6]${NC} Pujant script de control..."

    # Comprova si ja existeix un script
    existing_scripts=$(curl -s http://${SHELLY_IP}/rpc/Script.List | jq -r '.scripts[] | select(.name=="control_porta") | .id')

    if [ -n "$existing_scripts" ]; then
        echo -e "${BLUE}  Script existent detectat (ID: $existing_scripts), actualitzant...${NC}"
        SCRIPT_ID=$existing_scripts

        # Atura l'script si està executant-se
        curl -s -X POST http://${SHELLY_IP}/rpc/Script.Stop -d "{\"id\":${SCRIPT_ID}}" > /dev/null
    else
        echo -e "${BLUE}  Creant nou script...${NC}"
        # Crea un nou script
        response=$(curl -s -X POST http://${SHELLY_IP}/rpc/Script.Create -d '{"name":"control_porta"}')
        SCRIPT_ID=$(echo $response | jq -r '.id')
    fi

    # Llegeix el codi de l'script
    SCRIPT_CODE=$(cat << 'EOFSCRIPT'
// Script de control de porta amb botó i llum verda
// Input 0 (S1): Sensor porta (true=tancada, false=oberta)
// Input 1 (S2): Botó client
// Switch 0 (Output 0): Actuador porta
// Switch 1 (Output 1): Llum verda

let portaObrint = false;

function llumVerdaEncesa(callback) {
  Shelly.call("Switch.GetStatus", {id: 1}, function(result, error_code, error_message) {
    if (error_code !== 0) {
      print("ERROR llum verda:", error_code, error_message);
      callback(false);
      return;
    }
    callback(result && result.output === true);
  });
}

function portaTancada(callback) {
  Shelly.call("Input.GetStatus", {id: 0}, function(result, error_code, error_message) {
    if (error_code !== 0) {
      print("ERROR porta:", error_code, error_message);
      callback(false);
      return;
    }
    callback(result && result.state === true);
  });
}

function activarActuador() {
  Shelly.call("Switch.Set", {id: 0, on: true}, function(result, error_code, error_message) {
    if (error_code !== 0) {
      print("ERROR activant actuador:", error_code, error_message);
      return;
    }
    print("ACTUADOR ACTIVAT - Obrint porta");
    portaObrint = true;
  });
}

function desactivarActuador() {
  Shelly.call("Switch.Set", {id: 0, on: false}, function(result, error_code, error_message) {
    if (error_code !== 0) {
      print("ERROR desactivant actuador:", error_code, error_message);
      return;
    }
    print("ACTUADOR DESACTIVAT");
    portaObrint = false;
  });
}

function apagarLlumVerda() {
  Shelly.call("Switch.Set", {id: 1, on: false}, function(result, error_code, error_message) {
    if (error_code !== 0) {
      print("ERROR apagant llum verda:", error_code, error_message);
      return;
    }
    print("LLUM VERDA APAGADA");
  });
}

function processarPulsacioBoto() {
  print("BOTO PREMUT");
  llumVerdaEncesa(function(encesa) {
    if (!encesa) {
      print("ACCES DENEGAT: Llum verda apagada");
      return;
    }
    portaTancada(function(tancada) {
      if (!tancada) {
        print("ACCES DENEGAT: Porta ja oberta");
        return;
      }
      print("CONDICIONS OK - Obrint porta");
      activarActuador();
    });
  });
}

Shelly.addEventHandler(function(event) {
  if (event.component === "input:1") {
    if (event.info.event === "single_push" || event.info.event === "btn_down") {
      processarPulsacioBoto();
    }
  }
  if (event.component === "input:0") {
    if (event.info.state === false && portaObrint) {
      print("PORTA OBERTA - Desactivant actuador i llum");
      desactivarActuador();
      apagarLlumVerda();
    }
  }
});

print("Script control porta actiu");
EOFSCRIPT
)

    # Converteix el codi a JSON i el puja
    SCRIPT_JSON=$(echo "$SCRIPT_CODE" | jq -Rs .)
    response=$(curl -s -X POST http://${SHELLY_IP}/rpc/Script.PutCode \
        -H "Content-Type: application/json" \
        -d "{\"id\":${SCRIPT_ID},\"code\":${SCRIPT_JSON},\"append\":false}")

    script_len=$(echo $response | jq -r '.len')
    if [ "$script_len" != "null" ]; then
        echo -e "${GREEN}  ✓ Script pujat correctament (${script_len} bytes)${NC}"
    else
        echo -e "${RED}ERROR pujant script: $response${NC}"
        exit 1
    fi

    # Activa l'script
    curl -s -X POST http://${SHELLY_IP}/rpc/Script.SetConfig \
        -d "{\"id\":${SCRIPT_ID},\"config\":{\"enable\":true}}" > /dev/null

    # Inicia l'script
    curl -s -X POST http://${SHELLY_IP}/rpc/Script.Start -d "{\"id\":${SCRIPT_ID}}" > /dev/null
    echo -e "${GREEN}  ✓ Script activat i iniciat${NC}"
    echo ""
}

# Funció per verificar la configuració
verify_setup() {
    echo -e "${YELLOW}[6/6]${NC} Verificant configuració..."

    # Verifica el nom
    device_name=$(curl -s http://${SHELLY_IP}/rpc/Shelly.GetConfig | jq -r '.sys.device.name')
    echo -e "${GREEN}  ✓ Nom dispositiu: ${device_name}${NC}"

    # Verifica els inputs
    input0=$(curl -s http://${SHELLY_IP}/rpc/Input.GetConfig -d '{"id":0}' | jq -r '.name')
    input1=$(curl -s http://${SHELLY_IP}/rpc/Input.GetConfig -d '{"id":1}' | jq -r '.name')
    echo -e "${GREEN}  ✓ Input 0: ${input0}${NC}"
    echo -e "${GREEN}  ✓ Input 1: ${input1}${NC}"

    # Verifica els switches
    switch0=$(curl -s http://${SHELLY_IP}/rpc/Switch.GetConfig -d '{"id":0}' | jq -r '.name')
    switch1=$(curl -s http://${SHELLY_IP}/rpc/Switch.GetConfig -d '{"id":1}' | jq -r '.name')
    echo -e "${GREEN}  ✓ Output 0: ${switch0}${NC}"
    echo -e "${GREEN}  ✓ Output 1: ${switch1}${NC}"

    # Verifica l'script
    script_status=$(curl -s http://${SHELLY_IP}/rpc/Script.GetStatus -d '{"id":1}' | jq -r '.running')
    if [ "$script_status" = "true" ]; then
        echo -e "${GREEN}  ✓ Script: Executant-se${NC}"
    else
        echo -e "${RED}  ✗ Script: No s'està executant${NC}"
    fi
    echo ""
}

# Executa totes les funcions
check_connection
set_device_name
configure_inputs
configure_switches
upload_script
verify_setup

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  CONFIGURACIÓ COMPLETADA!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Accés web: ${YELLOW}http://${SHELLY_IP}${NC}"
echo -e "Dispositiu: ${YELLOW}${DEVICE_NAME}${NC}"
echo ""
echo -e "${BLUE}Funcionament:${NC}"
echo -e "  1. Encén la llum verda (Output 1) manualment"
echo -e "  2. El client prem el botó (Input 1)"
echo -e "  3. Si les condicions són correctes, s'obre la porta"
echo -e "  4. Quan la porta s'obre, es desactiva l'actuador i s'apaga la llum"
echo ""
