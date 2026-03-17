export default function Slide07WhyTeamsUse() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>👥 Why Teams Use Devcontainers</h2>
      <div className="grid two-up" style={{ flex: 1 }}>
        <div className="card good">
          <h3>✅ The real wins</h3>
          <ul>
            <li>⚡ Consistent onboarding — one command to get a working environment</li>
            <li>📌 Version-pinned tools — no more "which Node are you on?"</li>
            <li>📝 The environment is in the repo — reviewable and diffable</li>
            <li>🧹 Isolated from host clutter — global state doesn't bleed in</li>
            <li>🔄 Works the same in CI, GitHub Codespaces, and locally</li>
          </ul>
        </div>
        <div className="card">
          <h3>⚠️ The tradeoffs</h3>
          <ul>
            <li>🐢 Startup and rebuild cost — cold starts are slow</li>
            <li>🔧 Docker complexity leaks through</li>
            <li>💾 Volume and filesystem edge cases</li>
            <li>🌐 Networking can be surprising</li>
            <li>⚖️ Isolation is easy to overestimate</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
