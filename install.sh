#!/bin/sh
set -eu

# Security note: this script is intended to be fetched via HTTPS and reviewed
# before execution. Do not pipe directly from an untrusted source.

REPO="svanikhansh/OpenPeach"
PACKAGE="openpeach"
TMP_DIR=""
PM=""

cleanup() {
  if [ -n "${TMP_DIR:-}" ] && [ -d "$TMP_DIR" ]; then
    rm -rf "$TMP_DIR"
  fi
}

trap cleanup EXIT

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

make_temp_dir() {
  if command_exists mktemp; then
    mktemp -d
  else
    dir="/tmp/openpeach-install-$$"
    mkdir -p "$dir"
    echo "$dir"
  fi
}

download() {
  url="$1"
  output="$2"
  if command_exists curl; then
    curl -fsSL "$url" -o "$output"
  elif command_exists wget; then
    wget -q "$url" -O "$output"
  else
    echo "Error: curl or wget is required to download the GitHub fallback tarball."
    return 1
  fi
}

detect_package_manager() {
  if command_exists npm; then
    echo "npm"
  elif command_exists pnpm; then
    echo "pnpm"
  elif command_exists yarn; then
    echo "yarn"
  else
    echo ""
  fi
}

install_global() {
  spec="$1"
  if [ "$PM" = "yarn" ]; then
    yarn_major=$(yarn --version | cut -d. -f1)
    if [ "$yarn_major" = "1" ]; then
      yarn global add "$spec"
    else
      echo "Error: Yarn $yarn_major does not support global installation. Use npm or pnpm instead."
      return 1
    fi
  else
    "$PM" install -g "$spec"
  fi
}

echo "OpenPeach Installer"
echo "===================="

if ! command_exists node; then
  echo "Error: Node.js is required but not installed."
  echo "Install Node.js >= 18 from https://nodejs.org/ and try again."
  exit 1
fi

NODE_MAJOR=$(node -v | sed 's/^v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Error: Node.js >= 18 is required (found $(node -v))."
  exit 1
fi

echo "Node.js $(node -v) detected."

PM=$(detect_package_manager)
if [ -z "$PM" ]; then
  echo "Error: npm, pnpm, or yarn is required but none were found."
  exit 1
fi

echo "Using package manager: $PM"

install_from_registry() {
  echo "Trying registry ($PACKAGE) via $PM..."
  install_global "$PACKAGE"
}

install_from_github_pm() {
  echo "Trying GitHub via $PM (github:$REPO)..."
  install_global "github:$REPO"
}

install_from_github_tarball() {
  echo "Trying direct GitHub tarball download..."

  TMP_DIR=$(make_temp_dir)
  TARBALL="$TMP_DIR/openpeach.tar.gz"

  if ! download "https://github.com/$REPO/archive/refs/heads/main.tar.gz" "$TARBALL"; then
    return 1
  fi

  if ! tar -xzf "$TARBALL" -C "$TMP_DIR"; then
    echo "Error: failed to extract tarball."
    return 1
  fi

  EXTRACTED="$TMP_DIR/OpenPeach-main"
  if [ ! -d "$EXTRACTED" ]; then
    echo "Error: extracted directory not found."
    return 1
  fi

  echo "Installing from downloaded source..."
  (cd "$EXTRACTED" && install_global .)
}

INSTALLED=false

if install_from_registry; then
  INSTALLED=true
elif install_from_github_pm; then
  INSTALLED=true
elif install_from_github_tarball; then
  INSTALLED=true
fi

if [ "$INSTALLED" != "true" ]; then
  echo ""
  echo "Error: installation failed."
  echo "Please check your network connection and try again, or install manually:"
  echo "  npm install -g $PACKAGE"
  echo "  pnpm install -g $PACKAGE"
  echo "  yarn global add $PACKAGE"
  echo "  npm install -g github:$REPO"
  exit 1
fi

if command_exists peach; then
  echo ""
  echo "OpenPeach installed successfully."
  echo "Run it with: peach"
else
  echo ""
  echo "Installation complete, but the 'peach' command is not in your PATH."
  echo "You may need to reload your shell or add your global npm bin to PATH."
fi
