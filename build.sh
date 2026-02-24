#!/bin/bash
npm run build
mkdir -p extension-build
cp manifest.json extension-build/
cp content.js extension-build/
cp styles.css extension-build/
cp -r dist/* extension-build/
echo "✓ Extension files ready in extension-build/"