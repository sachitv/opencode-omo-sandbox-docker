export default function Slide05HowVscodeRuns() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100%' }}>
      <h2>🔌 How VS Code Actually Runs Devcontainers</h2>
      <div className="flow" style={{ flex: 1, alignItems: 'stretch', gap: '16px', margin: '1.5em 0' }}>
        <div className="step" style={{ fontSize: '1.8em', padding: '1.35em 1.2em', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
          📂 Repo contains<br/><code>.devcontainer/</code>
        </div>
        <div className="arrow" style={{ fontSize: '2.2em', flexShrink: 0, alignSelf: 'center' }}>→</div>
        <div className="step" style={{ fontSize: '1.8em', padding: '1.35em 1.2em', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
          🏗️ Dev Container CLI builds and starts the environment
        </div>
        <div className="arrow" style={{ fontSize: '2.2em', flexShrink: 0, alignSelf: 'center' }}>→</div>
        <div className="step" style={{ fontSize: '1.8em', padding: '1.35em 1.2em', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
          📁 Workspace folder is bind-mounted into the target container
        </div>
        <div className="arrow" style={{ fontSize: '2.2em', flexShrink: 0, alignSelf: 'center' }}>→</div>
        <div className="step" style={{ fontSize: '1.8em', padding: '1.35em 1.2em', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
          💻 VS Code server installs and attaches <em>inside</em> that container
        </div>
      </div>
      <div className="callout" style={{ fontSize: '1.08em', width: '100%', padding: '1.2em 1.6em 1.2em 3.1em', boxSizing: 'border-box' }}>
        <strong>Common misconception:</strong> VS Code does not run inside Docker; it manages containers from the host and attaches a server into one target container.
      </div>
      <aside className="notes">
        VS Code orchestrates Docker from the host, then attaches a lightweight remote
        server into one chosen container, the service field in devcontainer.json.

        The VS Code process on your host talks to that server inside the container.
        That's why the editor feels local even though the code runs in Docker.

        The host is responsible for building images and managing container lifecycle.
        VS Code is an orchestrator, not a runtime.

        Reopen in Container gets you in. Rebuild and Reopen is what you need when the
        Dockerfile or compose config changes.
      </aside>
    </div>
  )
}
