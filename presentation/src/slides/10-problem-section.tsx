export default function Slide09ProblemSection() {
  return (
    <div className="slide section-slide" style={{ background: 'linear-gradient(135deg, #100a20, #07090f)' }}>
      <div className="section-break">
        <div className="section-number">Section 2</div>
        <h2>⚡ The Problem with Agentic Tools</h2>
        <p className="lede">Useful autonomy comes with a very wide blast radius by default.</p>
        <div style={{ display: 'flex', gap: '1.2em', marginTop: '2em', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: '12px', padding: '0.7em 1.4em', fontSize: '1.25em', color: '#c8ddf2' }}>🕵️ DNS as a covert exfiltration channel</div>
          <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: '12px', padding: '0.7em 1.4em', fontSize: '1.25em', color: '#c8ddf2' }}>📡 Arbitrary outbound service calls</div>
          <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: '12px', padding: '0.7em 1.4em', fontSize: '1.25em', color: '#c8ddf2' }}>🔑 Git credentials in the workspace</div>
        </div>
      </div>
    </div>
  )
}
