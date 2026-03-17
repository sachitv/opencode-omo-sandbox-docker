export default function Slide15SharedNetworkNamespace() {
  return (
    <div className="slide">
      <h2>🔗 The Shared Network Namespace</h2>
      <p className="lede">One Docker trick. One policy choke point.</p>
      <pre><code className="language-yaml">{`# docker-compose.yml
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
      <ul style={{ marginTop: '0.6em' }}>
        <li>🔄 Service-to-service traffic stays on <code>127.0.0.1</code> — no cross-container routing needed</li>
        <li>➡️ All outbound traffic exits through mitmproxy's network interface</li>
        <li>🛡️ iptables rules inside the shared namespace enforce the policy</li>
      </ul>
    </div>
  )
}
