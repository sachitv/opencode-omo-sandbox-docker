export default function Slide02bWhyThisProject() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🎯 Why This Project</h2>
      <p className="lede">
        I want to use OpenCode + oh-my-opencode in a workflow I already like,
        without giving a model unrestricted access to my system.
      </p>

      <div className="grid two-up" style={{ marginTop: '0.9em', flex: 1, fontSize: '1.42em' }}>
        <div className="card">
          <h3>🧠 What I want</h3>
          <ul>
            <li>⚡ The productivity benefits of agentic coding tools</li>
            <li>📦 A development workflow built around devcontainers</li>
            <li>🤝 A shared local environment for me and the agent</li>
          </ul>
        </div>

        <div className="card accent">
          <h3>🛡️ The high-level idea</h3>
          <ul>
            <li>🚫 Don&apos;t treat the model like a fully trusted user</li>
            <li>🏗️ Keep the normal local development workflow</li>
            <li>🔒 Add a practical security boundary around the agent</li>
          </ul>
        </div>
      </div>

      <div className="callout" style={{ marginTop: '1em' }}>
        The goal is <strong>practical containment</strong>: keep the workflow familiar,
        but make the <strong>blast radius smaller</strong>.
      </div>

      <aside className="notes">
        This is the high-level motivation for the talk.

        I like using OpenCode and oh-my-opencode, and I already like developing in
        devcontainers. What I do not want is to give a model the same trust boundary
        that I have on my machine.

        So the project is about keeping that familiar local workflow, while adding a
        practical boundary around the agent. I&apos;ll talk about the details of that
        boundary later.
      </aside>
    </div>
  )
}
