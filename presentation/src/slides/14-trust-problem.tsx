export default function Slide11TrustProblem() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🔓 The Trust Problem</h2>
      <p className="lede">When the agent runs in your devcontainer, it inherits everything you gave that container.</p>
      <div style={{ display: 'flex', gap: '1.5em', alignItems: 'stretch', marginTop: '0.8em', flex: 1 }}>
        <div className="threat-grid" style={{ flex: 1, alignContent: 'stretch', fontSize: '1.2em' }}>
          <div className="threat">
            <div className="threat-label">📡 Calling arbitrary external services</div>
            <div className="threat-detail"><ul><li>Contact any endpoint</li><li>Receive instructions or exfiltrate context</li><li>No restriction by default</li></ul></div>
          </div>
          <div className="threat">
            <div className="threat-label">💀 Secret leakage</div>
            <div className="threat-detail"><ul><li>Read .env files, SSH keys, cloud credentials</li><li>Anything mounted or forwarded into the container</li></ul></div>
          </div>
          <div className="threat">
            <div className="threat-label">🔑 Git credential abuse</div>
            <div className="threat-detail"><ul><li>Push to any branch the deploy key allows</li><li>Force-push or rewrite history</li><li>The key in the workspace is the key</li></ul></div>
          </div>
          <div className="threat">
            <div className="threat-label">🕵️ Data exfiltration via DNS</div>
            <div className="threat-detail"><ul><li>Encode secrets as subdomain labels</li><li>Small UDP queries bypass HTTP allowlists</li><li>DNS is not HTTP</li></ul></div>
          </div>
        </div>
      </div>
      <aside className="notes">
        The risk isn't only a malicious model. It's also prompt injection from
        external content the model reads, model errors, or simply overly broad access
        that an accident can exploit.

        Four concrete threat surfaces: arbitrary outbound HTTP, secret leakage from
        mounted files, Git credential abuse, and DNS exfiltration.

        DNS is easy to overlook. Small UDP queries bypass HTTP allowlists entirely
        because DNS is not HTTP. Secrets encoded as subdomain labels are invisible
        to mitmproxy.

        The blast radius of a mistake scales directly with how much access the agent
        was given.
      </aside>
    </div>
  )
}
