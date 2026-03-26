export default function Slide32DeployKeyLifecycle() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🗝️ Deploy Key Lifecycle</h2>
      <p className="lede">Git isolation depends on host-side setup, not just the broker container.</p>

      <div className="grid two-up" style={{ flex: 1, alignItems: 'start', fontSize: '1.18em' }}>
        <div className="card">
          <h3>Host bootstrap</h3>
          <ul>
            <li><code>devcontainer-initialize-host.sh</code> runs before build/start</li>
            <li><code>setup-agent-deploy-key.py --ensure</code> creates or validates repo-scoped state</li>
            <li>It records the intended <code>origin</code> and branch, then creates an <code>ed25519</code> keypair on the host</li>
            <li>The public key is added to GitHub as a write-enabled deploy key for that repo</li>
          </ul>
        </div>

        <div className="card good">
          <h3>Runtime + rotation</h3>
          <ul>
            <li><code>git-broker</code> mounts the state and private key read-only</li>
            <li>It exposes narrow MCP tools, not raw credentials</li>
            <li>Branch changes can trigger automatic key rotation</li>
            <li><code>revoke-agent-deploy-key.py</code> removes the GitHub key and local material</li>
          </ul>
        </div>
      </div>

      <div className="callout" style={{ marginTop: '1em' }}>
        Trust assumption: the <strong>host</strong> must already have <code>gh auth login</code> and permission to manage deploy keys.
      </div>

      <aside className="notes">
        The key point is that the workspace never bootstraps or stores its own Git push credentials.

        All of that happens on the host first. The broker then consumes a narrowly-scoped state file
        and private key mount, and validates origin, branch, and HEAD before pushing.
      </aside>
    </div>
  )
}
