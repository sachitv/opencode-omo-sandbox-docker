#!/usr/bin/env bash
set -euo pipefail

# This runs on the host before the devcontainer build/start sequence. Keep the
# deploy-key setup here so GitHub API access and key management never have to
# happen inside the workspace container.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
STATE_DIR="${REPO_ROOT}/.data"
FINGERPRINT_STATE="${STATE_DIR}/devcontainer-build-fingerprint.json"

cd "${REPO_ROOT}"

# Ensure the dedicated repo-scoped deploy key exists and is valid for the
# currently checked-out branch. `--ensure` creates the key on first run and
# becomes a no-op if the state is still usable for the current branch.
# `--replace-if-branch-changed` triggers automatic rotation when the recorded
# branch differs from the current HEAD branch — the old deploy key is revoked
# and a fresh one is created that reflects the new branch.
python3 scripts/setup-agent-deploy-key.py --ensure --replace-if-branch-changed

# If the build inputs changed since the last devcontainer startup, tear the
# Compose project down first so the CLI cannot reuse old containers with stale
# images under its later `docker compose up --no-recreate` step.
mkdir -p "${STATE_DIR}"
current_fingerprint="$(python3 scripts/compute-devcontainer-build-fingerprint.py)"
previous_fingerprint="$(cat "${FINGERPRINT_STATE}" 2>/dev/null || true)"
needs_compose_down=0

if [[ "${current_fingerprint}" != "${previous_fingerprint}" ]]; then
  needs_compose_down=1
fi

# These services use network_mode: "service:mitmproxy". The devcontainer CLI
# starts compose with --no-recreate, which can leave stale containers pointing
# at an old mitmproxy namespace after a rebuild. Only tear the project down when
# one of those namespace-linked containers still references a missing container.
for service in workspace openrouter-proxy perplexity-mcp git-broker; do
  # Ask Compose for the concrete container id of the service if it already
  # exists from a previous run. No id means there is nothing to inspect yet.
  container_id="$(docker compose ps -q "${service}" 2>/dev/null || true)"
  if [[ -z "${container_id}" ]]; then
    continue
  fi

  # Services that share mitmproxy's namespace show up as `container:<id>`.
  # Anything else is not relevant to this stale-namespace cleanup path.
  network_mode="$(docker inspect --format '{{.HostConfig.NetworkMode}}' "${container_id}" 2>/dev/null || true)"
  if [[ "${network_mode}" != container:* ]]; then
    continue
  fi

  # Extract the referenced namespace owner id and verify it still exists. If it
  # is gone, Docker will fail the next `devcontainer up` with a "joining network
  # namespace" error unless we clear the stale Compose state first.
  target_id="${network_mode#container:}"
  if ! docker inspect "${target_id}" >/dev/null 2>&1; then
    needs_compose_down=1
    break
  fi
done

if [[ "${needs_compose_down}" -eq 1 ]]; then
  docker compose down --remove-orphans || true
fi

printf '%s\n' "${current_fingerprint}" >"${FINGERPRINT_STATE}"
