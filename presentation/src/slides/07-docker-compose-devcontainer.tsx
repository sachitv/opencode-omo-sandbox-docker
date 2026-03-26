export default function Slide04DockerComposeDevcontainer() {
  return (
    <div className="slide">
      <h2>🐙 Devcontainers with Docker Compose</h2>
      <p className="lede">When one container isn't enough.</p>
      <div className="grid two-up" style={{ marginTop: '1em' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
          <pre style={{ margin: 0 }}><code className="language-json">{`// .devcontainer/devcontainer.json
{
  "dockerComposeFile": "docker-compose.yml",
  "service": "workspace",
  "workspaceFolder": "/workspaces/myapp"
}`}</code></pre>
          <pre style={{ margin: 0 }}><code className="language-yaml">{`# docker-compose.yml
services:
  workspace:
    build: .
    volumes:
      - .:/workspaces/myapp

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret`}</code></pre>
        </div>
        <div className="card accent" style={{ fontSize: '1.4em' }}>
          <h3>🧩 What Docker Compose adds</h3>
          <ul>
            <li>🗄️ Databases and caches alongside the workspace</li>
            <li>🔀 Sidecar services — proxies, brokers, mock APIs</li>
            <li>🔑 Secrets injected as environment variables per service</li>
            <li>🌐 Controlled networking between services</li>
            <li>♻️ Everything brought up and torn down as one unit</li>
          </ul>
        </div>
      </div>
      <aside className="notes">
        The dockerComposeFile plus service pairing is what this project uses. The
        workspace is just one service in a larger Compose stack.

        initializeCommand runs on the host before anything builds or starts. I use
        it for deploy key setup and stale container cleanup.

        containerEnv lets you inject environment variables into the workspace. The
        proxy holds the real API key, so the agent only ever sees a localhost URL.

        devcontainer up and devcontainer exec are the CLI equivalents. You can bring
        the stack up and run commands inside without VS Code at all.
      </aside>
    </div>
  )
}
