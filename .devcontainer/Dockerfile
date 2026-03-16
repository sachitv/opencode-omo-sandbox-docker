# syntax=docker/dockerfile:1.20.0

# Use the official Bun image as a lightweight source for the Bun binary only.
FROM oven/bun:1 AS bun-runtime

FROM ubuntu:24.04

ARG DEBIAN_FRONTEND=noninteractive
ARG USERNAME=agent

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      git \
      iproute2 \
      iputils-ping \
      less \
      procps \
      python3 \
      python3-pip \
      sudo && \
    rm -rf /var/lib/apt/lists/*

# Copy Bun from the upstream image instead of installing it via a curl script.
COPY --from=bun-runtime /usr/local/bin/bun /usr/local/bin/bun

# Disable implicit host SSH agent use inside the devcontainer. Any Git push
# credentials should be mounted explicitly rather than inherited from VS Code.
RUN ln -sf /usr/local/bin/bun /usr/local/bin/bunx && \
    mkdir -p /etc/ssh/ssh_config.d && \
    printf 'Host *\n  IdentityAgent none\n  ForwardAgent no\n' >/etc/ssh/ssh_config.d/99-no-agent.conf && \
    # Dev Containers will reconcile the remote user's UID/GID with the host.
    if ! id -u "${USERNAME}" >/dev/null 2>&1; then \
      useradd --create-home --shell /bin/bash "${USERNAME}"; \
    fi && \
    # Grant the agent passwordless sudo for one operation only:
    #   - mitmproxy CA cert installation (required at container start)
    # Package installation must go through the Dockerfile and a rebuild.
    # Granting sudo apt-get is a privilege-escalation path: apt-get accepts
    # -o flags that inject hook commands executed as root.
    echo "${USERNAME} ALL=(root) NOPASSWD: /bin/cp /mitmproxy-certs/mitmproxy-ca-cert.pem /usr/local/share/ca-certificates/mitmproxy-ca.crt, /usr/sbin/update-ca-certificates" \
        > /etc/sudoers.d/${USERNAME} && \
    chmod 0440 /etc/sudoers.d/${USERNAME}

USER ${USERNAME}
