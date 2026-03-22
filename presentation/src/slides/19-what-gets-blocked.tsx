const blocked: { label: string; url: string; reason: string }[] = [
  { label: 'Arbitrary outbound HTTP', url: 'https://evil.example.com/exfil', reason: '403 Forbidden (not in allowlist)' },
  { label: 'DNS tunneling', url: 'secret.attacker.io', reason: 'REFUSED (CoreDNS: not allowlisted)' },
  { label: 'DNS over TLS', url: 'kdig @1.1.1.1 +tls', reason: 'connection rejected (port 853 blocked)' },
  { label: 'Raw git push (SSH)', url: 'git push origin main', reason: 'Permission denied (no key in workspace)' },
  { label: 'GitHub HTTPS push with PAT', url: 'git push https://<token>@github.com/...', reason: '403 Forbidden (GitHub restricted to GET/HEAD)' },
  { label: 'QUIC / HTTP3', url: 'UDP 443', reason: 'connection refused (UDP 443 blocked)' },
]

const allowed: { label: string; url: string; reason: string }[] = [
  { label: 'Model access via proxy', url: 'http://127.0.0.1:4000/v1/chat/...', reason: '200 OK' },
  { label: 'npm install', url: 'registry.npmjs.org', reason: 'npmjs.com allowlisted' },
  { label: 'Perplexity search (via MCP)', url: 'api.perplexity.ai', reason: 'allowlisted' },
  { label: 'GitHub fetch (via git-broker)', url: 'github.com', reason: 'broker holds deploy key' },
  { label: 'Package managers: pip, cargo, go', url: 'pypi.org / crates.io / proxy.golang.org', reason: 'registries in allowlist' },
]

const boxStyle = (color: string, bg: string) => ({
  border: `1px solid ${color}`,
  background: bg,
  borderRadius: '6px',
  padding: '0.45em 0.7em',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '0.15em',
})

export default function Slide19WhatGetsBlocked() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>🚦 What Gets Blocked — and What Doesn't</h2>
      <div className="grid two-up" style={{ flex: 1, gap: '1.2em', alignItems: 'start', fontSize: '1.56em' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
          <p className="terminal-label" style={{ color: 'var(--bad)', margin: 0 }}>🚫 Blocked</p>
          {blocked.map(({ label, url, reason }) => (
            <div key={label} style={boxStyle('rgba(220,38,38,0.5)', 'rgba(220,38,38,0.08)')}>
              <span style={{ fontSize: '0.78em', color: 'var(--ink-dim)' }}>{label}</span>
              <code style={{ color: '#f87171', fontSize: '0.85em' }}>{url}</code>
              <span style={{ fontSize: '0.75em', color: 'var(--bad)' }}>→ {reason}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
          <p className="terminal-label" style={{ color: 'var(--good)', margin: 0 }}>✅ Allowed</p>
          {allowed.map(({ label, url, reason }) => (
            <div key={label} style={boxStyle('rgba(34,197,94,0.5)', 'rgba(34,197,94,0.08)')}>
              <span style={{ fontSize: '0.78em', color: 'var(--ink-dim)' }}>{label}</span>
              <code style={{ color: '#4ade80', fontSize: '0.85em' }}>{url}</code>
              <span style={{ fontSize: '0.75em', color: 'var(--good)' }}>→ {reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
