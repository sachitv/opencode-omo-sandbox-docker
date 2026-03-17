export default function Slide04DevcontainerJson() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '90vh' }}>
      <h2>⚙️ What <code>devcontainer.json</code> Controls</h2>
      <p className="lede">This is where you choose the workspace container, its helper services, and the host-side setup hooks.</p>
      <pre style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: '1em 0 0' }}>
        <code className="language-json language-jsonc" style={{ fontSize: '1.42em', lineHeight: 1.55, flex: 1, display: 'flex', alignItems: 'center' }}>{`{
  "dockerComposeFile": "../docker-compose.yml",
  "service": "workspace",
  "runServices": ["workspace", "mitmproxy", "git-broker"],
  "initializeCommand": "./scripts/devcontainer-initialize-host.sh",
  "forwardPorts": [4096],
  "shutdownAction": "stopCompose"
}`}</code>
      </pre>
    </div>
  )
}
