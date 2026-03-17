export default function Slide06DockerCompose() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🐳 Using Devcontainers with Docker Compose</h2>
      <p className="lede">Multi-service setups let the devcontainer be one service among many.</p>
      <div className="grid three-up compose-grid" style={{ marginTop: '1em' }}>
        <div className="card">
          <h3>⚙️ <code>docker compose file</code></h3>
          <p>Points to your Compose file. VS Code uses it to build and orchestrate
          all services together.</p>
        </div>
        <div className="card">
          <h3>🎯 <code>service</code></h3>
          <p>The one container VS Code attaches into — your primary workspace.
          Other containers are helpers.</p>
        </div>
        <div className="card">
          <h3>🚀 Run Services</h3>
          <p>Additional services to start alongside the workspace — databases,
          proxies, MCP servers.</p>
        </div>
      </div>
      <div className="callout" style={{ marginTop: '1em' }}>
        <strong>The practical consequence:</strong> VS Code can manage the whole environment, not just one container.
      </div>
      <div className="mini-grid">
        <div className="mini-card">
          <p><code>initializeCommand</code> runs on the <strong>host</strong> before startup, which makes it ideal for secrets setup.</p>
        </div>
        <div className="mini-card">
          <p><code>forwardPorts</code> exposes selected service ports back to your machine.</p>
        </div>
        <div className="mini-card">
          <p><code>shutdownAction: "stopCompose"</code> tears the whole stack down when you close VS Code.</p>
        </div>
      </div>
    </div>
  )
}
