import { Deck, Slide } from '@revealjs/react'
import RevealNotes from 'reveal.js/plugin/notes'
import 'reveal.js/reveal.css'
import './index.css'

import Slide01Intro from './slides/01-intro'
import Slide02DevcontainersSection from './slides/02-devcontainers-section'
import Slide03WhatIsDevcontainer from './slides/03-what-is-devcontainer'
import Slide04DevcontainerJson from './slides/04-devcontainer-json'
import Slide05HowVscodeRuns from './slides/05-how-vscode-runs'
import Slide07WhyTeamsUse from './slides/07-why-teams-use'
import Slide08WhatDevcontainersDontGive from './slides/08-what-devcontainers-dont-give'
import Slide09ProblemSection from './slides/09-problem-section'
import Slide10AgenticTools from './slides/10-agentic-tools'
import Slide11TrustProblem from './slides/11-trust-problem'
import Slide12DesignGoal from './slides/12-design-goal'
import Slide13SandboxSection from './slides/13-sandbox-section'
import Slide14ArchitectureOverview from './slides/14-architecture-overview'
import Slide14aDnsQueryFlow from './slides/14a-dns-query-flow'
import Slide14bHttpInterceptionFlow from './slides/14b-http-interception-flow'
import Slide15SharedNetworkNamespace from './slides/15-shared-network-namespace'
import Slide16MitmproxyAllowlist from './slides/16-mitmproxy-allowlist'
import Slide17DnsExfiltration from './slides/17-dns-exfiltration'
import Slide18GitCredentialIsolation from './slides/18-git-credential-isolation'
import Slide19WhatGetsBlocked from './slides/19-what-gets-blocked'
import Slide20HonestTradeoffs from './slides/20-honest-tradeoffs'
import Slide21Takeaways from './slides/21-takeaways'

const speakerNotes: Record<number, string[]> = {
  1: [
    "Open with the core tension: agentic coding tools are extremely useful, but they run with your credentials, your network access, and your keys",
    "This talk is about preserving the ergonomics while tightening the trust model",
    "Start with devcontainers as the foundation, then layer security controls on top: egress filtering, DNS controls, and credential isolation",
  ],
  2: [
    "Section one: understanding what devcontainers give you — and don't give you — is the whole setup for why the sandbox exists",
  ],
  3: [
    "Ground this early: a devcontainer is not just a Dockerfile",
    "It's the combination of container image, runtime config, editor integration, workspace mount, and lifecycle automation",
    "Makes development environments reproducible in a way that still feels like local development",
  ],
  4: [
    "Walk through the key fields: dockerComposeFile+service is what this project uses",
    "initializeCommand runs on the host before build/start — for host-side secrets setup and stale container cleanup",
    "containerEnv injects environment into the workspace without the agent needing to know the real credentials",
  ],
  5: [
    "VS Code orchestrates Docker from the host, then attaches its remote server into one chosen container",
    "The VS Code process on your host talks to a lightweight server that gets installed inside the container",
    "The host is still responsible for building images and managing the container lifecycle",
  ],
  6: [
    "Docker Compose pattern lets you compose a full environment — not just a workspace container, but databases, proxies, and services",
    "All managed as one unit, brought up and torn down together",
    "initializeCommand runs on the host before anything starts — ideal for secrets setup",
  ],
  7: [
    "Present this as a tradeoff, not a sales pitch",
    "Upside is real: standardization and convenience",
    "Downside: container lifecycle issues, volume semantics, permissions, and networking weirdness",
    "Containerized does not automatically mean secure enough for untrusted automation",
  ],
  8: [
    "This is the pivot slide: a normal devcontainer is a great developer tool",
    "But for running an autonomous agent inside it, you're handing the agent your full dev environment",
    "That's fine when the agent is you, a human. It's a problem when it's an LLM making decisions autonomously",
  ],
  9: [
    "Section transition: shifting from what devcontainers are to why they need extra controls for agentic use cases",
  ],
  10: [
    "Frame charitably: the access is intentional — these tools need it to be useful",
    "The question is whether the access should be completely unrestricted or whether meaningful controls can coexist with usefulness",
  ],
  11: [
    "This is the threat model slide: the risk isn't necessarily a malicious model",
    "It's also prompt injection from external content the model reads, model errors, or simply overly broad access that an accident can exploit",
    "The blast radius of a mistake is determined by how much access the agent has",
  ],
  12: [
    "The thesis of the whole project: it's not anti-devcontainer, it's pro-devcontainer with sharper boundaries for autonomous tools",
    "Design target is practical containment: usable enough for real work, but not equivalent to dropping the agent into your full host environment",
  ],
  13: [
    "Section three: now we get into the actual implementation",
    "The three main controls are: egress filtering, DNS controls, and credential isolation",
  ],
  14: [
    "Walk this as layers of control, not just a list of containers",
    "The key insight: all services share the mitmproxy network namespace",
    "Local service traffic stays on loopback while all outbound traffic funnels through a single policy point",
    "mitmproxy is the only container with real external egress",
  ],
  141: [
    "Use this to show the DNS path as enforcement, not just theory",
    "Every DNS query begins in the workspace, but port 53 is redirected into CoreDNS before it can go anywhere else",
    "Allowed names resolve upstream, disallowed names are refused inside the boundary",
  ],
  142: [
    "HTTP follows the same architectural pattern but with a different interception point",
    "The key difference is that TCP 80 and 443 are redirected into mitmproxy, where host, path, and method policy are enforced",
    "Allowed requests continue upstream, blocked requests die at the proxy",
  ],
  15: [
    "This is the core architectural move: sharing the network namespace gives you a single choke point without needing sidecar injection or complex routing",
    "The fragility: if mitmproxy restarts and the dependent containers don't, they're left holding a reference to a dead namespace",
    "The initialize script handles this by detecting stale containers and tearing down before restart",
  ],
  16: [
    "The allowlist supports exact hostnames, wildcard subdomains, path prefixes, method restrictions, and deny-list mode",
    "Policy is baked into the mitmproxy image at build time — changing it requires a rebuild",
    "That's intentional: it prevents runtime policy drift and makes changes visible in git history",
  ],
  17: [
    "DNS was added after the initial design because it's a classic covert channel that bypasses HTTP-level controls",
    "CoreDNS is generated at image build time from allow-list.yaml, so HTTP and DNS policy stay in sync from a single source of truth",
    "The iptables rules ensure CoreDNS is the only process that can reach Docker's internal resolver directly",
  ],
  18: [
    "This is a practical control, not a theoretical one: authenticated Git access is high leverage",
    "Separating the key from the workspace means the workspace can't directly abuse it",
    "The broker validates branch and origin before allowing operations",
    "Host-side scripts automate deploy key creation and revocation via the GitHub API",
  ],
  19: [
    "Make it concrete: the sandbox is opinionated but not unusable",
    "Common developer workflows — installing packages, fetching code, calling allowlisted APIs — all work",
    "The things that shouldn't work don't: arbitrary outbound, DNS tunneling, raw git credentials",
  ],
  20: [
    "This slide is important for credibility: the project doesn't claim perfect containment",
    "It claims meaningful controls layered on top of a familiar workflow",
    "The limits are real and should be understood before trusting the sandbox for sensitive work",
  ],
  21: [
    "Close on the framing: keep the ergonomics, tighten the trust model",
    "These controls are composable — you can start with just the mitmproxy boundary and add DNS controls and Git isolation incrementally",
    "The shared network namespace trick and the git-broker pattern are the two most reusable ideas from this project",
  ],
}

export default function App() {
  return (
    <Deck
      config={{
        hash: true,
        width: 1600,
        height: 900,
        margin: 0.015,
        center: false,
        controls: false,
        progress: false,
        slideNumber: false,
        transition: 'slide',
        backgroundTransition: 'fade',
      }}
      plugins={[RevealNotes]}
    >
      <Slide notes={speakerNotes[1].join('\n\n')}>
        <Slide01Intro />
      </Slide>
      <Slide notes={speakerNotes[2].join('\n\n')}>
        <Slide02DevcontainersSection />
      </Slide>
      <Slide notes={speakerNotes[3].join('\n\n')}>
        <Slide03WhatIsDevcontainer />
      </Slide>
      <Slide notes={speakerNotes[4].join('\n\n')}>
        <Slide04DevcontainerJson />
      </Slide>
      <Slide notes={speakerNotes[5].join('\n\n')}>
        <Slide05HowVscodeRuns />
      </Slide>
      <Slide notes={speakerNotes[7].join('\n\n')}>
        <Slide07WhyTeamsUse />
      </Slide>
      <Slide notes={speakerNotes[8].join('\n\n')}>
        <Slide08WhatDevcontainersDontGive />
      </Slide>
      <Slide notes={speakerNotes[9].join('\n\n')}>
        <Slide09ProblemSection />
      </Slide>
      <Slide notes={speakerNotes[10].join('\n\n')}>
        <Slide10AgenticTools />
      </Slide>
      <Slide notes={speakerNotes[11].join('\n\n')}>
        <Slide11TrustProblem />
      </Slide>
      <Slide notes={speakerNotes[12].join('\n\n')}>
        <Slide12DesignGoal />
      </Slide>
      <Slide notes={speakerNotes[13].join('\n\n')}>
        <Slide13SandboxSection />
      </Slide>
      <Slide notes={speakerNotes[14].join('\n\n')}>
        <Slide14ArchitectureOverview />
      </Slide>
      <Slide notes={speakerNotes[141].join('\n\n')}>
        <Slide14aDnsQueryFlow />
      </Slide>
      <Slide notes={speakerNotes[142].join('\n\n')}>
        <Slide14bHttpInterceptionFlow />
      </Slide>
      <Slide notes={speakerNotes[15].join('\n\n')}>
        <Slide15SharedNetworkNamespace />
      </Slide>
      <Slide notes={speakerNotes[16].join('\n\n')}>
        <Slide16MitmproxyAllowlist />
      </Slide>
      <Slide notes={speakerNotes[17].join('\n\n')}>
        <Slide17DnsExfiltration />
      </Slide>
      <Slide notes={speakerNotes[18].join('\n\n')}>
        <Slide18GitCredentialIsolation />
      </Slide>
      <Slide notes={speakerNotes[19].join('\n\n')}>
        <Slide19WhatGetsBlocked />
      </Slide>
      <Slide notes={speakerNotes[20].join('\n\n')}>
        <Slide20HonestTradeoffs />
      </Slide>
      <Slide notes={speakerNotes[21].join('\n\n')}>
        <Slide21Takeaways />
      </Slide>
    </Deck>
  )
}
