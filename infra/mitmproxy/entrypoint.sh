#!/usr/bin/env bash
set -euo pipefail

PORT="${MITMPROXY_LISTEN_PORT:-8080}"
MITM_USER="mitmproxy"
MITM_UID="$(id -u "${MITM_USER}")"

# Redirect standard web traffic from the shared namespace into mitmproxy before
# the client process can connect directly to external port 80/443.
iptables -t nat -N MITM_OUTPUT 2>/dev/null || true
iptables -t nat -F MITM_OUTPUT
iptables -t nat -C OUTPUT -p tcp -j MITM_OUTPUT 2>/dev/null || \
  iptables -t nat -A OUTPUT -p tcp -j MITM_OUTPUT

iptables -t nat -A MITM_OUTPUT -m owner --uid-owner "${MITM_UID}" -j RETURN
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

# DNS is still needed for the proxy itself to resolve approved upstream hosts.
iptables -A MITM_FILTER_OUT -p udp --dport 53 -j RETURN
iptables -A MITM_FILTER_OUT -p tcp --dport 53 -j RETURN

# Block the usual QUIC / HTTP3 path so clients cannot bypass the transparent TCP
# proxy by talking to upstreams over UDP.
iptables -A MITM_FILTER_OUT -p udp --dport 80 -j REJECT
iptables -A MITM_FILTER_OUT -p udp --dport 443 -j REJECT

# Client processes in the shared namespace may only originate DNS plus web
# traffic that gets transparently redirected into the local proxy.
iptables -A MITM_FILTER_OUT -p tcp --dport 80 -j RETURN
iptables -A MITM_FILTER_OUT -p tcp --dport 443 -j RETURN

# The proxy process itself is only allowed to resolve hosts and then open the
# upstream TCP 80/443 connections needed to service approved requests.
iptables -A MITM_FILTER_OUT -m owner --uid-owner "${MITM_UID}" -p tcp --dport 80 -j RETURN
iptables -A MITM_FILTER_OUT -m owner --uid-owner "${MITM_UID}" -p tcp --dport 443 -j RETURN
iptables -A MITM_FILTER_OUT -m owner --uid-owner "${MITM_UID}" -j REJECT

# Everything else is denied by default for every process sharing this namespace.
iptables -A MITM_FILTER_OUT -j REJECT

exec su -s /bin/bash -c \
  "mitmdump --mode transparent --showhost --listen-host 0.0.0.0 --listen-port ${PORT} -s /opt/mitmproxy/allowlist.py" \
  "${MITM_USER}"
