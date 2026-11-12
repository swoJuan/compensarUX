#!/bin/bash
# Doble clic para abrir el Portal UX. Queda sincronizado: se reconstruye solo
# cuando cambian el sistema de diseño, los prototipos o el portal.
# Para detenerlo: cierra esta ventana de Terminal o presiona Ctrl + C.
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
if ! command -v node >/dev/null 2>&1; then
  osascript -e 'display alert "Falta Node.js" message "Instala Node.js 18 o superior desde nodejs.org y vuelve a intentarlo."'
  exit 1
fi
PORT=4173
while lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do PORT=$((PORT+1)); done
( for i in $(seq 1 60); do sleep 1; curl -s -o /dev/null "http://127.0.0.1:$PORT/" && { open "http://127.0.0.1:$PORT/"; break; }; done ) &
echo "Portal UX — deja esta ventana abierta mientras lo usas."
PORT=$PORT node scripts/watch.mjs
