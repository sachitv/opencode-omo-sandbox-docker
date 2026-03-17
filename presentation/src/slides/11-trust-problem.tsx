export default function Slide11TrustProblem() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🔓 The Trust Problem</h2>
      <p className="lede">When the agent runs in your devcontainer, it inherits everything you gave that container.</p>
      <div style={{ display: 'flex', gap: '1.5em', alignItems: 'stretch', marginTop: '0.8em', flex: 1 }}>
        <div className="threat-grid" style={{ flex: 1, alignContent: 'stretch' }}>
          <div className="threat">
            <div className="threat-label">🕵️ Data exfiltration via DNS</div>
            <div className="threat-detail">Encode secrets as subdomain labels. Send small UDP queries. Bypasses HTTP allowlists entirely — DNS is not HTTP.</div>
          </div>
          <div className="threat">
            <div className="threat-label">📡 Calling arbitrary external services</div>
            <div className="threat-detail">Contact any endpoint: receive instructions, exfiltrate context, or phone home. No restriction by default.</div>
          </div>
          <div className="threat">
            <div className="threat-label">🔑 Git credential abuse</div>
            <div className="threat-detail">Push to any branch the deploy key allows. Force-push. Rewrite history. The key in the workspace is the key.</div>
          </div>
          <div className="threat">
            <div className="threat-label">💀 Secret leakage</div>
            <div className="threat-detail">Read <code>.env</code> files, SSH keys, cloud credentials — anything mounted or forwarded into the container.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
