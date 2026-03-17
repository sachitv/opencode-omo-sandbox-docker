export default function Slide10AgenticTools() {
  return (
    <div className="slide">
      <h2>🤖 Agentic Coding Tools</h2>
      <p className="lede">Tools like OpenCode give an LLM access to your development environment — on purpose.</p>
      <div className="grid two-up" style={{ marginTop: '1em' }}>
        <div className="card">
          <h3>⚡ What they can do</h3>
          <ul>
            <li>📝 Read and write files anywhere in the workspace</li>
            <li>💻 Run arbitrary shell commands</li>
            <li>🌐 Make outbound HTTP requests</li>
            <li>🔀 Perform Git operations</li>
            <li>🔌 Call external APIs through MCP servers</li>
          </ul>
        </div>
        <div className="card accent">
          <h3>🎯 Why the access is intentional</h3>
          <p>The whole point is autonomy. An agent that can't run commands, call APIs,
          or commit changes isn't useful.</p>
          <p style={{ marginTop: '0.8em' }}>The question isn't whether to grant access —
          it's <em>which</em> access, and <em>how much</em>.</p>
        </div>
      </div>
    </div>
  )
}
