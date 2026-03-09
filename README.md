# Opencode Sandbox Devcontainer

This repository contains a Docker Compose-backed devcontainer with an explicit egress boundary:

- `workspace`: the Ubuntu devcontainer you open in VS Code / Dev Containers, with Bun in the base image and OpenCode installed by the devcontainer feature.
- `openrouter-proxy`: an OpenAI-compatible proxy that injects your OpenRouter key.
- `perplexity-mcp`: an HTTP MCP server backed by `@perplexity-ai/mcp-server`.
- `mitmproxy`: the only service with external network access. Everything else sits on an internal-only Docker network and must reach the internet through this proxy.
- `.opencode/opencode.jsonc`: project-level OpenCode config wired to the internal proxy and MCP service.

## Why this layout

The `ai_boundary` Docker network is marked `internal: true`, and the `workspace`, `openrouter-proxy`, and `perplexity-mcp` services all share the `mitmproxy` network namespace. That means they do not get their own egress path at all. Outbound HTTP/HTTPS traffic is redirected with `iptables` inside the shared namespace before the process can bypass the proxy.

The shared namespace is also configured as default-deny for outbound traffic. In practice that means:

- loopback traffic between `workspace`, `openrouter-proxy`, `perplexity-mcp`, and `mitmproxy` is allowed
- DNS is only available through Docker's embedded loopback resolver rather than arbitrary port `53` egress
- TCP `80` and `443` are the only non-local outbound ports permitted, and those client connections are transparently redirected into `mitmproxy`
- all other outbound traffic is rejected

The default allowlist permits:

- `perplexity.ai`
- `api.perplexity.ai`
- `openrouter.ai`
- `api.openrouter.ai`
- `*.opencode.ai`
- common package-manager and source hosts such as GitHub, npm, PyPI, Cargo, Go proxy, RubyGems, and Ubuntu/Debian mirrors

The active policy source lives in [allowed-hosts.yaml](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/infra/mitmproxy/allowed-hosts.yaml). Exact hostnames are matched with a set lookup, and wildcard suffixes can be expressed as entries like `*.opencode.ai`.

## Bring it up

Do not put real credentials in a `.env` file inside this repository if you want the agent sandbox to avoid seeing them. Credentials stored in repo files weaken the boundary and are easy to handle incorrectly.

Recommended approaches:

1. Export `OPENROUTER_API_KEY` and `PERPLEXITY_API_KEY` in the host shell before starting the devcontainer.
2. Or pass secrets from outside the repo with the Dev Container CLI.
3. Then open the repository in a Dev Container from VS Code, or start it with the Dev Container CLI.

Example CLI flow:

```sh
export OPENROUTER_API_KEY=...
export PERPLEXITY_API_KEY=...
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . bash
```

Example with a secrets file stored outside the repo:

```sh
devcontainer up --workspace-folder . --secrets-file /absolute/path/to/devcontainer-secrets.json
```

The current Dev Container CLI on this machine does not provide a `down` subcommand. To stop the devcontainer session from VS Code, use `Dev Containers: Reopen Folder Locally`.

If you need to tear it down from the terminal, use Docker Compose directly:

```sh
docker compose down
```

Use `Dev Containers: Rebuild and Reopen in Container` from VS Code to restart it.

## Deploy Key Automation

For Git push isolation, the preferred model is a dedicated deploy key plus a
dedicated ssh-agent socket that will eventually be mounted only into a narrow
push-broker container, not into the `workspace` container.

The host-side setup helpers are:

- [setup-agent-deploy-key.py](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/scripts/setup-agent-deploy-key.py)
- [revoke-agent-deploy-key.py](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/scripts/revoke-agent-deploy-key.py)

`setup-agent-deploy-key.py` will:

- resolve the current GitHub repository
- record the current `origin` URL and branch as the intended push policy
- generate a fresh `ed25519` keypair on the host
- add the public key to GitHub as a write-enabled deploy key for that repo
- start a dedicated `ssh-agent` socket holding only that key
- write a state file under `~/.local/state/opencode-sandbox/`

Example:

```sh
python3 scripts/setup-agent-deploy-key.py
```

`revoke-agent-deploy-key.py` removes the managed deploy key from GitHub, stops
the dedicated `ssh-agent`, and deletes the generated key material:

```sh
python3 scripts/revoke-agent-deploy-key.py
```

These scripts require:

- `gh auth login` on the host
- repository admin rights, because GitHub deploy keys are managed through the
  repository deploy-key API

This repo does not yet include the push-broker container itself. The scripts
set up the credential side first so that a future broker can mount only the
dedicated `SSH_AUTH_SOCK` instead of inheriting the user's normal host agent.

## Inside the devcontainer

These environment variables are preconfigured:

- `OPENAI_BASE_URL=http://127.0.0.1:4000/v1`
- `PERPLEXITY_MCP_URL=http://127.0.0.1:8081/mcp`
- `NODE_EXTRA_CA_CERTS=/mitmproxy-certs/mitmproxy-ca-cert.pem`

That means:

- OpenAI-compatible clients can target the local OpenRouter proxy without carrying the real key.
- Perplexity MCP is reachable over the Docker network.
- General outbound HTTP(S) traffic is transparently redirected through `mitmproxy` and constrained by the allowlist.
- QUIC / HTTP/3 is blocked by rejecting outbound UDP on ports `80` and `443` in the shared namespace.
- Non-web outbound traffic is blocked by the shared namespace firewall unless it is loopback traffic.
- `workspace` drops `NET_RAW`, so unprivileged processes cannot open raw packet sockets to bypass the normal egress path.

## OpenCode server access

When the devcontainer starts, `.devcontainer/start-opencode-server.sh` launches `opencode serve` using the project config in `.opencode/opencode.jsonc`.

The server listens on `0.0.0.0:4096` inside the shared namespace and is published to your host at:

```text
http://localhost:4096
```

That lets you attach from your local machine with an SDK or CLI client while the actual OpenCode process stays inside the devcontainer boundary.

All published service ports are bound to `127.0.0.1` on the host, so they are only reachable from the local machine rather than every host interface.

## Notes

- The Perplexity container assumes the package exposes `dist/http.js`, which is how the official repository documents HTTP deployment.
- The transparent proxy path now relies on the mitmproxy CA being trusted by the runtime containers. The devcontainer startup script imports that CA into the Ubuntu trust store, and the Node-based helper services use `NODE_EXTRA_CA_CERTS`.
- The devcontainer runs as a non-root `agent` user with tightly scoped passwordless `sudo` only for installing the mitmproxy CA into the container trust store.
- Default host SSH agent forwarding is explicitly disabled inside the devcontainer by blanking `SSH_AUTH_SOCK` and setting `IdentityAgent none` in the container SSH client config.
- The MITM policy logic lives in [allowlist.py](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/infra/mitmproxy/allowlist.py), and the editable host policy lives in [allowed-hosts.yaml](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/infra/mitmproxy/allowed-hosts.yaml).
- Both policy files are copied into the `mitmproxy` image at build time rather than mounted at runtime.
- Editing the policy files in the repo does not affect an already-built or already-running proxy. Rebuild the `mitmproxy` image and recreate the container for policy changes to take effect.
- The MITM base image is pinned to a specific `mitmproxy` release rather than `latest` so rebuilds stay predictable.
