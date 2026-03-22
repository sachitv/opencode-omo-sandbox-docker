export default function Slide13SandboxSection() {
  return (
    <div className="slide section-slide" style={{ background: 'linear-gradient(135deg, #031610, #07090f)' }}>
      <div className="section-break">
        <div className="section-number">Section 3</div>
        <h2>🛡️ The Sandbox</h2>
        <p className="lede">Reuse the workflow, then add network and credential boundaries.</p>
        <div style={{ display: 'flex', gap: '1.2em', marginTop: '2em', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.3)', borderRadius: '12px', padding: '0.7em 1.4em', fontSize: '1.25em', color: '#c8ddf2' }}>🔗 Shared network namespace choke point</div>
          <div style={{ background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.3)', borderRadius: '12px', padding: '0.7em 1.4em', fontSize: '1.25em', color: '#c8ddf2' }}>🚧 mitmproxy + CoreDNS allowlists</div>
          <div style={{ background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.3)', borderRadius: '12px', padding: '0.7em 1.4em', fontSize: '1.25em', color: '#c8ddf2' }}>🔐 git-broker credential isolation</div>
        </div>
      </div>
    </div>
  )
}
