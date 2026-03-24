#!/bin/bash

# Script per renombrar els dispositius Locker
# Patró: Lk01_P (sw:0 = Pujar), Lk01_L (sw:1 = Baixar)

echo "=== RENOMBRANT DISPOSITIUS LOCKER ==="
echo ""

# Arrays paral·lels amb IPs i noms
IPS=(
    "10.160.61.192"
    "10.160.61.186"
    "10.160.61.120"
    "10.160.61.128"
    "10.160.61.182"
    "10.160.61.247"
    "10.160.61.197"
    "10.160.61.122"
)

NAMES=(
    "Lk01"
    "Lk02"
    "Lk04"
    "Lk05"
    "Lk06"
    "Lk07"
    "Lk08"
    "Lk09"
)

# Funció per renombrar un switch
rename_switch() {
    local ip=$1
    local switch_id=$2
    local new_name=$3

    echo "  Renombrant switch $switch_id a '$new_name'..."

    response=$(curl -s -X POST "http://$ip/rpc/Switch.SetConfig" \
        -H "Content-Type: application/json" \
        -d "{\"id\":$switch_id,\"config\":{\"name\":\"$new_name\"}}")

    if echo "$response" | grep -q '"restart_required":false'; then
        echo "    ✅ OK"
        return 0
    else
        echo "    ❌ ERROR: $response"
        return 1
    fi
}

# Processar cada dispositiu
success=0
failed=0

for i in "${!IPS[@]}"; do
    ip="${IPS[$i]}"
    name="${NAMES[$i]}"
    echo "[$name] IP: $ip"

    # Verificar que el dispositiu està online
    if ! curl -s -m 2 "http://$ip/rpc/Shelly.GetDeviceInfo" > /dev/null 2>&1; then
        echo "  ⚠️  Dispositiu offline, saltant..."
        ((failed++))
        echo ""
        continue
    fi

    # Renombrar switch 0 (Pujar)
    if rename_switch "$ip" 0 "${name}_P"; then
        ((success++))
    else
        ((failed++))
    fi

    # Renombrar switch 1 (Baixar)
    if rename_switch "$ip" 1 "${name}_L"; then
        ((success++))
    else
        ((failed++))
    fi

    echo ""
done

echo "=== RESUM ==="
echo "✅ Canvis exitosos: $success"
echo "❌ Errors: $failed"
echo ""
echo "=== VERIFICACIÓ ==="
echo ""

# Mostrar els noms actualitzats
for i in "${!IPS[@]}"; do
    ip="${IPS[$i]}"
    name="${NAMES[$i]}"
    sw0=$(curl -s "http://$ip/rpc/Switch.GetConfig?id=0" 2>/dev/null | python3 -c "import sys, json; print(json.load(sys.stdin).get('name', 'ERROR'))" 2>/dev/null)
    sw1=$(curl -s "http://$ip/rpc/Switch.GetConfig?id=1" 2>/dev/null | python3 -c "import sys, json; print(json.load(sys.stdin).get('name', 'ERROR'))" 2>/dev/null)

    if [ "$sw0" != "ERROR" ] && [ "$sw1" != "ERROR" ]; then
        echo "[$name] sw:0='$sw0' | sw:1='$sw1'"
    fi
done

echo ""
echo "=== COMPLETAT ==="
