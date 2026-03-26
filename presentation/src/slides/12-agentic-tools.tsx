export default function Slide10AgenticTools() {
  return (
    <div className="slide">
      <h2>🤖 Agentic Coding Tools</h2>
      <p className="lede" style={{ fontSize: '1.8em', fontWeight: 700 }}>Tools like OpenCode give an LLM access to your development environment — on purpose.</p>
      <div className="grid two-up" style={{ marginTop: '1em', fontSize: '1.5em' }}>
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
          <ul>
            <li>⚡ Usefulness requires autonomy</li>
            <li>🔧 Run commands to build and test</li>
            <li>🌐 Fetch dependencies</li>
            <li>💾 Read and write the codebase</li>
            <li>🔀 Commit and push</li>
            <li>🎯 Scope the access, don't remove it</li>
          </ul>
        </div>
      </div>
      <aside className="notes">
        The access is intentional. These tools need it to be useful. Read and write
        files, run commands, make HTTP requests, call APIs, that's the job.

        The question is whether the access should be completely unrestricted, or
        whether meaningful controls can coexist with usefulness.

        Yes, they can. Scope the access, don't remove it. The agent still needs to
        work. It just shouldn't have a blank cheque.
      </aside>
    </div>
  )
}
