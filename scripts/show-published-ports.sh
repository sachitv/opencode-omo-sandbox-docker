#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

services=(
  "OpenCode 4096"
  "OpenRouter 4000"
  "Perplexity MCP 8081"
  "Git Broker MCP 8082"
  "Brave Search MCP 8083"
  "mitmproxy 8080"
)

for entry in "${services[@]}"; do
  name="${entry% *}"
  port="${entry##* }"
  mapping="$(docker compose port mitmproxy "${port}" 2>/dev/null || true)"

  if [[ -z "${mapping}" ]]; then
    printf '%-18s not published\n' "${name}"
    continue
  fi

  printf '%-18s %s\n' "${name}" "${mapping}"
done
