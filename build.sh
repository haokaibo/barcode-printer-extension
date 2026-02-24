#!/bin/bash
set -e

# --- Safety Check: Warn if extension-build/ files are newer than source ---
CONFLICT=0
for file in content.js styles.css manifest.json; do
    SRC="./$file"
    DST="./extension-build/$file"
    if [ -f "$DST" ] && [ "$DST" -nt "$SRC" ]; then
        echo "⚠️  WARNING: extension-build/$file is NEWER than $file"
        echo "   You may have unsaved edits in extension-build/ that will be overwritten."
        CONFLICT=1
    fi
done

if [ "$CONFLICT" -eq 1 ]; then
    echo ""
    read -p "Continue and overwrite? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Build cancelled. Copy your changes from extension-build/ to the root files first."
        exit 1
    fi
fi

# --- Build ---
npm run build
mkdir -p extension-build
cp manifest.json extension-build/
cp content.js extension-build/
cp styles.css extension-build/
cp -r dist/* extension-build/
echo "✓ Extension files ready in extension-build/"