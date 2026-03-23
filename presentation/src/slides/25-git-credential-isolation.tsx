export default function Slide18GitCredentialIsolation() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🔐 Git Credential Isolation</h2>
      <p className="lede">The workspace has no Git credentials. The git-broker does.</p>
      <div className="grid two-up" style={{ flex: 1, marginTop: '0.8em', alignItems: 'start', fontSize: '1.15em' }}>
        <div className="card bad" style={{ display: 'flex', flexDirection: 'column', gap: '0.6em' }}>
          <h3>🚫 Not in the workspace</h3>
          <p style={{ margin: 0, color: 'var(--ink-dim)' }}>
            The agent must never be able to exfiltrate a token or key it could reuse elsewhere.
          </p>
          <ul>
            <li>❌ No personal access token</li>
            <li>❌ No deploy key</li>
            <li>❌ No SSH agent forwarding or <code>~/.ssh</code> mount
              <br/><span style={{ color: 'var(--ink-dim)' }}>(<code>SSH_AUTH_SOCK</code> is blanked)</span>
            </li>
          </ul>
        </div>
        <div className="card good" style={{ display: 'flex', flexDirection: 'column', gap: '0.6em' }}>
          <h3>✅ The git-broker pattern</h3>
          <p style={{ margin: 0, color: 'var(--ink-dim)' }}>
            The broker validates origin and branch before every push — the agent can't push to arbitrary repos.
          </p>
          <ul>
            <li>📦 Separate container with a dedicated deploy key</li>
            <li>🔒 Key mounted <strong>read-only</strong> from host, outside the repo</li>
            <li>🔌 Exposes narrow MCP tools: <code>describe_push_policy</code>, <code>fetch_origin</code>, <code>push_current_head</code></li>
            <li>✅ Validates origin, locked branch, and current HEAD before push</li>
            <li>🛡️ UID-exempt from mitmproxy — SSH to <code>ssh.github.com:443</code> bypasses the proxy</li>
          </ul>
        </div>
      </div>
      <div className="callout" style={{ marginTop: '1em', fontSize: '1.18em' }}>
        🔑 The agent gets <strong>operations, not credentials</strong>.
        It calls broker tools via MCP, but never holds the key that makes the push possible.
      </div>
      <aside className="notes">
        Authenticated Git access is high-leverage. A leaked key or token can push to
        any branch, rewrite history, or delete refs.

        Two goals: don't leak the key, the workspace never holds it. And don't push
        to arbitrary repos, the broker validates origin and branch before every operation.

        The git-broker is a separate container with a dedicated deploy key mounted
        read-only from the host. It exposes narrow MCP tools: describe_push_policy,
        fetch_origin, push_current_head.

        The agent gets operations, not credentials. It calls broker tools via MCP
        but never holds the key that makes the push possible.

        Host-side scripts automate deploy key creation and revocation via the GitHub
        API. No manual key management.
      </aside>
    </div>
  )
}
