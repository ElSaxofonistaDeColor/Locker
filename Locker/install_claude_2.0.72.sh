#!/bin/bash

# Script per instal·lar Claude Code 2.0.72 manualment a macOS
# Data: 2025-12-18

set -e  # Sortir si hi ha errors

VERSION="2.0.72"
INSTALL_SCRIPT_URL="https://claude.ai/install.sh"

echo "=========================================="
echo "  Instal·lador de Claude Code v${VERSION}"
echo "=========================================="
echo ""

# Comprovar si ja existeix Claude Code
if command -v claude &> /dev/null; then
    CURRENT_VERSION=$(claude --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1 || echo "desconeguda")
    echo "✓ Claude Code ja està instal·lat (versió: ${CURRENT_VERSION})"
    echo ""
    read -p "Vols continuar amb la instal·lació de la v${VERSION}? (s/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
        echo "Instal·lació cancel·lada."
        exit 0
    fi
fi

# Comprovar connexió a internet
echo "→ Comprovant connexió a internet..."
if ! curl -fsSL --max-time 5 https://claude.ai &> /dev/null; then
    echo "✗ Error: No es pot connectar a claude.ai"
    echo "  Comprova la teva connexió a internet."
    exit 1
fi
echo "✓ Connexió verificada"
echo ""

# Descarregar i executar l'instal·lador
echo "→ Descarregant i instal·lant Claude Code v${VERSION}..."
echo ""

if curl -fsSL "${INSTALL_SCRIPT_URL}" | bash -s "${VERSION}"; then
    echo ""
    echo "=========================================="
    echo "✓ Instal·lació completada amb èxit!"
    echo "=========================================="
    echo ""

    # Verificar la versió instal·lada
    if command -v claude &> /dev/null; then
        INSTALLED_VERSION=$(claude --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n1 || echo "desconeguda")
        echo "Versió instal·lada: ${INSTALLED_VERSION}"
        echo ""
        echo "Per començar a utilitzar Claude Code, executa:"
        echo "  claude"
        echo ""
    else
        echo "NOTA: Si 'claude' no es reconeix, tanca i reobre el terminal."
    fi
else
    echo ""
    echo "✗ Error durant la instal·lació"
    echo ""
    echo "Intenta instal·lar-lo manualment amb:"
    echo "  curl -fsSL https://claude.ai/install.sh | bash -s ${VERSION}"
    echo ""
    echo "O via npm:"
    echo "  npm install -g @anthropic-ai/claude-code@${VERSION}"
    exit 1
fi
