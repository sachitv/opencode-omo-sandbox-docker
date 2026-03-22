import { QRCodeSVG } from 'qrcode.react'

export default function Slide03bWhatIsDevcontainer() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>📦 What is a Devcontainer?</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5em', marginTop: '1em', flex: 1 }}>

        {/* Left: text */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', fontSize: '1.13em' }}>
          <ul style={{ margin: 0, paddingLeft: '1.2em', lineHeight: 1.8, flex: 1 }}>
            <li><img src="/docker.svg" style={{ width: '1em', height: '1em', verticalAlign: 'middle', marginRight: '0.4em' }} />Docker container for development</li>
            <li>⚡ Convenient to run
              <ul style={{ fontSize: '0.7em' }}>
                <li><img src="/vscode.svg" style={{ width: '1em', height: '1em', verticalAlign: 'middle', marginRight: '0.4em' }} />Open in VS Code</li>
                <li><img src="/terminal.svg" style={{ width: '1em', height: '1em', verticalAlign: 'middle', marginRight: '0.4em' }} />Run via CLI</li>
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

        {/* Right: image placeholders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
          {/* TODO: replace with screenshot of opening a devcontainer in VS Code */}
          <div style={{
            flex: 1,
            border: '2px dashed rgba(180,210,240,0.3)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(180,210,240,0.5)',
            fontSize: '1.1em',
            gap: '0.5em',
          }}>
            <span style={{ fontSize: '2em' }}>🖼️</span>
            <span>Opening a devcontainer in VS Code</span>
            <span style={{ fontSize: '0.8em', opacity: 0.6 }}>[TODO: screenshot]</span>
          </div>

          {/* TODO: replace with screenshot / recording of devcontainer CLI usage */}
          <div style={{
            flex: 1,
            border: '2px dashed rgba(180,210,240,0.3)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(180,210,240,0.5)',
            fontSize: '1.1em',
            gap: '0.5em',
          }}>
            <span style={{ fontSize: '2em' }}>🖼️</span>
            <span>Running with the devcontainer CLI</span>
            <span style={{ fontSize: '0.8em', opacity: 0.6 }}>[TODO: screenshot]</span>
          </div>
        </div>

      </div>
    </div>
  )
}
