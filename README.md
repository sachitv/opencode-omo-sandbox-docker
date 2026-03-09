# Opencode Sandbox Devcontainer

This repository sets up a devcontainer for running OpenCode, or another agentic
CLI, inside a constrained Docker sandbox.

The goal is not perfect isolation. The goal is a practical environment with:

- a normal editor and devcontainer workflow
- a high-confidence egress boundary for the agent
- explicit MCP and model access paths
- Git access brokered separately from the main workspace
- host-managed credentials that do not live in the workspace itself

In short: the agent should be able to work, but it should not be able to talk
to arbitrary external services or receive broad Git credentials by default.

## What This Project Tries To Achieve

This setup is meant for experimenting with agentic coding tools without giving
them a normal unrestricted developer environment.

The intended security properties are:

- the agent runs in a devcontainer, not directly on the host
- most outbound traffic is forced through a shared `mitmproxy` boundary
- outbound destinations are limited by a build-time allowlist
- Git fetch/push is handled by a separate `git-broker` MCP service
- the workspace does not receive raw Git push credentials
- host secrets should stay outside the repository

Important limit:

- this is a containment-oriented developer sandbox, not a hardened VM boundary
- if you intentionally grant broad privileges, the boundary weakens accordingly

## Architecture

The main runtime components are:

- `workspace`: the Ubuntu devcontainer you open in VS Code / Dev Containers
- `openrouter-proxy`: an OpenAI-compatible proxy that injects your OpenRouter key
- `perplexity-mcp`: an HTTP MCP server backed by `@perplexity-ai/mcp-server`
- `brave-search-mcp`: an HTTP MCP server backed by the official Brave Search MCP image
- `git-broker`: a narrow MCP service for Git fetch/push using a dedicated repo deploy key
- `mitmproxy`: the only service with normal external egress
- `.opencode/opencode.jsonc`: project-level OpenCode config that points OpenCode at the local proxy and MCP services

### Service Topology

```mermaid
flowchart LR
  Host[Host machine]
  VSCode[VS Code / devcontainer CLI]
  Workspace[workspace<br/>OpenCode runs here]
  OpenRouter[openrouter-proxy<br/>OpenAI-compatible]
  Perplexity[perplexity-mcp]
  Brave[brave-search-mcp]
  GitBroker[git-broker]
  Mitm[mitmproxy]
  Internet[Allowed external services]

  Host --> VSCode
  VSCode --> Workspace

  Workspace -->|:4000/v1| OpenRouter
  Workspace -->|:8081/mcp| Perplexity
  Workspace -->|:8083/mcp| Brave
  Workspace -->|:8082/mcp| GitBroker

  Workspace -. shares netns .-> Mitm
  OpenRouter -. shares netns .-> Mitm
  Perplexity -. shares netns .-> Mitm
  Brave -. shares netns .-> Mitm
  GitBroker -. shares netns .-> Mitm

  Mitm --> Internet
```

### Network Boundary

The `ai_boundary` Docker network is marked `internal: true`. The `workspace`,
`openrouter-proxy`, `perplexity-mcp`, `brave-search-mcp`, and `git-broker` services all use
`network_mode: "service:mitmproxy"`, so they share the `mitmproxy` network
namespace instead of getting their own independent egress path.

Inside that shared namespace:

- loopback traffic between the local services is allowed
- Docker DNS is allowed
- TCP `80` and `443` are transparently redirected into `mitmproxy`
- UDP `80` and `443` are rejected to block QUIC / HTTP/3
- non-local outbound traffic is default-deny unless explicitly allowed
- the `git-broker` gets a narrow direct SSH-over-443 exception for GitHub

```mermaid
flowchart TD
  Proc[Process in workspace / helper service]
  Rules[iptables in shared namespace]
  Loopback[Loopback traffic]
  Redirect[Transparent redirect to mitmproxy]
  BrokerSSH[git-broker SSH over 443]
  Block[Rejected]
  Allowlist[mitmproxy allowlist]
  Upstream[Allowed upstream hosts]

  Proc --> Rules
  Rules -->|127.0.0.1| Loopback
  Rules -->|TCP 80/443| Redirect
  Rules -->|git-broker uid| BrokerSSH
  Rules -->|everything else| Block
  Redirect --> Allowlist
  Allowlist -->|allowed host| Upstream
  Allowlist -->|blocked host| Block
```

### Git Credential Boundary

Git access is intentionally separated from the main workspace.

- the workspace does not get a PAT
- the workspace does not get a deploy key
- the broker reads host-managed deploy-key state
- the broker mounts the dedicated private key read-only
- the broker exposes MCP tools rather than raw credentials

```mermaid
flowchart LR
  HostState[Host deploy-key state<br/>~/.local/state/opencode-sandbox]
  HostKeys[Host private key<br/>~/.local/share/opencode-sandbox/keys]
  Broker[git-broker]
  Workspace[workspace]
  GitHub[GitHub repo]

  HostState --> Broker
  HostKeys --> Broker
  Workspace -->|MCP fetch / push| Broker
  Broker -->|validated Git ops| GitHub
  Workspace -. no raw Git creds .-> GitHub
```

### Allowed Hosts

The outbound hostname policy is baked into the `mitmproxy` image from
[allowed-hosts.yaml](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/infra/mitmproxy/allowed-hosts.yaml).

- exact hostnames are matched with a set lookup
- wildcard suffixes are supported with entries like `*.opencode.ai`
- policy changes require rebuilding the `mitmproxy` image

The default allowlist includes:

- OpenRouter and Perplexity endpoints
- `*.opencode.ai`
- GitHub endpoints needed for source fetches and metadata
- common package-manager hosts such as npm, PyPI, Cargo, Go proxy, RubyGems, and Ubuntu/Debian mirrors

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

## MCP Configuration

The project-level MCP configuration lives in
[.opencode/opencode.jsonc](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/.opencode/opencode.jsonc).

Right now it includes:

- `perplexity`: a remote MCP served by the local `perplexity-mcp` container
- `brave_search`: a remote MCP served by the local `brave-search-mcp` container
- `git_broker`: a remote MCP served by the local `git-broker` container

### Optional Brave Search MCP

The Brave Search service uses the official Brave Search MCP server:

- GitHub: https://github.com/brave/brave-search-mcp-server
- Image: `mcp/brave-search:latest`

It is exposed to OpenCode as a normal remote MCP:

```jsonc
"brave_search": {
  "type": "remote",
  "url": "http://127.0.0.1:8083/mcp",
  "enabled": false
}
```

The container itself is started by Docker Compose, not by OpenCode.

It also requires a Brave Search API key to be present as `BRAVE_API_KEY`.

### Adding More MCP Servers

There are two patterns in this repo:

1. Remote MCP services, exposed on `127.0.0.1` inside the shared namespace

   This is the preferred pattern for this sandbox.

   Example:

```jsonc
"some_remote_server": {
  "type": "remote",
  "url": "http://127.0.0.1:8089/mcp",
  "enabled": true,
  "timeout": 15000
}
```

2. Local command-based MCP servers

   This is useful for simple utilities or one-off tools, but it runs the
   command from inside the workspace container.

   Example:

```jsonc
"some_local_server": {
  "type": "local",
  "command": ["npx", "-y", "some-mcp-package"],
  "enabled": true,
  "timeout": 15000
}
```

For Docker-backed local MCP servers, be explicit about the tradeoff:

- they require a working `docker` binary in the workspace
- they require access to a Docker daemon socket
- that substantially weakens the sandbox boundary

Recommendation:

- prefer remote MCP services added to `docker-compose.yml`
- use local command MCPs only when they do not require broad new privileges
- treat Docker-backed local MCPs as opt-in and higher risk

When adding a new MCP server that makes outbound network calls, also update
[allowed-hosts.yaml](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/infra/mitmproxy/allowed-hosts.yaml)
with the upstream hosts it needs.

Otherwise the container may start successfully but all real requests will still
be blocked by the `mitmproxy` allowlist.

Because the allowlist is baked into the `mitmproxy` image, changing it requires
a rebuild/recreate before the new MCP server can actually reach those hosts.

## Deploy Key Automation

For Git isolation, the preferred model is a dedicated deploy key whose private
key is mounted read-only only into a narrow `git-broker` container, not into
the `workspace` container.

The host-side setup helpers are:

- [setup-agent-deploy-key.py](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/scripts/setup-agent-deploy-key.py)
- [revoke-agent-deploy-key.py](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/scripts/revoke-agent-deploy-key.py)
- [devcontainer-initialize-host.sh](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/scripts/devcontainer-initialize-host.sh)

`setup-agent-deploy-key.py` will:

- resolve the current GitHub repository
- record the current `origin` URL and branch as the intended push policy
- generate a fresh `ed25519` keypair on the host
- add the public key to GitHub as a write-enabled deploy key for that repo
- write a state file under `~/.local/state/opencode-sandbox/`

Example:

```sh
python3 scripts/setup-agent-deploy-key.py
```

`devcontainer up` now runs the host-side initializer automatically before any
containers are built. That initializer will:

- ensure a managed deploy-key state already exists, or create one if it does not
- detect stale shared-network namespace containers from previous runs and only
  then run `docker compose down --remove-orphans`
- compare a fingerprint of the devcontainer and service build inputs against the
  previous startup, and tear Compose down if those baked inputs changed

So the first `devcontainer up` on a new host checkout now assumes:

- `gh auth login` has already been completed on the host
- the authenticated user has permission to manage deploy keys on the repository

### What The Host Init Script Does

If the shell script is hard to read, the behavior is simpler than it looks.
[devcontainer-initialize-host.sh](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/scripts/devcontainer-initialize-host.sh)
runs on the host before the devcontainer starts and does exactly two things:

1. It runs [setup-agent-deploy-key.py](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/scripts/setup-agent-deploy-key.py)
   with `--ensure`.
   That means:
   - if a managed deploy key already exists for this repository, leave it alone
   - if it does not exist yet, create it and record the deploy-key state

2. It checks whether any of the namespace-sharing services:
   - `workspace`
   - `openrouter-proxy`
   - `perplexity-mcp`
   - `git-broker`

   still point at a dead `mitmproxy` network namespace from an older run.

That second check matters because those services use Docker's
`network_mode: "service:mitmproxy"` pattern. After a rebuild, Docker can leave a
container referring to an old container id that no longer exists. When that
happens, the next `devcontainer up` can fail with a "joining network namespace"
error.

The script also fingerprints the files that affect the devcontainer images and
service images, including:

- [docker-compose.yml](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/docker-compose.yml)
- [.devcontainer](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/.devcontainer)
- [infra](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/infra)
- [services](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/services)

If any of those files change, such as
[allowed-hosts.yaml](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/infra/mitmproxy/allowed-hosts.yaml),
the script forces a Compose teardown before the next startup so the changed
image build inputs are not masked by container reuse.

The script detects that case like this:

- ask Docker for the current container id for each service
- inspect its configured network mode
- if the network mode looks like `container:<id>`, inspect that target id too
- if the target container no longer exists, run:

```sh
docker compose down --remove-orphans
```

If no stale namespace reference exists, it does nothing and startup continues
normally.

`revoke-agent-deploy-key.py` removes the managed deploy key from GitHub and
deletes the generated key material:

```sh
python3 scripts/revoke-agent-deploy-key.py
```

These scripts require:

- `gh auth login` on the host
- repository admin rights, because GitHub deploy keys are managed through the
  repository deploy-key API

The broker now mounts only the dedicated host state directory and exposes a
small MCP surface instead of raw Git credentials inside the workspace.

## Inside the devcontainer

These environment variables are preconfigured:

- `OPENAI_BASE_URL=http://127.0.0.1:4000/v1`
- `PERPLEXITY_MCP_URL=http://127.0.0.1:8081/mcp`
- `GIT_BROKER_MCP_URL=http://127.0.0.1:8082/mcp`
- `BRAVE_SEARCH_MCP_URL=http://127.0.0.1:8083/mcp`
- `NODE_EXTRA_CA_CERTS=/mitmproxy-certs/mitmproxy-ca-cert.pem`

That means:

- OpenAI-compatible clients can target the local OpenRouter proxy without carrying the real key.
- Perplexity MCP is reachable over the Docker network.
- Brave Search MCP is reachable over the Docker network.
- The Git broker MCP can fetch from origin and push the current branch using the dedicated deploy key without exposing that key in the workspace container.
- General outbound HTTP(S) traffic is transparently redirected through `mitmproxy` and constrained by the allowlist.
- QUIC / HTTP/3 is blocked by rejecting outbound UDP on ports `80` and `443` in the shared namespace.
- Non-web outbound traffic is blocked by the shared namespace firewall unless it is loopback traffic.
- `workspace` drops `NET_RAW`, so unprivileged processes cannot open raw packet sockets to bypass the normal egress path.

## OpenCode server access

OpenCode is not started automatically anymore. Start it manually inside the
devcontainer when you want it:

```sh
opencode serve
```

The project config in `.opencode/opencode.jsonc` binds the server to
`0.0.0.0:4096`, and that port is published to your host at:

```text
http://localhost:4096
```

That lets you attach from your local machine with an SDK or CLI client while
the actual OpenCode process stays inside the devcontainer boundary.

All published service ports are bound to `127.0.0.1` on the host, so they are only reachable from the local machine rather than every host interface.

## Notes

- The Perplexity container assumes the package exposes `dist/http.js`, which is how the official repository documents HTTP deployment.
- The transparent proxy path relies on the helper services trusting the
  mitmproxy CA via `NODE_EXTRA_CA_CERTS`.
- The git broker is the only non-mitm service in the shared namespace that gets direct GitHub SSH-over-443 egress, and that exception is limited to the broker's dedicated uid in the firewall rules.
- The devcontainer runs as a non-root `agent` user with tightly scoped passwordless `sudo` only for installing the mitmproxy CA into the container trust store.
- Default host SSH agent forwarding is explicitly disabled inside the devcontainer by blanking `SSH_AUTH_SOCK` and setting `IdentityAgent none` in the container SSH client config.
- The MITM policy logic lives in [allowlist.py](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/infra/mitmproxy/allowlist.py), and the editable host policy lives in [allowed-hosts.yaml](/Users/sachitvithaldas/Development/opencode-omo-sandbox-docker/infra/mitmproxy/allowed-hosts.yaml).
- Both policy files are copied into the `mitmproxy` image at build time rather than mounted at runtime.
- Editing the policy files in the repo does not affect an already-built or already-running proxy. Rebuild the `mitmproxy` image and recreate the container for policy changes to take effect.
- The MITM base image is pinned to a specific `mitmproxy` release rather than `latest` so rebuilds stay predictable.
