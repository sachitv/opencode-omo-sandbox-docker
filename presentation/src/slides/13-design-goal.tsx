export default function Slide12DesignGoal() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🎯 The Design Goal</h2>
      <blockquote>
        The agent should be able to work, but not talk to arbitrary external services or hold broad credentials.
      </blockquote>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.5em', minHeight: 0 }}>
        <img
          src={`${import.meta.env.BASE_URL}sandbox-architecture-diagram.svg`}
          alt="Sandbox design goal diagram"
          style={{ width: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
        />
      </div>
    </div>
  )
}
