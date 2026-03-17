export default function Slide16MitmproxyAllowlist() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🚧 Egress Control: mitmproxy + Allowlist</h2>

      <div className="allow-grid">
        <div className="allow-box good">
          <h3>Allowed patterns</h3>
          <ul>
            <li>Whole hosts such as <code>openrouter.ai</code></li>
            <li>Specific paths such as <code>/chat/completions</code></li>
            <li>Wildcard hosts such as <code>*.npmjs.com</code></li>
            <li>Exact registries such as <code>registry.npmjs.org</code></li>
          </ul>
        </div>

        <div className="allow-box bad">
          <h3>Disallowed patterns</h3>
          <ul>
            <li>Anything not listed in the policy</li>
            <li>Explicit deny-list routes such as <code>!/admin</code></li>
            <li>Blocked methods such as <code>!DELETE /repos/</code></li>
            <li>UDP <code>80</code> and <code>443</code> to stop QUIC bypasses</li>
          </ul>
        </div>
      </div>

      <div className="grid two-up" style={{ marginTop: '1em', alignItems: 'start' }}>
        <div className="card tight-card">
          <h3>⚙️ How it works</h3>
          <p>
            TCP <code>80</code> and <code>443</code> are transparently redirected to
            mitmproxy via iptables DNAT. The <code>allowlist.py</code> addon checks every
            request against the policy.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card bad tight-card">
            <h3>🚫 QUIC / HTTP3 blocked</h3>
            <p>UDP <code>80</code> and <code>443</code> are explicitly rejected, so HTTP/3 cannot bypass the proxy.</p>
          </div>
          <div className="callout">
            🔒 Policy is <strong>baked into the image</strong> at build time. Changing it requires a rebuild.
          </div>
        </div>
      </div>
    </div>
  )
}
