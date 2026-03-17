export default function Slide17DnsExfiltration() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🕵️ DNS: The Exfiltration Channel</h2>
      <p className="lede">HTTP allowlists don't constrain DNS. DNS is not HTTP.</p>

      <div className="dns-grid">
        <div className="dns-box bad">
          <h3>What exfiltration looks like</h3>
          <ul>
            <li>Encode secrets as subdomain labels and query attacker-controlled zones</li>
            <li>Use high-volume tunneling tools such as <code>iodine</code></li>
            <li>Try encrypted DNS on port <code>853</code> to bypass HTTP controls</li>
          </ul>
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
    </div>
  )
}
