export default function Slide14aDnsQueryFlow() {
  return (
    <div className="slide flow-slide">
      <h2>🧭 DNS Query Flow</h2>
      <p className="lede">
        DNS starts inside the agent container, gets forced through the shared namespace rules,
        then either resolves through CoreDNS or gets refused.
      </p>

      <div className="traffic-stack">
        <div className="traffic-card good">
          <div className="traffic-label">Allowed DNS query</div>
          <div className="traffic-lane">
            <div className="traffic-node origin">
              <strong>agent process</strong>
              <small><code>dig api.openrouter.ai</code></small>
            </div>
            <div className="traffic-arrow fragment" data-fragment-index={1}>→</div>
            <div className="traffic-node fragment" data-fragment-index={1}>
              <strong>iptables OUTPUT</strong>
              <small>DNAT <code>:53</code> to <code>127.0.0.53:5353</code></small>
            </div>
            <div className="traffic-arrow fragment" data-fragment-index={2}>→</div>
            <div className="traffic-node fragment" data-fragment-index={2}>
              <strong>CoreDNS</strong>
              <small>allowlist-derived zone check</small>
            </div>
            <div className="traffic-arrow fragment" data-fragment-index={3}>→</div>
            <div className="traffic-node fragment" data-fragment-index={3}>
              <strong>Docker DNS → upstream</strong>
              <small>allowed zones via 127.0.0.11</small>
            </div>
          </div>
          <div className="traffic-caption fragment" data-fragment-index={3}>
            Allowed names keep moving. The workspace never talks to arbitrary DNS directly.
          </div>
        </div>

        <div className="traffic-card bad">
          <div className="traffic-label">Rejected DNS query</div>
          <div className="traffic-lane">
            <div className="traffic-node origin bad">
              <strong>agent process</strong>
              <small><code>dig secret.attacker.io</code></small>
            </div>
            <div className="traffic-arrow fragment" data-fragment-index={4}>→</div>
            <div className="traffic-node fragment" data-fragment-index={4}>
              <strong>iptables OUTPUT</strong>
              <small>still redirected to CoreDNS</small>
            </div>
            <div className="traffic-arrow fragment" data-fragment-index={5}>→</div>
            <div className="traffic-node fragment" data-fragment-index={5}>
              <strong>CoreDNS</strong>
              <small>zone not allowlisted</small>
            </div>
            <div className="traffic-arrow fragment" data-fragment-index={6}>⇢</div>
            <div className="traffic-node reject fragment" data-fragment-index={6}>
              <strong>REFUSED</strong>
              <small>query dies inside the boundary</small>
            </div>
          </div>
          <div className="traffic-caption fragment" data-fragment-index={6}>
            The rejection happens before any upstream resolver sees the request.
          </div>
        </div>
      </div>
    </div>
  )
}
