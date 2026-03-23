export default function Slide01bDisclaimer() {
  return (
    <div className="slide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: '4.4em', fontWeight: 700, color: 'var(--ink-dim)', maxWidth: '900px', textAlign: 'center', lineHeight: 1.7 }}>
        The views expressed here are my own and do not reflect the views of my employer or any affiliated organization.
      </p>
      <aside className="notes">
        Quick disclaimer slide. These are my own views, not my employer's or any
        affiliated organization's.
      </aside>
    </div>
  )
}
