export default function Slide02DevcontainersSection() {
  return (
    <div className="slide section-slide">
      <div className="section-break">
        <div className="section-number">Section 1</div>
        <h2>📦 Devcontainers</h2>
        <p className="lede">What devcontainers give you, and what they do not.</p>
        <div style={{ display: 'flex', gap: '1.2em', marginTop: '2em', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(180,210,240,0.18)', borderRadius: '12px', padding: '0.7em 1.4em', fontSize: '1.25em', color: '#c8ddf2' }}>📋 devcontainer.json as environment spec</div>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(180,210,240,0.18)', borderRadius: '12px', padding: '0.7em 1.4em', fontSize: '1.25em', color: '#c8ddf2' }}>🔌 How VS Code attaches to a container</div>
          <div style={{ background: 'rgba(248,81,73,0.12)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: '12px', padding: '0.7em 1.4em', fontSize: '1.25em', color: '#c8ddf2' }}>⚠️ What a devcontainer doesn't sandbox</div>
        </div>
      </div>
    </div>
  )
}
