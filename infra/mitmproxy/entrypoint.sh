#!/usr/bin/env bash
set -euo pipefail

PORT="${MITMPROXY_LISTEN_PORT:-8080}"
MITM_USER="mitmproxy"
MITM_UID="$(id -u "${MITM_USER}")"
GIT_BROKER_UID="${GIT_BROKER_UID:-10001}"
COREDNS_UID="${COREDNS_UID:-10002}"

# Redirect standard web traffic from the shared namespace into mitmproxy before
# the client process can connect directly to external port 80/443.
iptables -t nat -N MITM_OUTPUT 2>/dev/null || true
iptables -t nat -F MITM_OUTPUT
iptables -t nat -C OUTPUT -p tcp -j MITM_OUTPUT 2>/dev/null || \
  iptables -t nat -A OUTPUT -p tcp -j MITM_OUTPUT
iptables -t nat -C OUTPUT -p udp -j MITM_OUTPUT 2>/dev/null || \
  iptables -t nat -A OUTPUT -p udp -j MITM_OUTPUT

iptables -t nat -A MITM_OUTPUT -m owner --uid-owner "${MITM_UID}" -j RETURN
iptables -t nat -A MITM_OUTPUT -m owner --uid-owner "${COREDNS_UID}" -j RETURN
# The git broker must reach GitHub SSH over 443 directly; do not transparently
# redirect that traffic into the HTTP MITM.
iptables -t nat -A MITM_OUTPUT -m owner --uid-owner "${GIT_BROKER_UID:-10001}" -p tcp --dport 443 -j RETURN
iptables -t nat -A MITM_OUTPUT -p udp --dport 53 -j DNAT --to-destination 127.0.0.53:5353
iptables -t nat -A MITM_OUTPUT -p tcp --dport 53 -j DNAT --to-destination 127.0.0.53:5353
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

iptables -A MITM_FILTER_OUT ! -d 127.0.0.0/8 -p udp --dport 53 -j REJECT
iptables -A MITM_FILTER_OUT ! -d 127.0.0.0/8 -p tcp --dport 53 -j REJECT

# DNS queries are redirected to CoreDNS on loopback by the NAT DNAT rules
# above. CoreDNS itself is exempt from DNAT (uid RETURN in MITM_OUTPUT), so it
# is the only process that reaches Docker's embedded resolver on 127.0.0.11:53.
# No extra FILTER rule is needed: 127.0.0.11 is covered by the loopback RETURN
# above, and non-CoreDNS port-53 traffic never arrives at 127.0.0.11 because
# the NAT DNAT redirects it to 127.0.0.53:5353 first.

iptables -A MITM_FILTER_OUT -p tcp --dport 853 -j REJECT
iptables -A MITM_FILTER_OUT -p udp --dport 5353 -j REJECT
iptables -A MITM_FILTER_OUT -p tcp --dport 8853 -j REJECT

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

# IPv6 is not used in this sandbox (Docker networks have no IPv6 configured).
# Block all IPv6 output as a blanket measure so that environmental drift
# (e.g. a Docker daemon with IPv6 enabled) cannot create an unfiltered egress
# path that bypasses the IPv4 rules above.
ip6tables -C OUTPUT -j REJECT 2>/dev/null || \
  ip6tables -A OUTPUT -j REJECT

exec su -s /bin/bash -c \
  "mitmdump --mode transparent --showhost --listen-host 0.0.0.0 --listen-port ${PORT} -s /opt/mitmproxy/allowlist.py" \
  "${MITM_USER}"
