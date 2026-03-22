export default function Slide21Takeaways() {
  return (
    <div className="slide title-slide" style={{ background: 'linear-gradient(150deg, #04111f 0%, #07090f 60%, #060f1a 100%)', position: 'relative', overflow: 'hidden' }}>
      <div className="slide-bg-image" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&h=1080&fit=crop)', opacity: 0.06 }} />
      <div className="title-content">
        <h1>Takeaways</h1>
        <ul className="takeaways">
          <li>📦 Devcontainers are excellent for environment consistency — but <strong>containerized != sandboxed</strong></li>
          <li>🛡️ Agentic tools need a tighter trust model: <strong>egress, DNS, and credentials</strong> are the three surfaces that matter</li>
          <li>🔗 The <strong>shared network namespace</strong> trick gives you a single policy choke point without complex routing</li>
          <li>🌐 HTTP allowlists alone leave DNS open — <strong>enforce both from a single allow-list so policy can't drift</strong></li>
          <li>🔐 Credential isolation via a narrow broker keeps the agent <strong>functional without holding raw keys</strong></li>
          <li>✨ Practical containment beats theoretical perfection — these controls are <strong>composable and incrementally adoptable</strong></li>
        </ul>
      </div>
    </div>
  )
}
