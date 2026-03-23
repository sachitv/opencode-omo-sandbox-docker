export default function Slide07WhyTeamsUse() {
  return (
    <div className="slide" style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>👥 Why Teams Use Devcontainers</h2>
      <div className="grid two-up" style={{ flex: 1, fontSize: '1.5em' }}>
        <div className="card good">
          <h3>✅ The real wins</h3>
          <ul>
            <li>⚡ Consistent onboarding — one workflow to get a working environment</li>
            <li>📌 Version-pinned tools — no more "which Node are you on?"</li>
            <li>📝 The environment is in the repo — reviewable and diffable</li>
            <li>🧹 Isolated from host clutter — global state doesn't bleed in</li>
            <li>🔄 Works the same in CI, GitHub Codespaces, and locally</li>
          </ul>
        </div>
        <div className="card">
          <h3>⚠️ The tradeoffs</h3>
          <ul>
            <li>🔧 Docker complexity leaks through</li>
            <li>💾 Volume and filesystem edge cases</li>
            <li>🏗️ Platform mismatch (x86/arm)</li>
            <li>🏠 System dotfiles need explicit mounting</li>
          </ul>
        </div>
      </div>
      <aside className="notes">
        Devcontainers are genuinely useful, but they're not magic.

        You get standardization, reproducibility, and no local dependency pollution.
        In exchange you deal with container lifecycle friction, volume semantics,
        and permission mismatches.

        The important one for this talk: containerized does not automatically mean
        secure. A normal devcontainer is a comfortable developer environment, not
        a sandbox.

        On Apple Silicon, x86 images run under Rosetta emulation. That's noticeable
        slowdown, and not all images publish multi-arch builds.

        Shell config like .zshrc and .gitconfig doesn't carry over automatically.
        VS Code has a dotfiles repo feature, but it needs explicit setup.
      </aside>
    </div>
  )
}
