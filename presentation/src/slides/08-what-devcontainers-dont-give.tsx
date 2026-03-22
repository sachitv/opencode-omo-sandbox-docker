export default function Slide08WhatDevcontainersDontGive() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🚫 What Devcontainers Don't Give You</h2>
      <p className="lede">Containerized ≠ sandboxed.</p>
      <div className="grid two-up" style={{ marginTop: '0.8em', flex: 1, fontSize: '1.4em' }}>
        <div className="card bad">
          <h3>⚠️ Default devcontainer behavior</h3>
          <ul>
            <li>🌐 Full outbound network access from inside the container</li>
            <li>🔑 SSH agent forwarding if configured</li>
            <li>📂 Host-mounted credential files</li>
            <li>💉 Whatever environment variables you inject</li>
          </ul>
        </div>
        <div className="card">
          <h3>❌ What you don't get automatically</h3>
          <ul>
            <li>🚧 Egress filtering</li>
            <li>🔍 DNS controls</li>
            <li>🔐 Credential isolation</li>
            <li>📊 Audit logging of outbound calls</li>
            <li>🛡️ Any network policy enforcement</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
