export default function Slide16MitmproxyAllowlist() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column', fontSize: '1.4em' }}>
      <h2>🚧 Egress Control: mitmproxy + Allowlist</h2>

      <div className="grid two-up" style={{ marginTop: '1em', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card tight-card">
            <h3>📋 Example policy</h3>
            <pre style={{ margin: 0, fontSize: '0.7em' }}><code className="language-yaml">{`# allow-list.yaml

# allow all
openrouter.ai:

# allow specific methods on a path/prefix
github.com:
  - GET /foo
  - HEAD /

# deny-list mode
example.com:
  - !/admin

# wildcard subdomain
"*.example.com":`}</code></pre>
          </div>
          <div className="callout">
            🔒 Policy is <strong>baked into the image</strong> at build time. Changing it requires a rebuild and recreate.
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
      <aside className="notes">
        The allowlist is default-deny. Anything not explicitly listed is blocked.

        It supports exact hostnames, wildcard subdomains, path prefixes, method
        restrictions, and deny-list mode for specific paths.

        Policy is baked into the mitmproxy image at build time. Changing it requires
        a rebuild and recreate. That's intentional. It prevents runtime drift and makes
        policy changes visible in git history.

        GitHub is restricted to GET and HEAD only. This closes the vector where an
        agent reads a repo containing a PAT and uses it to push via HTTPS or call
        write endpoints on the REST API. The git-broker uses SSH over port 443 with
        a UID-based iptables exception, so it's unaffected.

        Raw IP addresses are always blocked, even with a global wildcard rule. The
        allowlist matches the HTTP Host header, the hostname the client declares, not
        the IP it connects to.

        QUIC and HTTP/3 run over UDP, not TCP. iptables DNAT only intercepts TCP on
        80 and 443. UDP 80 and 443 are explicitly dropped so clients fall back to TCP.
      </aside>
    </div>
  )
}
