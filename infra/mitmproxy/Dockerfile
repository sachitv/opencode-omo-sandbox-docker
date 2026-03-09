# syntax=docker/dockerfile:1.20.0

# Pin mitmproxy to a specific stable release so the network boundary does not
# silently change under us on rebuild.
FROM mitmproxy/mitmproxy:12.2.1

USER root

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN apt-get update && \
    # PyYAML backs the baked-in host policy parser used by allowlist.py.
    apt-get install -y --no-install-recommends iptables ca-certificates python3-pip && \
    python3 -m pip install --break-system-packages --no-cache-dir pyyaml && \
    rm -rf /var/lib/apt/lists/*

# Keep the policy and firewall scripts in normal source files so the image
# build stays declarative and the runtime behavior is easy to audit.
COPY allowlist.py /opt/mitmproxy/allowlist.py
COPY allowed-hosts.yaml /opt/mitmproxy/allowed-hosts.yaml
COPY entrypoint.sh /opt/mitmproxy/entrypoint.sh

RUN chmod +x /opt/mitmproxy/entrypoint.sh

ENTRYPOINT ["/opt/mitmproxy/entrypoint.sh"]
