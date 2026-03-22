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
              <li><code>ai_boundary</code> — <code>internal: true</code>, no gateway, no internet</li>
              <li><code>ai_egress</code> — standard bridge, mitmproxy's internet path</li>
              <li>Only mitmproxy bridges both — no direct egress for anything else</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
