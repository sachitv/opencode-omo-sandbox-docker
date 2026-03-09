#!/usr/bin/env bash
set -euo pipefail

PORT="${MITMPROXY_LISTEN_PORT:-8080}"
MITM_USER="mitmproxy"
MITM_UID="$(id -u "${MITM_USER}")"
GIT_BROKER_UID="${GIT_BROKER_UID:-10001}"

# Redirect standard web traffic from the shared namespace into mitmproxy before
# the client process can connect directly to external port 80/443.
iptables -t nat -N MITM_OUTPUT 2>/dev/null || true
iptables -t nat -F MITM_OUTPUT
iptables -t nat -C OUTPUT -p tcp -j MITM_OUTPUT 2>/dev/null || \
  iptables -t nat -A OUTPUT -p tcp -j MITM_OUTPUT

iptables -t nat -A MITM_OUTPUT -m owner --uid-owner "${MITM_UID}" -j RETURN
# The git broker must reach GitHub SSH over 443 directly; do not transparently
# redirect that traffic into the HTTP MITM.
iptables -t nat -A MITM_OUTPUT -m owner --uid-owner "${GIT_BROKER_UID:-10001}" -p tcp --dport 443 -j RETURN
iptables -t nat -A MITM_OUTPUT -d 127.0.0.0/8 -j RETURN
iptables -t nat -A MITM_OUTPUT -p tcp --dport 80 -j REDIRECT --to-ports "${PORT}"
iptables -t nat -A MITM_OUTPUT -p tcp --dport 443 -j REDIRECT --to-ports "${PORT}"

iptables -N MITM_FILTER_OUT 2>/dev/null || true
iptables -F MITM_FILTER_OUT
iptables -C OUTPUT -j MITM_FILTER_OUT 2>/dev/null || iptables -A OUTPUT -j MITM_FILTER_OUT

# Keep traffic between the colocated services available over loopback and allow
# return packets for connections we have already approved.
iptables -A MITM_FILTER_OUT -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
iptables -A MITM_FILTER_OUT -d 127.0.0.0/8 -j RETURN

# DNS is only allowed through Docker's loopback resolver (typically
# 127.0.0.11), which is already covered by the loopback allow rule above.
# Do not allow arbitrary port 53 egress, or the workspace can use DNS as a
# generic exfiltration channel.

# Block the usual QUIC / HTTP3 path so clients cannot bypass the transparent TCP
# proxy by talking to upstreams over UDP.
iptables -A MITM_FILTER_OUT -p udp --dport 80 -j REJECT
iptables -A MITM_FILTER_OUT -p udp --dport 443 -j REJECT

# Client-side web traffic has already been redirected to loopback by NAT, so
# the loopback RETURN above is what permits it. Only the proxy UID itself
# should ever open upstream TCP 80/443 connections.
iptables -A MITM_FILTER_OUT -m owner --uid-owner "${MITM_UID}" -p tcp --dport 80 -j RETURN
iptables -A MITM_FILTER_OUT -m owner --uid-owner "${MITM_UID}" -p tcp --dport 443 -j RETURN
iptables -A MITM_FILTER_OUT -m owner --uid-owner "${MITM_UID}" -j REJECT

# The git broker gets the only non-HTTP egress exception in the shared
# namespace so it can reach GitHub SSH over port 443 with its dedicated deploy
# key without giving raw Git credentials to the workspace container.
iptables -A MITM_FILTER_OUT -m owner --uid-owner "${GIT_BROKER_UID}" -p tcp --dport 443 -j RETURN

# Everything else is denied by default for every process sharing this namespace.
iptables -A MITM_FILTER_OUT -j REJECT

exec su -s /bin/bash -c \
  "mitmdump --mode transparent --showhost --listen-host 0.0.0.0 --listen-port ${PORT} -s /opt/mitmproxy/allowlist.py" \
  "${MITM_USER}"
