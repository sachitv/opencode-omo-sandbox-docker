export default function Slide14bArchitectureDiagram() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🏗️ Architecture Overview</h2>
      <p className="lede">
        The workspace and helpers share one network namespace. All outbound traffic passes through DNS and HTTPS interceptors.
      </p>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.5em', minHeight: 0 }}>
        <img
          src="/architecture-diagram.svg"
          alt="Architecture diagram"
          style={{ width: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
        />
      </div>
    </div>
  )
}
