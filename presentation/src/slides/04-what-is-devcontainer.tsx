import { QRCodeSVG } from 'qrcode.react'

export default function Slide03bWhatIsDevcontainer() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>📦 What is a Devcontainer?</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5em', marginTop: '1em', flex: 1 }}>

        {/* Left: text */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', fontSize: '1.13em' }}>
          <ul style={{ margin: 0, paddingLeft: '1.2em', lineHeight: 1.8, flex: 1 }}>
            <li><img src="/docker.svg" alt="" aria-hidden="true" style={{ width: '1em', height: '1em', verticalAlign: 'middle', marginRight: '0.4em' }} />Docker container for development</li>
            <li>⚡ Convenient to run
              <ul style={{ fontSize: '0.7em' }}>
                <li><img src="/vscode.svg" alt="" aria-hidden="true" style={{ width: '1em', height: '1em', verticalAlign: 'middle', marginRight: '0.4em' }} />Open in VS Code</li>
                <li><img src="/terminal.svg" alt="" aria-hidden="true" style={{ width: '1em', height: '1em', verticalAlign: 'middle', marginRight: '0.4em' }} />Run via CLI</li>
              </ul>
            </li>
            <li>📂 Writable source code mount</li>
            <li>🔧 Built on Docker
              <ul style={{ fontSize: '0.7em' }}>
                <li>📁 Volumes</li>
                <li>🌐 Networking</li>
                <li>🔑 Env vars</li>
                <li>🐙 Docker Compose</li>
              </ul>
            </li>
            <li>👤 Generally runs as non-root</li>
            <li>📦 No local dependency installs</li>
            <li>🛡️ Isolated from your host</li>
          </ul>
          <div style={{ marginTop: '1.2em', paddingTop: '1em', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1em' }}>
            <QRCodeSVG value="https://containers.dev" size={72} bgColor="transparent" fgColor="#c8ddf2" />
            <span style={{ color: 'var(--ink-dim)', fontSize: '0.95em' }}>containers.dev</span>
          </div>
        </div>

        {/* Right: screenshots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
          <img src="/devcontainer-vscode-1.png" alt="VS Code notification: Reopen in Container" style={{ borderRadius: '8px', width: '100%', objectFit: 'contain' }} />
          <img src="/devcontainer-vscode-2.png" alt="VS Code command palette: Rebuild and Reopen in Container" style={{ borderRadius: '8px', width: '100%', objectFit: 'contain' }} />

          <div className="card" style={{ flex: 1, fontSize: '1.15em' }}>
            <h3 style={{ marginTop: 0 }}>🖥️ Or use the CLI</h3>
            <pre style={{ margin: 0, fontSize: '1em' }}><code>{`# Start the devcontainer stack
devcontainer up

# Run a command inside the container
devcontainer exec opencode`}</code></pre>
          </div>
        </div>

      </div>
    </div>
  )
}
