#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}ENCENENT LLUMS VERDES DELS LOCKERS${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Dispositius i IPs (mateixa llista que a l'instal·lador)
declare -a DEVICES=(
    "Lk01:10.160.61.192"
    "Lk02:10.160.61.186"
    "Lk03:10.160.61.154"
    "Lk04:10.160.61.121"
    "Lk05:10.160.61.128"
    "Lk06:10.160.61.182"
    "Lk07:10.160.61.247"
    "Lk08:10.160.61.197"
    "Lk09:10.160.61.122"
)

success_count=0
failed_count=0

for device_info in "${DEVICES[@]}"; do
    IFS=':' read -r name ip <<< "$device_info"

    echo -n "► Encenent llum de $name ($ip)... "

    # Comanda per encendre el Switch 1 (llum verda)
    result=$(curl -s -m 5 -X POST "http://$ip/rpc/Switch.Set" \
        -H "Content-Type: application/json" \
        -d '{"id":1,"on":true}' 2>&1)

    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓ OK${NC}"
        ((success_count++))
    else
        echo -e "${RED}✗ ERROR${NC}"
        echo "  $result"
        ((failed_count++))
    fi
done

echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}RESUM${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}Enceses correctament: $success_count${NC}"
echo -e "${RED}Errors: $failed_count${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
