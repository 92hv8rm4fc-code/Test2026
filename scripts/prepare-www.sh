#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WWW="$ROOT/www"

rm -rf "$WWW"
mkdir -p "$WWW"

cp "$ROOT/index.html" "$ROOT/app.js" "$ROOT/styles.css" "$ROOT/mobile-api.js" "$WWW/"
cp -R "$ROOT/data" "$WWW/"
mkdir -p "$WWW/assets"
cp "$ROOT/assets/AppIcon-1024.png" "$WWW/assets/" 2>/dev/null || true

echo "Prepared www/ for Capacitor ($(du -sh "$WWW" | awk '{print $1}'))"
