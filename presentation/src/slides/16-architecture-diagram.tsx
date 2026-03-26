export default function Slide14bArchitectureDiagram() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🏗️ Architecture Overview</h2>
      <p className="lede">
        The workspace and helpers share one network namespace. Most outbound traffic passes through DNS and HTTPS interceptors — the git-broker is the exception.
      </p>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.5em', minHeight: 0 }}>
        <img
          src={`${import.meta.env.BASE_URL}architecture-diagram.svg`}
          alt="Architecture diagram"
          style={{ width: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
        />
      </div>
      <aside className="notes">
        This is the full architecture in one picture.

        The main thing to notice is that the workspace and helper services all sit
        behind the same boundary. Most outbound paths go through DNS and HTTPS policy
        enforcement, while Git auth is split into its own brokered path.

        I'm using this slide mainly as a visual anchor before zooming into the pieces
        one by one.
      </aside>
    </div>
  )
}
