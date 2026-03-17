export default function Slide12DesignGoal() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🎯 The Design Goal</h2>
      <blockquote>
        The agent should be able to work, but it should not be able to talk to
        arbitrary external services or receive broad Git credentials by default.
      </blockquote>
      <div className="grid two-up" style={{ marginTop: '1em', flex: 1 }}>
        <div className="card good">
          <h3>✅ Keep</h3>
          <ul>
            <li>💻 Normal devcontainer and editor workflow</li>
            <li>🔌 Local model and MCP endpoints</li>
            <li>📦 Reproducible, version-pinned environment</li>
            <li>🔀 Functional Git operations</li>
          </ul>
        </div>
        <div className="card bad">
          <h3>🔒 Constrain</h3>
          <ul>
            <li>🌐 Outbound network — allowlist only</li>
            <li>🔍 DNS resolution — allowlist only</li>
            <li>🔑 Git push credentials — broker only</li>
            <li>🚫 Raw secret access from inside the workspace</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
