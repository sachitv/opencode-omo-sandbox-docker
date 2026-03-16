# AGENTS.md

## Purpose

This repository is a sandbox for running OpenCode, or another agentic CLI,
inside a Docker Compose-backed devcontainer with a constrained network boundary.

The main design goal is practical containment:

- the agent works in a normal devcontainer workflow
- outbound traffic is tightly constrained
- model and MCP access are explicit and local
- Git fetch/push is brokered instead of giving raw credentials to the workspace

This is not a VM-grade isolation boundary. Treat it as a carefully constrained
developer sandbox.

## Runtime Architecture

The important services are:

- `workspace`: the devcontainer the agent runs in
- `mitmproxy`: the shared network namespace owner and the only service with
  normal external egress
- `openrouter-proxy`: local OpenAI-compatible proxy for OpenRouter
- `perplexity-mcp`: local HTTP MCP server for Perplexity
- `coredns`: local DNS allowlist resolver for shared-namespace DNS
- `git-broker`: local HTTP MCP service for Git fetch/push using a dedicated
  repo deploy key

The local endpoints expected by the workspace are:

- OpenCode server: `http://127.0.0.1:4096`
- OpenRouter proxy: `http://127.0.0.1:4000/v1`
- Perplexity MCP: `http://127.0.0.1:8081/mcp`
- Git broker MCP: `http://127.0.0.1:8082/mcp`

Important:

- OpenCode is configured on port `4096`, not `4097`
- the host can only reach these through the ports published by `mitmproxy`

## Network Model

`workspace`, `openrouter-proxy`, `perplexity-mcp`, `coredns`, and `git-broker` use:

- `network_mode: "service:mitmproxy"`

That means they are expected to share `mitmproxy`'s network namespace.

Consequences:

- local service-to-service traffic happens on `127.0.0.1`
- DNS traffic on port 53 is redirected to CoreDNS at `127.0.0.53:5353`; the `MITM_OUTPUT` chain is inserted at position 1 of `OUTPUT` so it runs before Docker's own embedded-resolver DNAT rules — if it were appended, Docker would intercept `127.0.0.11:53` traffic first and CoreDNS would be bypassed
- TCP `80` and `443` are redirected through `mitmproxy`
- UDP `80` and `443` are rejected to block QUIC / HTTP/3
- outbound traffic is default-deny except for the explicit exceptions in
  `infra/mitmproxy/entrypoint.sh`
- `git-broker` has a special direct SSH-over-443 exception for GitHub

If one namespace-sharing service can reach `127.0.0.1:<port>` and another
cannot, suspect a stale or inconsistent shared-namespace lifecycle state first.

## Credential Model

Putting real credentials in repo files is not recommended.

The intended model is:

- `OPENROUTER_API_KEY`, `PERPLEXITY_API_KEY`, and `BRAVE_API_KEY` come from the
  host environment or an external secrets file
- the workspace masks the repo-root `.env` path with the tracked
  `.env.example`, so a real host-side repo `.env` should not be visible inside
  the container
- the workspace does not get raw Git push credentials
- GitHub access is handled by `git-broker`
- `git-broker` mounts host-managed deploy-key state from:
  - `~/.local/state/opencode-sandbox`
  - `~/.local/share/opencode-sandbox/keys`

The relevant host-side scripts are:

- `scripts/setup-agent-deploy-key.py`
- `scripts/revoke-agent-deploy-key.py`
- `scripts/devcontainer-initialize-host.sh`
- `scripts/compute-devcontainer-build-fingerprint.py`

`setup-agent-deploy-key.py --ensure` is reconciliation logic, not just existence
checking. It should recreate managed state if the recorded deploy key was
revoked or if the local key files are missing.

## Files That Matter

When changing behavior, start here:

- `docker-compose.yml`
  Service graph, volume mounts, published ports, and `network_mode`
- `.devcontainer/devcontainer.json`
  Devcontainer lifecycle hooks and forwarded ports
- `.devcontainer/Dockerfile`
  Base image, Bun, non-root user, SSH agent disabling
- `.opencode/opencode.jsonc`
  OpenCode server port, model config, MCP endpoints
- `infra/mitmproxy/entrypoint.sh`
  iptables / egress enforcement
- `infra/coredns/Dockerfile`
  CoreDNS image build and generated Corefile packaging
- `infra/coredns/generate-corefile.py`
  build-time generation of CoreDNS allowlist zones from `allow-list.yaml`
- `infra/mitmproxy/allowlist.py`
  allowlist matching logic (host, path, method, normalisation)
- `infra/mitmproxy/allow-list.yaml`
  editable traffic policy — hosts, path allow/deny lists, method restrictions
- `services/openrouter-proxy/server.js`
  OpenRouter-compatible proxy
- `services/perplexity-mcp/http-wrapper.mjs`
  HTTP wrapper around the official Perplexity MCP package
- `services/git-broker/server.ts`
  Git broker MCP server

## Baked Vs Live Config

These files are baked into the `mitmproxy` image at build time:

- `infra/mitmproxy/allowlist.py`
- `infra/mitmproxy/allow-list.yaml`
- `infra/mitmproxy/entrypoint.sh`

So:

- editing them does not change a running container
- rebuild/recreate is required for those changes to take effect

The host init script fingerprints build inputs and forces a Compose teardown on
the next startup when those inputs change. Do not assume simple file edits are
live.

## Known Fragility

This repo intentionally uses a fragile Docker pattern:

- multiple services share `mitmproxy` via `network_mode: "service:mitmproxy"`

This can break under partial rebuilds or container reuse. Typical symptoms:

- `workspace` can reach one local MCP service but not another
- host `localhost` ports appear published but do not respond
- one namespace-sharing service is still running while `mitmproxy` or
  `workspace` has been recreated

If this happens:

1. Check whether `workspace`, `mitmproxy`, and helper services are all up.
2. Compare shared-namespace behavior before blaming credentials.
3. Prefer a full recreate:
   - VS Code: `Dev Containers: Rebuild and Reopen in Container`
   - CLI: `devcontainer up`

The host init script already tries to detect stale namespace references, but
runtime inconsistencies can still happen.

## Git Broker Expectations

`git-broker` is the only service that should perform authenticated Git fetch and
push operations for the repository.

Rules:

- do not mount Git credentials into `workspace`
- do not replace the broker with a PAT in the workspace
- keep GitHub SSH pinned to the broker's controlled path
- if fetch/push fails after MCP connection succeeds, inspect broker auth/policy
- if MCP itself is unreachable, inspect container lifecycle and namespace state

Current implementation details:

- `git-broker` is written in TypeScript and runs on Bun
- it exposes `describe_push_policy`, `fetch_origin`, and `push_current_head`
- it forces GitHub SSH over `ssh.github.com:443`
- it uses a mounted private key, not a mounted host `SSH_AUTH_SOCK`

## MCP Extension Guidance

This repo supports two MCP integration styles:

- `remote` MCP servers exposed on local ports by Compose services
- `local` command-based MCP servers started from inside the workspace

Prefer `remote` MCP servers for this sandbox.

Be careful with Docker-backed `local` MCP servers:

- they require Docker CLI access in the workspace
- they require Docker daemon access in the workspace
- that weakens the boundary more than normal remote MCP services

The optional `weather_docker` entry in `.opencode/opencode.jsonc` is present as
The optional `brave_search_docker` entry in `.opencode/opencode.jsonc` is
present as an example, but it is intentionally disabled by default for that
reason.

## OpenCode Expectations

OpenCode is started manually inside the devcontainer with `opencode serve`.

Rules:

- the expected host port is `4096`
- if `localhost:4096` fails, do not guess `4097`
- if OpenCode is unreachable, first confirm the user actually started
  `opencode serve` inside the devcontainer

## Safety Rules For Agents

- do not store secrets in this repository
- do not add `.env`-based workflows back into the docs or runtime model
- do not attempt to install system packages with sudo — add packages to the `apt-get install` block in `.devcontainer/Dockerfile` and rebuild instead
- do not widen the allowlist or firewall casually
- do not bypass `git-broker` by putting credentials into the workspace
- do not assume policy-file edits are live; many are baked into images
- do not treat host reachability and in-container reachability as equivalent

## Good Validation Steps

Use these when changing behavior:

- `docker compose config`
- `python3 -m py_compile scripts/*.py`
- `docker compose build git-broker`
- `docker run --rm opencode-omo-sandbox-docker-git-broker:latest bun test`
- `cd infra/mitmproxy && uv run pytest test_allowlist.py -v` — allowlist policy logic and security tests
- `cd infra/coredns && uv run pytest test_generate_corefile.py -v` — Corefile generator logic and coverage

When debugging runtime issues, distinguish these paths:

- host -> published `localhost` port
- `workspace` -> `127.0.0.1:<service>`
- service container -> its own local health endpoint

That separation is often what reveals whether the problem is:

- a dead service
- a stale shared namespace
- a published-port problem
- broker credential/policy failure
