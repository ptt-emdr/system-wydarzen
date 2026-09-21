#!/bin/sh
# Wdrożenie aplikacji wydarzeń na produkcję (cyber_Folks s72).
# Użycie:  ./wdrozenie.sh [--zrodla] [--bez-builda]
#   --zrodla     dodatkowo wysyła źródła do ~/src/wydarzenia (potrzebne,
#                gdy zmieniły się collections/migrations/scripts)
#   --bez-builda pomija npm run build (użyj, gdy build już zrobiony)
#
# Kolejność jest ważna — pominięcie kroku już psuło produkcję:
#  1. build lokalny (na serwerze budować NIE wolno — limit LVE),
#  2. paczka standalone + statyka,
#  3. rsync --delete do apps/wydarzenia (kasuje też tmp/!),
#  4. podmiana modułów natywnych darwin→linux,
#  5. mkdir tmp + restart.txt (tmp NIE istnieje po rsync --delete),
#  6. czekanie aż wstanie NOWA instancja,
#  7. ubicie starych instancji (stara instancja na podmienionych plikach
#     wywala żądania w trakcie — „okno wdrożenia" z 21.09.2026).
set -eu

SSH="ssh -p 222 -i $HOME/.ssh/ptt_emdr_ed25519 utfpuzbqpi@s72.cyber-folks.pl"
KATALOG="$(cd "$(dirname "$0")" && pwd)"
cd "$KATALOG"
export PATH="$HOME/.local/node22/bin:$PATH"

ZRODLA=0; BUILD=1
for a in "$@"; do
  [ "$a" = "--zrodla" ] && ZRODLA=1
  [ "$a" = "--bez-builda" ] && BUILD=0
done

if [ "$BUILD" = 1 ]; then
  echo "== 1/7 build lokalny =="
  npm run build
fi

echo "== 2/7 paczka standalone =="
rm -rf .next/standalone/.next/static
cp -R .next/static .next/standalone/.next/static

echo "== 3/7 rsync do apps/wydarzenia =="
rsync -az --delete -e "ssh -p 222 -i $HOME/.ssh/ptt_emdr_ed25519" \
  .next/standalone/ utfpuzbqpi@s72.cyber-folks.pl:apps/wydarzenia/

if [ "$ZRODLA" = 1 ]; then
  echo "==     rsync źródeł do src/wydarzenia =="
  rsync -az -e "ssh -p 222 -i $HOME/.ssh/ptt_emdr_ed25519" \
    collections components app globals lib migrations scripts \
    payload.config.ts payload-types.ts \
    utfpuzbqpi@s72.cyber-folks.pl:src/wydarzenia/
fi

echo "== 4/7 natywki + 5/7 restart =="
$SSH '
  cd ~/apps/wydarzenia/node_modules
  rm -rf @libsql/darwin-arm64 @img/sharp-darwin-arm64 @img/sharp-libvips-darwin-arm64
  cp -r ~/src/wydarzenia/node_modules/@libsql/linux-x64-gnu @libsql/
  cp -r ~/src/wydarzenia/node_modules/@img/sharp-linux-x64 \
        ~/src/wydarzenia/node_modules/@img/sharp-libvips-linux-x64 @img/
  cd ~/apps/wydarzenia && mkdir -p tmp && touch tmp/restart.txt
  echo "restart zlecony"
'

echo "== 6/7 czekam aż wstanie nowa instancja =="
STARE=$($SSH 'for p in $(ps -u $(whoami) -o pid=,comm= | grep next | awk "{print \$1}"); do
  [ "$(readlink /proc/$p/cwd)" = "/home/utfpuzbqpi/apps/wydarzenia" ] && echo $p; done' || true)
i=0
until curl -s -o /dev/null -w "%{http_code}" "https://wydarzenia.emdr.org.pl/" | grep -q 200; do
  i=$((i+1)); [ "$i" -gt 24 ] && { echo "BŁĄD: strona nie wstała w 2 min"; exit 1; }
  sleep 5
done
sleep 5

echo "== 7/7 ubijam stare instancje: ${STARE:-brak} =="
[ -n "${STARE:-}" ] && $SSH "for p in $STARE; do kill \$p 2>/dev/null && echo ubito \$p; done; true"

sleep 3
KOD=$(curl -s -o /dev/null -w "%{http_code}" "https://wydarzenia.emdr.org.pl/")
echo "== GOTOWE — strona odpowiada: $KOD =="
