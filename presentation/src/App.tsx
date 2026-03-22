import { Deck, Slide } from '@revealjs/react'
import 'reveal.js/reveal.css'
import './index.css'
import { createRevealNotesAspectFix } from './reveal-notes-aspect-fix'

import Slide01Intro from './slides/01-intro'
import Slide02Disclaimer from './slides/02-disclaimer'
import Slide03DevcontainersSection from './slides/03-devcontainers-section'
import Slide04WhatIsDevcontainer from './slides/04-what-is-devcontainer'
import Slide05ExampleDevcontainers from './slides/05-example-devcontainers'
import Slide06DockerComposeDevcontainer from './slides/06-docker-compose-devcontainer'
import Slide07HowVscodeRuns from './slides/07-how-vscode-runs'
import Slide08WhyTeamsUse from './slides/08-why-teams-use'
import Slide09WhatDevcontainersWereMeantToSolve from './slides/09-what-devcontainers-were-meant-to-solve'
import Slide10DevcontainerAgentWorkflow from './slides/10-devcontainer-agent-workflow'
import Slide11WhatDevcontainersDontGive from './slides/11-what-devcontainers-dont-give'
import Slide12ProblemSection from './slides/12-problem-section'
import Slide13AgenticTools from './slides/13-agentic-tools'
import Slide14TrustProblem from './slides/14-trust-problem'
import Slide15DesignGoal from './slides/15-design-goal'
import Slide16SandboxSection from './slides/16-sandbox-section'
import Slide17ArchitectureDiagram from './slides/17-architecture-diagram'
import Slide18ArchitectureOverview from './slides/18-architecture-overview'
import Slide19SharedNetworkNamespace from './slides/19-shared-network-namespace'
import Slide20MitmproxyAllowlist from './slides/20-mitmproxy-allowlist'
import Slide21DnsExfiltration from './slides/21-dns-exfiltration'
import Slide22DnsQueryFlow from './slides/22-dns-query-flow'
import Slide23HttpInterceptionFlow from './slides/23-http-interception-flow'
import Slide24WhatGetsBlocked from './slides/24-what-gets-blocked'
import Slide25GitCredentialIsolation from './slides/25-git-credential-isolation'
import Slide26HonestTradeoffs from './slides/26-honest-tradeoffs'
import Slide27Takeaways from './slides/27-takeaways'
import Slide28ThankYou from './slides/28-thank-you'

const speakerNotes: Record<number, string[]> = {
  1: [
    "Agentic coding tools are extremely useful — but they run with your credentials, your network access, and your keys. That's fine when you're supervising every keystroke. It gets risky when the agent is running autonomously.",
    "This talk is about preserving the ergonomics while tightening the trust model. Not removing access — just scoping it.",
    "We'll go through devcontainers as the foundation, then layer security controls on top: egress filtering, DNS controls, credential isolation.",
    "I'm not a security expert. I'm a hobbyist who wanted to tinker with OpenCode without handing it the keys to everything.",
  ],
  3: [
    "Before we can talk about what's missing from a devcontainer for agentic use, we need to understand what a devcontainer actually is.",
  ],
  6: [
    "The dockerComposeFile plus service pairing is what this project uses — the workspace is just one service in a larger Compose stack.",
    "initializeCommand runs on the host before anything builds or starts. I use it for deploy key setup and stale container cleanup.",
    "containerEnv lets you inject environment variables into the workspace. The proxy holds the real API key — the agent only ever sees a localhost URL.",
    "devcontainer up and devcontainer exec are the CLI equivalents — you can bring the stack up and run commands inside without VS Code at all.",
  ],
  7: [
    "VS Code orchestrates Docker from the host, then attaches a lightweight remote server into one chosen container — the service field in devcontainer.json.",
    "The VS Code process on your host talks to that server inside the container. That's why the editor feels local even though the code runs in Docker.",
    "The host is responsible for building images and managing container lifecycle. VS Code is an orchestrator, not a runtime.",
    "Reopen in Container gets you in. Rebuild and Reopen is what you need when the Dockerfile or compose config changes.",
  ],
  8: [
    "Devcontainers are genuinely useful, but they're not magic.",
    "You get standardization, reproducibility, no local dependency pollution. In exchange you deal with container lifecycle friction, volume semantics, and permission mismatches.",
    "The important one for this talk: containerized does not automatically mean secure. A normal devcontainer is a comfortable developer environment, not a sandbox.",
    "On Apple Silicon, x86 images run under Rosetta emulation — noticeable slowdown, and not all images publish multi-arch builds.",
    "Shell config like .zshrc and .gitconfig doesn't carry over automatically. VS Code has a dotfiles repo feature but it needs explicit setup.",
  ],
  12: [
    "Now that we understand what devcontainers give us, let's look at why autonomous agents need additional controls on top.",
  ],
  13: [
    "The access is intentional — these tools need it to be useful. Read and write files, run commands, make HTTP requests, call APIs — that's the job.",
    "The question is whether the access should be completely unrestricted, or whether meaningful controls can coexist with usefulness.",
    "Yes, they can. Scope the access, don't remove it. The agent still needs to work — it just shouldn't have a blank cheque.",
  ],
  14: [
    "The risk isn't only a malicious model. It's also prompt injection from external content the model reads, model errors, or simply overly broad access that an accident can exploit.",
    "Four concrete threat surfaces: arbitrary outbound HTTP, secret leakage from mounted files, Git credential abuse, and DNS exfiltration.",
    "DNS is easy to overlook. Small UDP queries bypass HTTP allowlists entirely because DNS is not HTTP. Secrets encoded as subdomain labels are invisible to mitmproxy.",
    "The blast radius of a mistake scales directly with how much access the agent was given.",
  ],
  15: [
    "This is not anti-devcontainer. It's pro-devcontainer with sharper boundaries for autonomous tools.",
    "The design target is practical containment: usable enough for real work, not equivalent to dropping the agent into your full host environment.",
    "Three surfaces that matter: egress — what HTTP destinations are reachable. DNS — what names resolve. Credentials — what keys the workspace actually holds.",
  ],
  16: [
    "Three layered controls. Egress: mitmproxy with an allowlist intercepts all outbound HTTP and HTTPS. DNS: CoreDNS generated from the same allowlist closes the DNS exfiltration channel. Credentials: git-broker holds the deploy key so the workspace never does.",
  ],
  18: [
    "All services share mitmproxy's network namespace — they have no independent egress path.",
    "Local service traffic between OpenCode and its sidecars stays on loopback. All outbound funnels through one policy point.",
    "mitmproxy is the only container with real external egress. It's the sole gateway.",
    "openrouter-proxy is a local sidecar that holds the OpenRouter API key. The workspace sends requests to 127.0.0.1:4000/v1 and never sees the real key.",
  ],
  19: [
    "The core architectural move: sharing the network namespace gives you a single choke point without sidecar injection or complex routing.",
    "network_mode: service:mitmproxy — the service joins mitmproxy's network namespace instead of getting its own. No separate interface, no Docker DNS. Services are just ports on 127.0.0.1.",
    "DNAT stands for Destination Network Address Translation — the kernel rewrites the destination IP and port of outbound packets before they leave, redirecting them into mitmproxy.",
    "Two-network design: ai_boundary is internal: true — no gateway, no internet, container-to-container only. ai_egress is a standard bridge with a gateway — mitmproxy's path out. Only mitmproxy bridges both. Even if iptables rules were bypassed, there is no egress interface for the other services.",
    "NET_RAW lets a process open raw sockets and construct packets below the TCP and UDP stack — bypassing iptables DNAT entirely. Dropping NET_RAW from the workspace closes that gap.",
    "The mitmproxy CA is installed into the system trust store at startup so curl, Git, and Python all trust the MITM automatically. Node-based sidecars also get NODE_EXTRA_CA_CERTS because official Node images don't honour the OS trust store by default.",
  ],
  20: [
    "The allowlist is default-deny: anything not explicitly listed is blocked.",
    "It supports exact hostnames, wildcard subdomains, path prefixes, method restrictions, and deny-list mode for specific paths.",
    "Policy is baked into the mitmproxy image at build time. Changing it requires a rebuild. That's intentional — it prevents runtime drift and makes policy changes visible in git history.",
    "GitHub is restricted to GET and HEAD only. This closes the vector where an agent reads a repo containing a PAT and uses it to push via HTTPS or call write endpoints on the REST API. The git-broker uses SSH over port 443 with a UID-based iptables exception, so it's unaffected.",
    "Raw IP addresses are always blocked, even with a global wildcard rule. The allowlist matches the HTTP Host header — the hostname the client declares, not the IP it connects to. A client can set any Host header it wants. CDN IPs also rotate. Hostname-only policy is the right model.",
    "QUIC and HTTP/3 run over UDP, not TCP. iptables DNAT only intercepts TCP on 80 and 443. An HTTP/3 request over UDP 443 would bypass mitmproxy entirely. UDP 80 and 443 are explicitly dropped — clients fall back to TCP.",
  ],
  21: [
    "DNS is a classic covert channel that bypasses HTTP-level controls entirely. An agent can encode secrets as subdomain labels — small UDP queries that are invisible to mitmproxy.",
    "The CoreDNS Corefile is generated at image build time from the same allow-list.yaml that mitmproxy uses. HTTP and DNS policy share a single source of truth — there's no drift.",
    "iptables ensures CoreDNS is the only process that can reach Docker's internal resolver directly. Everything else is redirected to CoreDNS first.",
    "DNS-over-TLS on port 853 is an encrypted DNS channel that would bypass CoreDNS entirely. Port 853 is explicitly rejected outbound.",
    "QUIC is blocked for the same reason as in HTTP — UDP 443 bypasses TCP interception.",
  ],
  22: [
    "Every DNS query from the workspace is redirected to CoreDNS on 127.0.0.53:5353 via iptables DNAT before it can reach Docker's resolver or the internet.",
    "CoreDNS only forwards queries for allowlisted zones upstream — everything else gets REFUSED.",
    "This closes the subdomain-encoding and DNS tunnel exfiltration vectors that HTTP-only controls leave open.",
  ],
  23: [
    "TCP 80 and 443 are redirected into mitmproxy by iptables. The allowlist.py addon checks host, path, and method on every request.",
    "Allowed requests continue upstream. Blocked requests get a 403 — the agent sees the rejection immediately.",
    "This is why HTTP_PROXY can't be ignored: the redirection happens at the kernel level, not the application level.",
  ],
  24: [
    "The sandbox is opinionated but not unusable. Real developer workflows still work.",
    "npm install, pip install, cargo build, GitHub fetches, Perplexity and Brave search, model access via proxy — everything a coding agent actually needs is allowed.",
    "What's blocked: arbitrary outbound HTTP, DNS tunneling, DNS-over-TLS bypass, raw git push with no key in workspace, GitHub HTTPS push even with a PAT due to the GET/HEAD restriction, and QUIC/HTTP3.",
    "When the agent hits a 403 it knows immediately the request was blocked. There's no silent failure.",
  ],
  25: [
    "Authenticated Git access is high-leverage. A leaked key or token can push to any branch, rewrite history, or delete refs.",
    "Two goals: don't leak the key — the workspace never holds it. And don't push to arbitrary repos — the broker validates origin and branch before every operation.",
    "The git-broker is a separate container with a dedicated deploy key mounted read-only from the host. It exposes narrow MCP tools: describe_push_policy, fetch_origin, push_current_head.",
    "The agent gets operations, not credentials. It calls broker tools via MCP but never holds the key that makes the push possible.",
    "Host-side scripts automate deploy key creation and revocation via the GitHub API — no manual key management.",
  ],
  26: [
    "The project doesn't claim perfect containment. It claims meaningful controls layered on a familiar workflow.",
    "If an allowlisted endpoint gets compromised or cooperates with an attacker, it can exfiltrate data on behalf of the agent. The sandbox can't prevent that.",
    "If a DNS-over-HTTPS resolver endpoint ever enters the allowlist, DNS becomes an application-layer exfiltration channel over HTTPS 443 — mitmproxy would see it as normal HTTPS traffic.",
    "A github.com allowlist entry permits DNS queries for the whole github.com zone, not just that exact host. Tightening to exact-host DNS policy would require more complex CoreDNS configuration.",
    "Kernel exploits or container escapes: if the kernel or container runtime is compromised, all bets are off. This is a developer sandbox, not a VM boundary.",
    "Every new MCP server or package registry added to the allowlist widens the attack surface. Review additions carefully.",
  ],
  27: [
    "Keep the ergonomics, tighten the trust model. The agent can still do real work.",
    "These controls are composable and incrementally adoptable. Start with mitmproxy egress, add CoreDNS, add git-broker — each layer is independent.",
    "The shared network namespace trick is the most reusable idea: one Docker config line gives you a single policy choke point without sidecar injection.",
    "The git-broker pattern is broadly applicable: any credential that needs to be used but not exposed can be brokered through a narrow MCP interface.",
    "Enforce HTTP and DNS policy from a single allow-list so they can never drift apart.",
  ],
}

export default function App() {
  const revealNotes = createRevealNotesAspectFix(1600, 1000)

  return (
    <Deck
      config={{
        hash: true,
        width: 1600,
        height: 1000,
        margin: 0.015,
        center: true,
        controls: false,
        progress: false,
        slideNumber: false,
        transition: 'slide',
        backgroundTransition: 'fade',
      }}
      plugins={[revealNotes]}
    >
      <Slide notes={speakerNotes[1].join('\n\n')}>
        <Slide01Intro />
      </Slide>
      <Slide>
        <Slide02Disclaimer />
      </Slide>
      <Slide notes={speakerNotes[3].join('\n\n')}>
        <Slide03DevcontainersSection />
      </Slide>
      <Slide>
        <Slide04WhatIsDevcontainer />
      </Slide>
      <Slide>
        <Slide05ExampleDevcontainers />
      </Slide>
      <Slide notes={speakerNotes[6].join('\n\n')}>
        <Slide06DockerComposeDevcontainer />
      </Slide>
      <Slide notes={speakerNotes[7].join('\n\n')}>
        <Slide07HowVscodeRuns />
      </Slide>
      <Slide notes={speakerNotes[8].join('\n\n')}>
        <Slide08WhyTeamsUse />
      </Slide>
      <Slide>
        <Slide09WhatDevcontainersWereMeantToSolve />
      </Slide>
      <Slide>
        <Slide10DevcontainerAgentWorkflow />
      </Slide>
      <Slide>
        <Slide11WhatDevcontainersDontGive />
      </Slide>
      <Slide notes={speakerNotes[12].join('\n\n')}>
        <Slide12ProblemSection />
      </Slide>
      <Slide notes={speakerNotes[13].join('\n\n')}>
        <Slide13AgenticTools />
      </Slide>
      <Slide notes={speakerNotes[14].join('\n\n')}>
        <Slide14TrustProblem />
      </Slide>
      <Slide notes={speakerNotes[15].join('\n\n')}>
        <Slide15DesignGoal />
      </Slide>
      <Slide notes={speakerNotes[16].join('\n\n')}>
        <Slide16SandboxSection />
      </Slide>
      <Slide>
        <Slide17ArchitectureDiagram />
      </Slide>
      <Slide notes={speakerNotes[18].join('\n\n')}>
        <Slide18ArchitectureOverview />
      </Slide>
      <Slide notes={speakerNotes[19].join('\n\n')}>
        <Slide19SharedNetworkNamespace />
      </Slide>
      <Slide notes={speakerNotes[20].join('\n\n')}>
        <Slide20MitmproxyAllowlist />
      </Slide>
      <Slide notes={speakerNotes[21].join('\n\n')}>
        <Slide21DnsExfiltration />
      </Slide>
      <Slide notes={speakerNotes[22].join('\n\n')}>
        <Slide22DnsQueryFlow />
      </Slide>
      <Slide notes={speakerNotes[23].join('\n\n')}>
        <Slide23HttpInterceptionFlow />
      </Slide>
      <Slide notes={speakerNotes[24].join('\n\n')}>
        <Slide24WhatGetsBlocked />
      </Slide>
      <Slide notes={speakerNotes[25].join('\n\n')}>
        <Slide25GitCredentialIsolation />
      </Slide>
      <Slide notes={speakerNotes[26].join('\n\n')}>
        <Slide26HonestTradeoffs />
      </Slide>
      <Slide notes={speakerNotes[27].join('\n\n')}>
        <Slide27Takeaways />
      </Slide>
      <Slide>
        <Slide28ThankYou />
      </Slide>
    </Deck>
  )
}
