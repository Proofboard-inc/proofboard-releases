#!/bin/sh
set -e

REPO="Proofboard-inc/proofboard-cli"
RELEASES_HOST="https://releases.proofboard.io"
BIN_DIR="/usr/local/bin"
BIN_NAME="proofboard"

os() {
  case "$(uname -s)" in
    Darwin) echo "darwin" ;;
    Linux) echo "linux" ;;
    *) echo "unsupported" ;;
  esac
}

arch() {
  case "$(uname -m)" in
    x86_64|amd64) echo "amd64" ;;
    arm64|aarch64) echo "arm64" ;;
    *) echo "unsupported" ;;
  esac
}

OS="$(os)"
ARCH="$(arch)"

if [ "$OS" = "unsupported" ] || [ "$ARCH" = "unsupported" ]; then
  echo "Proofboard CLI: unsupported platform ($(uname -s) $(uname -m))." >&2
  exit 1
fi

ASSET="proofboard-${OS}-${ARCH}"
DOWNLOAD_URL="${RELEASES_HOST}/latest/${ASSET}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Downloading Proofboard CLI (${OS}/${ARCH})..."
curl -fsSL "$DOWNLOAD_URL" -o "${TMP_DIR}/${ASSET}"

echo "Verifying checksum..."
curl -fsSL "${RELEASES_HOST}/latest/checksums.txt" -o "${TMP_DIR}/checksums.txt"

CHECKSUM_LINE="$(awk -v f="$ASSET" '$2 == f' "${TMP_DIR}/checksums.txt")"
if [ -z "$CHECKSUM_LINE" ]; then
  echo "No checksum entry found for ${ASSET} in checksums.txt" >&2
  exit 1
fi

if command -v sha256sum >/dev/null 2>&1; then
  ( cd "$TMP_DIR" && echo "$CHECKSUM_LINE" | sha256sum -c - ) \
    || { echo "Checksum verification failed." >&2; exit 1; }
elif command -v shasum >/dev/null 2>&1; then
  ( cd "$TMP_DIR" && echo "$CHECKSUM_LINE" | shasum -a 256 -c - ) \
    || { echo "Checksum verification failed." >&2; exit 1; }
else
  echo "Warning: no sha256sum/shasum found, skipping checksum verification." >&2
fi

mv "${TMP_DIR}/${ASSET}" "${TMP_DIR}/${BIN_NAME}"
chmod +x "${TMP_DIR}/${BIN_NAME}"

if [ -w "$BIN_DIR" ]; then
  mv "${TMP_DIR}/${BIN_NAME}" "${BIN_DIR}/${BIN_NAME}"
else
  sudo mv "${TMP_DIR}/${BIN_NAME}" "${BIN_DIR}/${BIN_NAME}"
fi

echo "✔ Proofboard CLI installed. Run: proofboard auth"