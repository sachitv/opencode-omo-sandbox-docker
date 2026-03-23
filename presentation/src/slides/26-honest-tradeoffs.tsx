export default function Slide20HonestTradeoffs() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>⚖️ Honest Tradeoffs</h2>
      <p className="lede">This is practical containment, not VM-grade isolation.</p>
      <div className="grid two-up" style={{ flex: 1, alignContent: 'stretch', fontSize: '1.3em' }}>
        <div className="card">
          <h3>What this doesn't protect against</h3>
          <ul>
            <li>🔓 An allowlisted endpoint becoming a relay for exfiltration</li>
            <li>🌐 DNS-over-HTTPS if a DoH resolver ever enters the allowlist</li>
            <li>🧭 DNS policy is zone-based today, not exact-host-based</li>
            <li>🐛 Kernel exploits or container escapes</li>
          </ul>
        </div>
        <div className="card">
          <h3>What requires ongoing hygiene</h3>
          <ul>
            <li>📈 Allowlist creep — every new service widens the surface</li>
            <li>🏗️ Policy changes require image rebuilds — easy to skip</li>
            <li>🔑 Credentials must stay outside the repo, not inside it</li>
            <li>🔍 Reviewing what you add to run services</li>
          </ul>
        </div>
      </div>
      <aside className="notes">
        The project doesn't claim perfect containment. It claims meaningful controls
        layered on a familiar workflow.

        If an allowlisted endpoint gets compromised or cooperates with an attacker,
        it can exfiltrate data on behalf of the agent. The sandbox can't prevent that.

        If a DNS-over-HTTPS resolver endpoint ever enters the allowlist, DNS becomes
        an application-layer exfiltration channel over HTTPS 443.

        A github.com allowlist entry permits DNS queries for the whole github.com
        zone, not just that exact host. Tightening to exact-host DNS policy would
        require more complex CoreDNS configuration.

        Kernel exploits or container escapes: if the kernel or container runtime is
        compromised, all bets are off. This is a developer sandbox, not a VM boundary.

        Every new MCP server or package registry added to the allowlist widens the
        attack surface. Review additions carefully.
      </aside>
    </div>
  )
}
