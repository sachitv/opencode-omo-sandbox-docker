export default function Slide14ArchitectureOverview() {
  return (
    <div className="slide">
      <h2>🏗️ Architecture Overview</h2>
      <p className="lede">
        The workspace and helpers share one network namespace, so local traffic stays on
        loopback and outbound traffic has to pass a single policy boundary.
      </p>

      <div className="arch-stage">
        <div className="arch-group arch-static" style={{ border: '2px solid rgba(88, 166, 255, 0.5)', boxShadow: '0 0 24px rgba(88, 166, 255, 0.1)' }}>
          <div className="arch-group-label">Workspace Services</div>
          <div className="arch-services">
            <div className="arch-svc primary">
              workspace
              <small>OpenCode runs here</small>
            </div>
            <div className="arch-svc">openrouter-proxy<small>:4000 model access</small></div>
            <div className="arch-svc">perplexity-mcp<small>:8081 local MCP</small></div>
            <div className="arch-svc">brave-search-mcp<small>:8083 local MCP</small></div>
            <div className="arch-svc">git-broker<small>:8082 controlled Git auth</small></div>
          </div>
        </div>

        <div className="arch-connector">
          →
          <span style={{ fontSize: '0.7em', color: 'var(--ink-dim)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 'normal', whiteSpace: 'nowrap' }}>all traffic</span>
          <span style={{ fontSize: '0.58em', color: 'var(--ink-dim)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 'normal', whiteSpace: 'nowrap', opacity: 0.7 }}>iptables DNAT</span>
        </div>

        <div className="arch-group" style={{ border: '2px dashed rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.03)', padding: '14px', gap: '12px', display: 'flex', flexDirection: 'column' }}>
          <div className="arch-group-label">Traffic Filters</div>
          <div className="arch-policy" style={{ borderColor: 'rgba(240, 180, 41, 0.45)', background: 'rgba(240, 180, 41, 0.1)' }}>
            <h3 style={{ color: '#f0b429' }}>coredns</h3>
            <p>DNS allowlist — port 53 redirected here. Only allowlisted zones resolve.</p>
          </div>
          <div className="arch-policy" style={{ borderColor: 'rgba(88, 166, 255, 0.45)', background: 'rgba(88, 166, 255, 0.12)' }}>
            <h3>mitmproxy</h3>
            <p>HTTP/S policy boundary — TCP 80 + 443 redirected here. Host, path, and method checks.</p>
          </div>
        </div>

        <div className="arch-connector">
          →
          <span style={{ fontSize: '0.7em', color: 'var(--ink-dim)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 'normal', whiteSpace: 'nowrap' }}>approved only</span>
        </div>

        <div className="arch-policy-stack">
          <div className="arch-policy good">
            <h3>Allowed</h3>
            <p>Approved package registries, local proxies, MCP routes, and brokered Git traffic.</p>
          </div>
          <div className="arch-policy bad">
            <h3>Blocked</h3>
            <p>Arbitrary hosts, DNS tunneling, QUIC bypasses, and raw Git pushes from the workspace.</p>
          </div>
        </div>
      </div>

      <div className="callout arch-note">
        Local service calls stay on <strong>127.0.0.1</strong>. Only the checked paths can leave the namespace.
      </div>
    </div>
  )
}
