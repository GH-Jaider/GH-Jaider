#!/usr/bin/env bash
# Builds the JetBrains Mono subsets in assets/fonts:
#   - embedded (base64) in terminal.svg by scripts/generate.mjs, so the README renders the same on every OS
#   - loaded by index.html for box-drawing/block glyphs (U+2500–259F), which Google Fonts' Latin subset lacks
# Needs python3 and network. A throwaway venv with fonttools+brotli is created in a temp dir.
set -euo pipefail
VERSION="${JBM_VERSION:-2.304}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# ASCII, Spanish accents, typographic punctuation, arrows, box drawing, block elements, ▶
UNICODES='U+0020-007E,U+00A1,U+00A9,U+00B7,U+00BF,U+00C1,U+00C9,U+00CD,U+00D1,U+00D3,U+00DA,U+00DC,U+00E1,U+00E9,U+00ED,U+00F1,U+00F3,U+00FA,U+00FC,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+2190-2193,U+2500-259F,U+2605,U+25B6'

curl -sL -o "$WORK/jbm.zip" "https://github.com/JetBrains/JetBrainsMono/releases/download/v$VERSION/JetBrainsMono-$VERSION.zip"
unzip -q "$WORK/jbm.zip" -d "$WORK/jbm"
python3 -m venv "$WORK/venv"
"$WORK/venv/bin/pip" -q install fonttools brotli

mkdir -p "$ROOT/assets/fonts"
for weight in Regular Bold; do
  ttf="$(find "$WORK/jbm" -name "JetBrainsMono-$weight.ttf" | head -1)"
  "$WORK/venv/bin/pyftsubset" "$ttf" --unicodes="$UNICODES" --flavor=woff2 \
    --output-file="$ROOT/assets/fonts/JetBrainsMono-$weight.subset.woff2"
done
ls -la "$ROOT/assets/fonts"
echo "now run: node scripts/generate.mjs"
