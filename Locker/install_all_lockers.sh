#!/bin/bash

# Script per instal·lar tots els dispositius Locker
# Usage: ./install_all_lockers.sh

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
INSTALL_SCRIPT="$SCRIPT_DIR/install_locker.sh"

# Verificar que l'script d'instal·lació existeix
if [ ! -f "$INSTALL_SCRIPT" ]; then
    echo -e "${RED}Error: Script d'instal·lació no trobat: $INSTALL_SCRIPT${NC}"
    exit 1
fi

# Dispositius i IPs
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

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}INSTAL·LACIÓ MASSIVA DISPOSITIUS LOCKER${NC}"
echo -e "${BLUE}Total dispositius: ${#DEVICES[@]}${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

success_count=0
failed_count=0
skipped_count=0

for device_info in "${DEVICES[@]}"; do
    IFS=':' read -r name ip <<< "$device_info"

    echo ""
    echo -e "${BLUE}► Processant $name ($ip)...${NC}"

    # Verificar si està online
    if ! curl -s -m 3 "http://$ip/rpc/Shelly.GetDeviceInfo" > /dev/null 2>&1; then
        echo -e "${RED}✗ $name està offline - saltant${NC}"
        ((skipped_count++))
        continue
    fi

    # Executar instal·lació
    if "$INSTALL_SCRIPT" "$name" "$ip"; then
        ((success_count++))
    else
        echo -e "${RED}✗ Error instal·lant $name${NC}"
        ((failed_count++))
    fi
done

echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}RESUM INSTAL·LACIÓ${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}Exitosos: $success_count${NC}"
echo -e "${RED}Errors: $failed_count${NC}"
echo -e "Saltats (offline): $skipped_count"
echo -e "${BLUE}=====================================${NC}"
echo ""

if [ $failed_count -eq 0 ] && [ $success_count -gt 0 ]; then
    echo -e "${GREEN}✓ Instal·lació completada exitosament!${NC}"
    exit 0
elif [ $success_count -eq 0 ]; then
    echo -e "${RED}✗ Cap dispositiu instal·lat correctament${NC}"
    exit 1
else
    echo -e "${RED}⚠ Instal·lació completada amb errors${NC}"
    exit 1
fi
