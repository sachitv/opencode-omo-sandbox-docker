export default function Slide33RawIpBlocking() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🧭 Why Raw IPs Are Always Blocked</h2>
      <p className="lede">The allowlist is hostname-based, so raw IPs undermine the model.</p>

      <div className="grid two-up" style={{ flex: 1, alignItems: 'start', fontSize: '1.22em' }}>
        <div className="card bad">
          <h3>Why IP allowlisting is a bad fit</h3>
          <ul>
            <li>The policy matches the HTTP <code>Host</code> header, not just the remote socket address</li>
            <li>A client can connect to an IP while sending a misleading hostname</li>
            <li>CDN and cloud IPs rotate, so an IP that is safe today may point somewhere else later</li>
          </ul>
        </div>

        <div className="card good">
          <h3>What the sandbox does instead</h3>
          <ul>
            <li>Allowlist by hostname and let DNS resolve it normally</li>
            <li>Block external raw IPv4 and IPv6 addresses even with a global <code>"*"</code> rule</li>
            <li>Still allow loopback addresses for internal local services</li>
          </ul>
        </div>
      </div>

      <div className="callout" style={{ marginTop: '1em' }}>
        Even a global wildcard rule does <strong>not</strong> allow requests to external raw IP addresses.
      </div>

      <aside className="notes">
        This often surprises people, but it is a deliberate choice.

        The allowlist is about expressing intent in terms of named services. Raw IPs are unstable,
        easy to misuse with spoofed hostnames, and much harder to reason about in policy review.

        The tests enforce this too: external raw IPv4 and IPv6 addresses stay blocked even when
        a global wildcard hostname rule exists.
      </aside>
    </div>
  )
}
