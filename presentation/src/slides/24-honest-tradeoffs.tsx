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
    </div>
  )
}
