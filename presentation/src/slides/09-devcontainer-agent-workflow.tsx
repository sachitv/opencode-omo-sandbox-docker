export default function Slide09bDevcontainerAgentWorkflow() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🧭 How I Would Like To Use Devcontainers</h2>
      <p className="lede">
        A shared local sandbox where the developer and the agent both work in the same
        devcontainer workflow against the same code.
      </p>

      <div className="vision-diagram">
        <div className="vision-machine">
          <div className="vision-machine-label">Local Machine</div>

          <div className="vision-shell">
            <div className="vision-node sandbox">
              <strong>Sandboxed Devcontainer Workflow</strong>
              <small>shared environment for the human and the agent</small>
              <div className="vision-workflow-grid" style={{ marginTop: '1em' }}>
                <div className="vision-section vision-panel">
                  <div className="vision-kicker">Participants</div>
                  <div className="vision-collab-row">
                    <div className="vision-actor">
                      <div className="vision-avatar">🧑</div>
                      <h3>Human</h3>
                    </div>

                    <div className="vision-link">
                      ⇄
                      <small>tight loop</small>
                    </div>

                    <div className="vision-actor accent">
                      <div className="vision-avatar">🤖</div>
                      <h3>Agent</h3>
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

              <div className="vision-network">
                <div className="vision-kicker">Boundary</div>
                <h3>🚧 Restricted Network</h3>
                <p>🔒 Allowlisted destinations only</p>
                <p>⛔ Arbitrary outbound access blocked</p>
              </div>
            </div>

            <div className="vision-boundary-column">
              <div className="vision-boundary-link">
                ↓
                <small>credential access</small>
              </div>

              <div className="vision-network warn">
                <div className="vision-kicker">Boundary</div>
                <h3>🔐 Fine-Grained Access</h3>
                <p>🎯 Loaded only where needed</p>
                <p>🧩 Scoped to the specific tool or path</p>
              </div>
            </div>

            <div className="vision-boundary-column">
              <div className="vision-boundary-link">
                ↓
                <small>git tokens</small>
              </div>

              <div className="vision-network warn">
                <div className="vision-kicker">Boundary</div>
                <h3>🔑 Fine-Grained Git Access</h3>
                <p>🧱 Brokered through narrow interfaces</p>
                <p>🎯 Scoped to specific Git operations</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="callout" style={{ marginTop: '1.05em' }}>
        The goal is a <strong>shared sandbox</strong>, not a remote agent box: both the human
        and the agent live inside one controllable local workflow.
      </div>
      <aside className="notes">
        Now compare that with the workflow I actually want for agentic development.

        I still want the local devcontainer ergonomics, but now there are two
        participants inside it: a human and an agent in a tight loop.

        Once an agent is in the picture, the default trust model is too broad, so
        egress, credential access, and Git tokens all need tighter boundaries.
      </aside>
    </div>
  )
}
