export default function Slide08WhatDevcontainersDontGive() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🧭 Devcontainer Configuration</h2>
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
          <h3>🛠️ What you need to configure</h3>
          <ul>
            <li>🚧 Egress filtering</li>
            <li>🔍 DNS controls</li>
            <li>🔐 Credential isolation</li>
            <li>📊 Audit logging of outbound calls</li>
            <li>🛡️ Any network policy enforcement</li>
          </ul>
        </div>
      </div>
      <aside className="notes">
        A normal devcontainer hands the agent your full dev environment. That's fine
        when the agent is you. It's a problem when it's an LLM making autonomous decisions.

        VS Code can mount the host SSH auth socket into the container. Any process
        inside can use your host SSH keys to authenticate to remote servers without
        ever seeing the private key material directly.

        The agent also gets your Git credentials, cloud credentials, mounted secrets,
        and any environment variables you inject.

        The blast radius of a mistake is determined by how much access the agent has.
      </aside>
    </div>
  )
}
