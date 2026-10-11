#!/bin/sh
# Renders each concept page at 1600x1000 @2x after its entrance motion settles.
cd "$(dirname "$0")"
for page in ${@:-*.html}; do
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
    --window-size=1600,1000 --force-device-scale-factor=2 --virtual-time-budget=5000 \
    --screenshot="shots/${page%.html}.png" "file://$PWD/$page" 2>/dev/null
done
