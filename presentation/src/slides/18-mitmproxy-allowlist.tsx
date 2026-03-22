export default function Slide16MitmproxyAllowlist() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column', fontSize: '1.4em' }}>
      <h2>🚧 Egress Control: mitmproxy + Allowlist</h2>

      <div className="grid two-up" style={{ marginTop: '1em', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card tight-card">
            <h3>📋 Example policy</h3>
            <pre style={{ margin: 0, fontSize: '0.7em' }}><code className="language-yaml">{`# allow-list.yaml
rules:
  # whole host — all paths allowed
  - host: openrouter.ai

  # wildcard subdomain
  - host: "*.npmjs.com"

  # GitHub: read-only — GET/HEAD only
  # blocks push via HTTPS even if agent finds a PAT
  - host: github.com
    method: "GET HEAD"
  - host: api.github.com
    method: "GET HEAD"

  # block an admin path on an allowed host
  - host: openrouter.ai
    path: "!/admin"`}</code></pre>
          </div>
          <div className="callout">
            🔒 Policy is <strong>baked into the image</strong> at build time. Changing it requires a rebuild.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.94em' }}>
          <div className="allow-box good">
            <h3>Allowed</h3>
            <p>Whatever is explicitly listed in the policy</p>
          </div>
          <div className="allow-box bad">
            <h3>Disallowed</h3>
            <p>Anything not in the policy</p>
            <p>Raw IP addresses — always, regardless of rules</p>
          </div>
          <div className="card tight-card">
            <h3>⚙️ How it works</h3>
            <p>
              TCP <code>80</code> and <code>443</code> are transparently redirected to
              mitmproxy via iptables DNAT. The <code>allowlist.py</code> addon checks every
              request against the policy.
            </p>
          </div>
          <div className="card bad tight-card">
            <h3>🚫 QUIC / HTTP3 blocked</h3>
            <p>UDP <code>80</code> and <code>443</code> are explicitly rejected — HTTP/3 cannot bypass the proxy as it runs over UDP, not TCP.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
