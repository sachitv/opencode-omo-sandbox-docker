export default function Slide29AppendixSection() {
  return (
    <div className="slide section-slide" style={{ background: 'linear-gradient(135deg, #0b0d12, #07090f)' }}>
      <div className="section-break">
        <div className="section-number">Appendix</div>
        <h2>📚 Appendix</h2>
        <p className="lede">Extra background and implementation details for questions.</p>
        <div style={{ display: 'flex', gap: '1.2em', marginTop: '2em', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(180,210,240,0.18)', borderRadius: '12px', padding: '0.7em 1.4em', fontSize: '1.25em', color: '#c8ddf2' }}>🔌 VS Code + Dev Container mechanics</div>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(180,210,240,0.18)', borderRadius: '12px', padding: '0.7em 1.4em', fontSize: '1.25em', color: '#c8ddf2' }}>👥 Why teams like devcontainers</div>
        </div>
      </div>
      <aside className="notes">
        These slides are not part of the main talk path, but they are useful if the
        audience wants more background on devcontainers and VS Code mechanics.
      </aside>
    </div>
  )
}
