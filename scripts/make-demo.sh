#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CAST_FILE="$ROOT_DIR/demo.cast"
GIF_FILE="$ROOT_DIR/demo.gif"
RELEASE_TAG="demo-assets"

# Check dependencies
for cmd in asciinema agg gh node; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: '$cmd' is not installed."
    case "$cmd" in
      asciinema) echo "  Install: brew install asciinema" ;;
      agg)       echo "  Install: brew install agg" ;;
      gh)        echo "  Install: brew install gh && gh auth login" ;;
    esac
    exit 1
  fi
done

# Detect repo from git remote
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
if [ -z "$REPO" ]; then
  echo "Error: GitHub repository not detected. Run: gh auth login"
  exit 1
fi

GIF_URL="https://github.com/$REPO/releases/download/$RELEASE_TAG/demo.gif"

echo "▶ Recording tetris autoplay..."
asciinema rec \
  --command "node $SCRIPT_DIR/autoplay.js" \
  --overwrite \
  --headless \
  --title "fp-tetris demo" \
  --window-size 60x24 \
  --output-format asciicast-v2 \
  "$CAST_FILE"

echo "▶ Converting to GIF..."
agg --speed 1.5 --theme monokai "$CAST_FILE" "$GIF_FILE"

echo "▶ Uploading to GitHub Releases ($RELEASE_TAG)..."
if gh release view "$RELEASE_TAG" --repo "$REPO" &>/dev/null; then
  gh release upload "$RELEASE_TAG" "$GIF_FILE" --repo "$REPO" --clobber
else
  gh release create "$RELEASE_TAG" "$GIF_FILE" \
    --repo "$REPO" \
    --title "Demo Assets" \
    --notes "Auto-generated demo assets. Do not delete this release." \
    --prerelease
fi

echo "▶ Updating README.md..."
README_PATH="$ROOT_DIR/README.md" GIF_URL="$GIF_URL" node -e "
  const fs = require('fs');
  const readmePath = process.env.README_PATH;
  const gifUrl = process.env.GIF_URL;
  let text = fs.readFileSync(readmePath, 'utf8');
  const next = text
    .replace(/\[!\[asciicast\][^\n]*/m, '![fp-tetris demo](' + gifUrl + ')')
    .replace(/!\[fp-tetris demo\]\([^)]+\)/g, '![fp-tetris demo](' + gifUrl + ')');
  if (next !== text) {
    fs.writeFileSync(readmePath, next);
    console.log('README.md updated.');
  } else {
    console.log('README.md already up to date.');
  }
"

echo ""
echo "✓ Done!"
echo "  GIF URL: $GIF_URL"
