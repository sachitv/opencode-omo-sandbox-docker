export default function Slide03cExampleDevcontainers() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>Bare Minimum Devcontainer</h2>
      <div className="grid two-up" style={{ marginTop: '1em', flex: 1 }}>
        <div className="card">
          <h3 style={{ fontSize: '2.25em' }}>📦 With a base image</h3>
          <pre style={{ margin: 0, fontSize: '1.21em', lineHeight: 1.7, padding: '1em' }}>{`// .devcontainer/devcontainer.json
{
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",

  // optional extras:
  // "mounts": [],
  // "containerEnv": {},
  // "forwardPorts": [],
  // "postCreateCommand": ""
}`}</pre>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8em' }}>
          <div className="card">
            <h3 style={{ fontSize: '2.25em' }}><img src={`${import.meta.env.BASE_URL}docker.svg`} alt="" aria-hidden="true" style={{ width: '1em', height: '1em', verticalAlign: 'middle', marginRight: '0.3em' }} />With a Dockerfile</h3>
            <pre style={{ margin: 0, fontSize: '1.44em', lineHeight: 1.7, padding: '1em' }}>{`// .devcontainer/devcontainer.json
{
  "build": { "dockerfile": "Dockerfile" },

  // optional extras:
  // "mounts": [],
  // "containerEnv": {},
  // "forwardPorts": [],
  // "postCreateCommand": ""
}`}</pre>
          </div>
          <div className="card">
            <h3 style={{ fontSize: '2.25em' }}>📝 Dockerfile</h3>
            <pre style={{ margin: 0, fontSize: '1.44em', lineHeight: 1.7, padding: '1em' }}>{`# .devcontainer/Dockerfile
FROM mcr.microsoft.com/devcontainers/base:ubuntu
RUN apt-get update && apt-get install -y curl`}</pre>
          </div>
        </div>
      </div>
      <aside className="notes">
        This is the bare minimum shape of a devcontainer.

        On the left, you can point directly at a base image in devcontainer.json.
        On the right, you can build from your own Dockerfile instead.

        The rest of the properties are the knobs you already expect: mounts,
        environment variables, forwarded ports, and lifecycle commands.

        The point is that the format is simple. You can start small and layer more
        structure on top as the environment gets more complex.
      </aside>
    </div>
  )
}
