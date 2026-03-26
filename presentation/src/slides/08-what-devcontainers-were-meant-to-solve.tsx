export default function Slide09cWhatDevcontainersWereMeantToSolve() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>📦 What Devcontainers Were Meant To Solve</h2>
      <p className="lede">
        Standardized local development environments for humans, with the tools they need,
        not autonomous collaborators or network containment.
      </p>

      <div className="vision-diagram">
        <div className="vision-machine">
          <div className="vision-machine-label">Local Machine</div>

          <div className="vision-shell">
            <div className="vision-node sandbox">
              <strong>Standard Devcontainer Workflow</strong>
              <small>shared environment for the developer and their tooling</small>
              <div className="vision-workflow-grid" style={{ marginTop: '1em' }}>
                <div className="vision-section vision-panel">
                  <div className="vision-kicker">Participants</div>
                  <div>
                    <div className="vision-actor vision-actor-solo">
                      <div className="vision-avatar">🧑</div>
                      <h3>Human</h3>
                    </div>
                  </div>
                </div>

                <div className="vision-section vision-panel">
                  <div className="vision-kicker">Tooling</div>
                  <div className="vision-tools-grid">
                    <div className="vision-tool">🏗️ Build tools</div>
                    <div className="vision-tool">🧪 Test tools</div>
                    <div className="vision-tool">📦 System deps</div>
                    <div className="vision-tool">🛠️ Project runtime</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="vision-boundary-grid">
            <div className="vision-boundary-column">
              <div className="vision-boundary-link">
                ↓
                <small>egress</small>
              </div>

              <div className="vision-network good">
                <div className="vision-kicker">Boundary</div>
                <h3>✅ Unrestricted Network</h3>
                <p>🌐 Outbound access available</p>
                <p>🟢 No special egress boundary needed</p>
              </div>
            </div>

            <div className="vision-boundary-column">
              <div className="vision-boundary-link">
                ↓
                <small>credential access</small>
              </div>

              <div className="vision-network good">
                <div className="vision-kicker">Boundary</div>
                <h3>🔐 Credential Access Allowed</h3>
                <p>📂 Mounted automatically</p>
                <p>🟢 Standard developer access model</p>
              </div>
            </div>

            <div className="vision-boundary-column">
              <div className="vision-boundary-link">
                ↓
                <small>git tokens</small>
              </div>

              <div className="vision-network good">
                <div className="vision-kicker">Boundary</div>
                <h3>🔑 Credentials Allowed</h3>
                <p>📂 Normal mounted auth and config</p>
                <p>🟢 Standard developer access model</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <aside className="notes">
        This is the original devcontainer shape I want people to picture first.

        One human, one reproducible environment, the expected tooling, normal outbound
        network access, and normal mounted credentials or tokens.

        That's not a criticism. That's what devcontainers were meant to solve: give
        developers a clean, consistent local workspace.
      </aside>
    </div>
  )
}
