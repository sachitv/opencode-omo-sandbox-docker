#!/usr/bin/env bash
set -euo pipefail

LOG_DIR="/tmp/opencode"
LOG_FILE="${LOG_DIR}/server.log"

mkdir -p "${LOG_DIR}"

until [[ -f /mitmproxy-certs/mitmproxy-ca-cert.pem ]]; do
  sleep 1
done

if [[ -f /mitmproxy-certs/mitmproxy-ca-cert.pem ]]; then
  sudo cp /mitmproxy-certs/mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/mitmproxy-ca-cert.crt
  sudo update-ca-certificates >/dev/null 2>&1 || true
fi

if pgrep -f "opencode serve" >/dev/null 2>&1; then
  exit 0
fi

nohup opencode serve >>"${LOG_FILE}" 2>&1 &
