export default function Slide15SharedNetworkNamespace() {
  return (
    <div className="slide">
      <h2>🔗 The Shared Network Namespace</h2>
      <p className="lede">One Docker trick. One policy choke point.</p>
      <div className="grid two-up" style={{ marginTop: '1em', fontSize: '1.1em' }}>
        <div className="card">
          <pre style={{ margin: 0 }}><code className="language-yaml">{`# docker-compose.yml
services:
  mitmproxy:
    networks: [ai_boundary, ai_egress]
    cap_add: [NET_ADMIN]

  workspace:
    network_mode: "service:mitmproxy"

  openrouter-proxy:
    network_mode: "service:mitmproxy"

  git-broker:
    network_mode: "service:mitmproxy"

networks:
  # ai_boundary: intent only
  ai_boundary:
    internal: true
  ai_egress: {}`}</code></pre>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8em', fontSize: '0.935em' }}>
          <div className="card accent">
            <h3>🔍 What this means</h3>
            <ul>
              <li>🔄 No separate network interface or Docker DNS — services are ports on <code>127.0.0.1</code></li>
              <li>➡️ One egress interface — mitmproxy's</li>
              <li>🛡️ iptables DNAT at the kernel level — <code>HTTP_PROXY</code> can't be ignored</li>
              <li>🔑 Only mitmproxy has <code>NET_ADMIN</code></li>
              <li>🔒 <code>workspace</code> drops <code>NET_RAW</code></li>
              <li>🔐 CA auto-trusted at startup</li>
            </ul>
          </div>
          <div className="card">
            <h3>🌐 Two-network design</h3>
            <ul>
              <li><code>ai_egress</code> — standard bridge, mitmproxy's internet path</li>
              <li><code>ai_boundary</code> — <code>internal: true</code>, intent only; enforcement is via iptables, not Docker networking</li>
              <li>Enforcement is entirely via iptables inside the shared namespace</li>
            </ul>
          </div>
        </div>
      </div>
      <aside className="notes">
        The core architectural move: sharing the network namespace gives you a single
        choke point without sidecar injection or complex routing.

        network_mode: service:mitmproxy means the service joins mitmproxy's network
        namespace instead of getting its own. No separate interface, no Docker DNS.
        Services are just ports on 127.0.0.1.

        DNAT stands for Destination Network Address Translation. The kernel rewrites
        the destination IP and port of outbound packets before they leave, redirecting
        them into mitmproxy.

        Two-network design: ai_egress is a standard bridge with a gateway,
        mitmproxy's path out. ai_boundary is internal true and communicates intent,
        but has no enforcement effect — services share mitmproxy's namespace rather
        than joining a Docker network, so Docker network membership is irrelevant to
        them. All enforcement is done by iptables inside the shared namespace.

        NET_RAW lets a process open raw sockets and construct packets below the TCP
        and UDP stack, bypassing iptables DNAT entirely. Dropping NET_RAW from the
        workspace closes that gap.

        The mitmproxy CA is installed into the system trust store at startup so curl,
        Git, and Python all trust the MITM automatically. Node-based sidecars also
        get NODE_EXTRA_CA_CERTS because official Node images don't honour the OS trust
        store by default.
      </aside>
    </div>
  )
}
