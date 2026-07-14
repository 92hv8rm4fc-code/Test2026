#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WWW="$ROOT/www"

rm -rf "$WWW"
mkdir -p "$WWW/assets" "$WWW/vendor"

cp "$ROOT/index.html" "$ROOT/styles.css" "$ROOT/storage.js" "$ROOT/app.js" "$WWW/"
cp "$ROOT/assets/foliogrid-icon.png" "$WWW/assets/"
npx esbuild "$ROOT/xlsx-reader-entry.js" \
  --bundle \
  --minify \
  --format=iife \
  --outfile="$WWW/vendor/xlsx-reader.min.js"

echo "Prepared FolioGrid web bundle in $WWW"
