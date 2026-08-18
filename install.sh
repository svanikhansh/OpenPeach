#!/bin/sh
set -e

REPO="svanikhansh/OpenPeach"
PACKAGE="openpeach"

echo "OpenPeach Installer"
echo "===================="

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required but not installed."
  echo "Install Node.js >= 18 from https://nodejs.org/ and try again."
  exit 1
fi

NODE_MAJOR=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Error: Node.js >= 18 is required (found $(node -v))."
  exit 1
fi

echo "Node.js $(node -v) detected."

if command -v npm >/dev/null 2>&1; then
  echo "Installing OpenPeach via npm..."

  if npm view "$PACKAGE" version >/dev/null 2>&1; then
    npm install -g "$PACKAGE"
  else
    echo "npm package '$PACKAGE' not found; installing from GitHub instead..."
    npm install -g "github:$REPO"
  fi
else
  echo "Error: npm is required but not installed."
  exit 1
fi

if command -v openpeach >/dev/null 2>&1; then
  echo ""
  echo "OpenPeach installed successfully."
  echo "Run it with: openpeach"
else
  echo ""
  echo "Installation complete, but the 'openpeach' command is not in your PATH."
  echo "You may need to reload your shell or add your global npm bin to PATH."
fi
