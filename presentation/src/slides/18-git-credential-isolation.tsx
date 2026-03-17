export default function Slide18GitCredentialIsolation() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🔐 Git Credential Isolation</h2>
      <p className="lede">The workspace has no Git credentials. The git-broker does.</p>
      <div className="git-grid" style={{ flex: 1, marginTop: '0.8em' }}>
        <div className="card bad">
          <h3>🚫 Not in the workspace</h3>
          <ul>
            <li>❌ No personal access token</li>
            <li>❌ No deploy key</li>
            <li>❌ No SSH agent forwarding or <code>~/.ssh</code> mount<br/><small>(<code>SSH_AUTH_SOCK</code> is blanked)</small></li>
          </ul>
        </div>
        <div className="card good">
          <h3>✅ The git-broker pattern</h3>
          <ul>
            <li>📦 Separate container with a dedicated deploy key</li>
            <li>🔒 Key mounted <strong>read-only</strong> from host, outside the repo</li>
            <li>🔌 Exposes narrow MCP tools: <code>fetch</code> and <code>push</code></li>
            <li>✅ Validates branch and origin before every operation</li>
          </ul>
        </div>
      </div>
      <div className="callout" style={{ marginTop: '1em', fontSize: '1.18em' }}>
        🔑 The agent calls <code>git_broker.push()</code> via MCP.
        It never holds the credential that makes the push possible.
      </div>
    </div>
  )
}
