#!/usr/bin/env bash
set -euo pipefail

MITM_CERT_SOURCE="${MITMPROXY_CA_CERT_PATH:-/mitmproxy-certs/mitmproxy-ca-cert.pem}"
TRUST_STORE_CERT="/usr/local/share/ca-certificates/mitmproxy-ca-cert.crt"
TARGET_USER="${USERNAME:-agent}"

while [[ ! -f "${MITM_CERT_SOURCE}" ]]; do
  sleep 1
done

mkdir -p "$(dirname "${TRUST_STORE_CERT}")"

if [[ ! -f "${TRUST_STORE_CERT}" ]] || ! cmp -s "${MITM_CERT_SOURCE}" "${TRUST_STORE_CERT}"; then
  install -m 0644 "${MITM_CERT_SOURCE}" "${TRUST_STORE_CERT}"
  update-ca-certificates
fi

if [[ "$#" -eq 0 ]]; then
  set -- sleep infinity
fi

exec sudo -HEu "${TARGET_USER}" -- "$@"
