export default function Slide14bHttpInterceptionFlow() {
  return (
    <div className="slide flow-slide" style={{ fontSize: '1.1em' }}>
      <h2>🌐 HTTP Interception Flow</h2>
      <p className="lede">
        HTTP and HTTPS start the same way, but TCP <code>80</code> and <code>443</code> are transparently
        intercepted by mitmproxy before the request can leave the namespace.
      </p>

      <div className="traffic-card accent">
        <div className="traffic-label">Outbound HTTP/S request</div>
        <div className="traffic-lane">
          <div className="traffic-node origin">
            <strong>agent process</strong>
            <small><code>curl https://example.com/foo</code></small>
          </div>
          <div className="traffic-arrow fragment" data-fragment-index={1}>→</div>
          <div className="traffic-node fragment" data-fragment-index={1}>
            <strong>iptables OUTPUT</strong>
            <small>redirect TCP <code>80/443</code> to mitmproxy</small>
          </div>
          <div className="traffic-arrow fragment" data-fragment-index={2}>→</div>
          <div className="traffic-node primary fragment" data-fragment-index={2}>
            <strong>mitmproxy</strong>
            <small>host, path, and method policy check</small>
          </div>
          <div className="traffic-arrow fragment" data-fragment-index={3}>→</div>
          <div className="traffic-node fragment" data-fragment-index={3}>
            <strong>upstream service</strong>
            <small>request leaves only if allowed</small>
          </div>
        </div>
      </div>

      <div className="traffic-grid">
        <div className="traffic-mini good">
          <h3>Allowed path</h3>
          <p className="fragment" data-fragment-index={4}>
            <code>api.openrouter.ai</code> + approved route
            <br />
            <strong>Result:</strong> proxied upstream
          </p>
        </div>
        <div className="traffic-mini bad">
          <h3>Blocked path</h3>
          <p className="fragment" data-fragment-index={5}>
            host missing from allowlist, denied route, or blocked method
            <br />
            <strong>Result:</strong> stopped at mitmproxy with a deny response
          </p>
        </div>
      </div>

      <div className="callout fragment" data-fragment-index={5} style={{ marginTop: '1em' }}>
        mitmproxy is the interception point. The agent does not get a direct outbound TCP path for normal web traffic.
      </div>
      <aside className="notes">
        TCP 80 and 443 are redirected into mitmproxy by iptables. The allowlist.py
        addon checks host, path, and method on every request.

        Allowed requests continue upstream. Blocked requests get a deny response,
        so the agent sees the rejection immediately.

        This is why HTTP_PROXY can't be ignored. The redirection happens at the kernel
        level, not the application level.
      </aside>
    </div>
  )
}
