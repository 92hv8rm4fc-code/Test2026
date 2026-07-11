#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WWW="$ROOT/www"

rm -rf "$WWW"
mkdir -p "$WWW"

cp "$ROOT/index.html" "$ROOT/app.js" "$ROOT/styles.css" "$ROOT/mobile-api.js" "$WWW/"
cp -R "$ROOT/data" "$WWW/"

echo "Prepared www/ for Capacitor ($(du -sh "$WWW" | awk '{print $1}'))"
