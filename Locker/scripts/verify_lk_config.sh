#!/bin/bash

# Script per verificar que tots els dispositius LK tenen la mateixa configuració

echo "=== VERIFICACIÓ DE CONFIGURACIÓ DISPOSITIUS LOCKER ==="
echo ""

# IPs dels dispositius
IPS=(
    "10.160.61.192"  # LK01
    "10.160.61.186"  # LK02
    "10.160.61.157"  # LK03
    "10.160.61.120"  # LK04
    "10.160.121.126"  # LK05
    "10.160.61.182"  # LK06
    "10.160.61.247"  # LK07
    "10.160.61.197"  # LK08
    "10.160.61.122"  # LK09
)

NAMES=(
    "LK01" "LK02" "LK03" "LK04" "LK05" "LK06" "LK07" "LK08" "LK09"
)

# Crear directori temporal
TMP_DIR="/tmp/lk_config_check"
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

echo "1. Descarregant configuracions..."
echo ""

for i in "${!IPS[@]}"; do
    ip="${IPS[$i]}"
    name="${NAMES[$i]}"

    printf "  [$name] $ip ... "

    if curl -s -m 3 "http://$ip/rpc/Shelly.GetConfig" > "$TMP_DIR/${name}_raw.json" 2>/dev/null; then
        # Normalitzar: eliminar camps específics del dispositiu
        python3 << EOF > "$TMP_DIR/${name}_normalized.json"
import json
with open("$TMP_DIR/${name}_raw.json") as f:
    config = json.load(f)

# Eliminar camps específics del dispositiu
config['sys']['device']['name'] = 'NORMALIZED'
config['sys']['device']['mac'] = 'NORMALIZED'
config['sys']['device']['fw_id'] = 'NORMALIZED'
config['sys']['cfg_rev'] = 0

if 'switch:0' in config:
    config['switch:0']['name'] = 'NORMALIZED_P'
if 'switch:1' in config:
    config['switch:1']['name'] = 'NORMALIZED_L'

if 'mqtt' in config:
    config['mqtt']['client_id'] = 'NORMALIZED'
    config['mqtt']['topic_prefix'] = 'NORMALIZED'

if 'wifi' in config and 'ap' in config['wifi']:
    config['wifi']['ap']['ssid'] = 'NORMALIZED'

print(json.dumps(config, sort_keys=True, indent=2))
EOF
        echo "✅"
    else
        echo "❌ ERROR"
    fi
done

echo ""
echo "2. Comparant configuracions..."
echo ""

# Usar LK01 com a referència
REFERENCE="$TMP_DIR/LK01_normalized.json"

if [ ! -f "$REFERENCE" ]; then
    echo "❌ ERROR: No s'ha pogut obtenir la configuració de referència (LK01)"
    exit 1
fi

DIFFERENCES_FOUND=0

for i in "${!IPS[@]}"; do
    name="${NAMES[$i]}"

    if [ "$name" == "LK01" ]; then
        continue
    fi

    CURRENT="$TMP_DIR/${name}_normalized.json"

    if [ ! -f "$CURRENT" ]; then
        echo "  [$name] ⚠️  No disponible"
        continue
    fi

    printf "  [$name] vs [LK01] ... "

    if diff -q "$REFERENCE" "$CURRENT" > /dev/null 2>&1; then
        echo "✅ Idèntic"
    else
        echo "❌ DIFERÈNCIES TROBADES"
        ((DIFFERENCES_FOUND++))

        # Mostrar diferències
        echo ""
        echo "      Diferències detectades:"
        diff -u "$REFERENCE" "$CURRENT" | grep -E "^\+|^\-" | grep -v "^\+\+\+\|^\-\-\-" | head -20 | sed 's/^/      /'
        echo ""
    fi
done

echo ""
echo "3. Verificació de paràmetres clau..."
echo ""

# Verificar paràmetres importants
for i in "${!IPS[@]}"; do
    ip="${IPS[$i]}"
    name="${NAMES[$i]}"

    echo "[$name]"

    # Cloud
    cloud=$(curl -s "http://$ip/rpc/Cloud.GetConfig" 2>/dev/null | python3 -c "import sys, json; d=json.load(sys.stdin); print(f\"enable={d.get('enable')}, server={d.get('server', 'N/A')}\")" 2>/dev/null)
    echo "  Cloud: $cloud"

    # Switch modes
    sw0_mode=$(curl -s "http://$ip/rpc/Switch.GetConfig?id=0" 2>/dev/null | python3 -c "import sys, json; d=json.load(sys.stdin); print(f\"in_mode={d.get('in_mode')}, initial_state={d.get('initial_state')}\")" 2>/dev/null)
    echo "  Switch 0: $sw0_mode"

    sw1_mode=$(curl -s "http://$ip/rpc/Switch.GetConfig?id=1" 2>/dev/null | python3 -c "import sys, json; d=json.load(sys.stdin); print(f\"in_mode={d.get('in_mode')}, initial_state={d.get('initial_state')}\")" 2>/dev/null)
    echo "  Switch 1: $sw1_mode"

    # Script
    script=$(curl -s "http://$ip/rpc/Script.GetConfig?id=1" 2>/dev/null | python3 -c "import sys, json; d=json.load(sys.stdin); print(f\"name={d.get('name')}, enable={d.get('enable')}\")" 2>/dev/null)
    echo "  Script: $script"

    echo ""
done

echo "=== RESUM ==="
if [ $DIFFERENCES_FOUND -eq 0 ]; then
    echo "✅ TOTS ELS DISPOSITIUS TENEN LA MATEIXA CONFIGURACIÓ"
else
    echo "⚠️  S'han trobat $DIFFERENCES_FOUND dispositius amb diferències"
fi
echo ""

# Netejar
# rm -rf "$TMP_DIR"
echo "Fitxers temporals guardats a: $TMP_DIR"
