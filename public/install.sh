#!/bin/sh
set -e

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

# The release publishes the product name. The lowercase name is the older
# convention, still accepted by the download host, and still what a
# checksums.txt from an older release lists — so ask for the product name and
# be prepared to verify against either.
ASSET="Proofboard-Career-Agent-${OS}-${ARCH}"
LEGACY_ASSET="proofboard-${OS}-${ARCH}"
DOWNLOAD_URL="${RELEASES_HOST}/latest/${ASSET}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Downloading Proofboard CLI (${OS}/${ARCH})..."
curl -fsSL "$DOWNLOAD_URL" -o "${TMP_DIR}/${BIN_NAME}"

echo "Verifying checksum..."
curl -fsSL "${RELEASES_HOST}/latest/checksums.txt" -o "${TMP_DIR}/checksums.txt"

EXPECTED="$(awk -v a="$ASSET" -v b="$LEGACY_ASSET" \
  '$2 == a || $2 == b { print $1; exit }' "${TMP_DIR}/checksums.txt")"

if [ -z "$EXPECTED" ]; then
  echo "No checksum entry found for ${ASSET} in checksums.txt" >&2
  exit 1
fi

# Compare the hash directly rather than piping a checksums line into
# `sha256sum -c`, which matches on the filename in that line. The downloaded
# file is saved under one name and the line may carry the other, and that
# mismatch is a verification failure that has nothing to do with the bytes.
if command -v sha256sum >/dev/null 2>&1; then
  ACTUAL="$(sha256sum < "${TMP_DIR}/${BIN_NAME}" | awk '{print $1}')"
elif command -v shasum >/dev/null 2>&1; then
  ACTUAL="$(shasum -a 256 < "${TMP_DIR}/${BIN_NAME}" | awk '{print $1}')"
else
  echo "Warning: no sha256sum/shasum found, skipping checksum verification." >&2
  ACTUAL="$EXPECTED"
fi

if [ "$ACTUAL" != "$EXPECTED" ]; then
  echo "Checksum verification failed for ${ASSET}." >&2
  echo "  expected $EXPECTED" >&2
  echo "  actual   $ACTUAL" >&2
  exit 1
fi
echo "${ASSET}: OK"

chmod +x "${TMP_DIR}/${BIN_NAME}"

if [ -w "$BIN_DIR" ]; then
  mv "${TMP_DIR}/${BIN_NAME}" "${BIN_DIR}/${BIN_NAME}"
else
  sudo mv "${TMP_DIR}/${BIN_NAME}" "${BIN_DIR}/${BIN_NAME}"
fi

echo "✔ Proofboard CLI installed. Run: proofboard auth"
