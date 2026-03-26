export default function Slide31VsCodePortForwarding() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🚏 VS Code Port Forwarding</h2>
      <p className="lede">Host-side forwarding can create a path outside the container&apos;s normal egress controls.</p>

      <div className="grid two-up" style={{ flex: 1, alignItems: 'start', fontSize: '1.2em' }}>
        <div className="card bad">
          <h3>What can go wrong</h3>
          <ul>
            <li>A process inside the workspace opens a listening port</li>
            <li>VS Code can auto-forward <code>host:PORT → container:PORT</code></li>
            <li>That channel originates from the host side, not from inside the sandbox namespace</li>
            <li>So a service in the container can become reachable through a host-side forwarded port without going through <code>mitmproxy</code></li>
          </ul>
        </div>

        <div className="card good">
          <h3>What to do instead</h3>
          <ul>
            <li>Prefer explicit <code>forwardPorts</code> allowlists in <code>devcontainer.json</code></li>
            <li>Disable automatic forwarding in VS Code with <code>remote.autoForwardPorts: false</code></li>
            <li>Audit host-visible ports when debugging or demoing</li>
          </ul>
          <pre style={{ marginTop: '0.6em', fontSize: '0.86em' }}><code className="language-json">{`{
  "remote.autoForwardPorts": false
}`}</code></pre>
        </div>
      </div>

      <div className="callout" style={{ marginTop: '1em' }}>
        Usually this is a <strong>local exposure first</strong>, not automatic internet exfiltration — but it still sits outside the sandbox&apos;s normal outbound path.
      </div>

      <aside className="notes">
        The important nuance is that VS Code port forwarding does not look like normal outbound
        traffic from inside the namespace. The host editor notices a listening port and forwards it.

        In many cases that forwarded port is only reachable from localhost, so this is not automatic
        internet exfiltration by itself. The practical issue is that it creates a host-side access
        path outside the sandbox&apos;s normal egress controls.

        That means you can accidentally expose a container service locally unless you keep forwarding
        explicit and intentional.
      </aside>
    </div>
  )
}
