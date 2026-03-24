#!/bin/bash

# Script per desactivar l'auto_off del switch 1 a tots els dispositius LK

# Llista d'IPs dels dispositius LK
IPS=(
    "10.160.122.190"  # LK01
    "10.160.122.184"  # LK02
    "10.160.122.147"  # LK03
    "10.160.122.119"  # LK04
    "10.160.122.126"  # LK05
    "10.160.122.181"  # LK06
    "10.160.122.243"  # LK07
    "10.160.122.195"  # LK08
    "10.160.122.120"  # LK09
)

echo "=== DESACTIVANT AUTO_OFF DEL SWITCH 1 ==="

# Bucle per cada IP
for ip in "${IPS[@]}"; do
    echo ""
    echo "--- Configurant dispositiu: $ip ---"

    # Desactivar auto_off al Switch 1
    echo "Desactivant auto_off al Switch 1..."
    curl -s -X POST "http://$ip/rpc/Switch.SetConfig" \
      -H "Content-Type: application/json" \
      -d '{"id":1,"config":{"auto_off":false}}'
    
    echo ""
    echo "Dispositiu $ip configurat."
done

echo ""
echo "=== CONFIGURACIÓ DE SWITCHES COMPLETADA ==="
