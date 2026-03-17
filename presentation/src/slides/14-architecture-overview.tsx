export default function Slide14ArchitectureOverview() {
  return (
    <div className="slide">
      <h2>🏗️ Architecture Overview</h2>
      <p className="lede">
        The workspace and helpers share one network namespace, so local traffic stays on
        loopback and outbound traffic has to pass a single policy boundary.
      </p>

      <div className="arch-stage">
        <div className="arch-group arch-static">
          <div className="arch-group-label">Shared Namespace</div>
          <div className="arch-services">
            <div className="arch-svc primary">
              workspace
              <small>OpenCode runs here</small>
            </div>
            <div className="arch-svc">openrouter-proxy<small>:4000 model access</small></div>
            <div className="arch-svc">perplexity-mcp<small>:8081 local MCP</small></div>
            <div className="arch-svc">brave-search-mcp<small>:8083 local MCP</small></div>
            <div className="arch-svc">coredns<small>:5353 DNS allowlist</small></div>
            <div className="arch-svc primary">mitmproxy<small>HTTP policy boundary</small></div>
            <div className="arch-svc">git-broker<small>:8082 controlled Git auth</small></div>
          </div>
        </div>

        <div className="arch-connector">
          →
          <small>iptables DNAT</small>
        </div>

        <div className="arch-policy-stack">
          <div className="arch-policy">
            <h3>DNS lane</h3>
            <p><code>:53</code> is redirected to CoreDNS. Only hosts derived from the allowlist resolve.</p>
          </div>
          <div className="arch-policy">
            <h3>HTTP/S lane</h3>
            <p>TCP <code>80</code> and <code>443</code> are redirected to mitmproxy for host, path, and method checks.</p>
          </div>
        </div>

        <div className="arch-connector">
          →
          <small>approved only</small>
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
      <div className="callout arch-note" style={{ marginTop: '0.7em' }}>
        Startup also depends on a host-side initializer: it reconciles deploy-key state, detects stale shared namespaces,
        and forces rebuild/recreate when baked policy inputs change.
      </div>
    </div>
  )
}
