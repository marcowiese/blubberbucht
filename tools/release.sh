#!/bin/zsh
# Neue Version setzen: tools/release.sh 1.6.0
# Aktualisiert APP_VERSION, Service-Worker-Cache, version.json und die ?v=-Parameter in index.html.
set -e
v="$1"; [ -z "$v" ] && { echo "Aufruf: tools/release.sh <version>"; exit 1; }
cd "$(dirname "$0")/.."
sed -i '' -E "s/const APP_VERSION = '[^']+'/const APP_VERSION = '$v'/" js/game.js
sed -i '' -E "s/const CACHE = 'blubberbucht-[^']+'/const CACHE = 'blubberbucht-$v'/" sw.js
sed -i '' -E "s/(\.(js|css))(\?v=[0-9.]+)?\"/\1?v=$v\"/g" index.html
printf '{ "version": "%s" }\n' "$v" > version.json
echo "Version $v gesetzt."
