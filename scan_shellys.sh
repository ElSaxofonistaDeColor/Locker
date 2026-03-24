#!/bin/bash

# Script per trobar dispositius Shelly a la xarxa local
# Escaneja el rang d'IPs i comprova si són dispositius Shelly

echo "=== ESCANEIG DE DISPOSITIUS SHELLY ==="
echo "Xarxa: 10.160.61.0/24"
echo ""

# Array per guardar els dispositius trobats
declare -a shellys

# Funció per comprovar si una IP és un Shelly
check_shelly() {
    local ip=$1
    # Intentar obtenir informació del dispositiu amb timeout curt
    response=$(curl -s --connect-timeout 1 --max-time 2 "http://$ip/rpc/Shelly.GetDeviceInfo" 2>/dev/null)

    if [ ! -z "$response" ] && echo "$response" | grep -q "\"id\""; then
        echo "$ip|$response"
    fi
}

echo "Escanejant rang 10.160.61.1-254..."
echo ""

# Escanejar el rang d'IPs en paral·lel per anar més ràpid
for i in {1..254}; do
    check_shelly "10.160.61.$i" &

    # Limitar a 20 processos simultanis per no saturar
    if [ $((i % 20)) -eq 0 ]; then
        wait
    fi
done

# Esperar que acabin tots els processos
wait

echo ""
echo "=== ESCANEIG COMPLETAT ==="
