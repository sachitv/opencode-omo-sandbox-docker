import { Deck, Slide } from '@revealjs/react'
import 'reveal.js/reveal.css'
import 'reveal.js/plugin/highlight/monokai.css'
import './index.css'
import { createRevealNotesAspectFix } from './reveal-notes-aspect-fix'
import RevealHighlight from 'reveal.js/plugin/highlight'

import Slide01Intro from './slides/01-intro'
import Slide02Disclaimer from './slides/02-disclaimer'
import Slide03WhyThisProject from './slides/03-why-this-project'
import Slide04DevcontainersSection from './slides/04-devcontainers-section'
import Slide05WhatIsDevcontainer from './slides/05-what-is-devcontainer'
import Slide06ExampleDevcontainers from './slides/06-example-devcontainers'
import Slide07DockerComposeDevcontainer from './slides/07-docker-compose-devcontainer'
import Slide08WhatDevcontainersWereMeantToSolve from './slides/08-what-devcontainers-were-meant-to-solve'
import Slide09DevcontainerAgentWorkflow from './slides/09-devcontainer-agent-workflow'
import Slide10WhatDevcontainersDontGive from './slides/10-what-devcontainers-dont-give'
import Slide11ProblemSection from './slides/11-problem-section'
import Slide12AgenticTools from './slides/12-agentic-tools'
import Slide13TrustProblem from './slides/13-trust-problem'
import Slide14DesignGoal from './slides/14-design-goal'
import Slide15SandboxSection from './slides/15-sandbox-section'
import Slide16ArchitectureDiagram from './slides/16-architecture-diagram'
import Slide17ArchitectureOverview from './slides/17-architecture-overview'
import Slide18SharedNetworkNamespace from './slides/18-shared-network-namespace'
import Slide19MitmproxyAllowlist from './slides/19-mitmproxy-allowlist'
import Slide20RawIpBlocking from './slides/20-raw-ip-blocking'
import Slide21DnsExfiltration from './slides/21-dns-exfiltration'
import Slide22DnsQueryFlow from './slides/22-dns-query-flow'
import Slide23HttpInterceptionFlow from './slides/23-http-interception-flow'
import Slide24WhatGetsBlocked from './slides/24-what-gets-blocked'
import Slide25GitCredentialIsolation from './slides/25-git-credential-isolation'
import Slide26DeployKeyLifecycle from './slides/26-deploy-key-lifecycle'
import Slide27VsCodePortForwarding from './slides/27-vscode-port-forwarding'
import Slide28HonestTradeoffs from './slides/28-honest-tradeoffs'
import Slide29Takeaways from './slides/29-takeaways'
import Slide30ThankYou from './slides/30-thank-you'
import Slide31AppendixSection from './slides/31-appendix-section'
import Slide32HowVscodeRuns from './slides/32-how-vscode-runs'
import Slide33WhyTeamsUse from './slides/33-why-teams-use'

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
      plugins={[revealNotes, RevealHighlight()]}
    >
      <Slide>
        <Slide01Intro />
      </Slide>
      <Slide>
        <Slide02Disclaimer />
      </Slide>
      <Slide>
        <Slide03WhyThisProject />
      </Slide>
      <Slide>
        <Slide04DevcontainersSection />
      </Slide>
      <Slide>
        <Slide05WhatIsDevcontainer />
      </Slide>
      <Slide>
        <Slide06ExampleDevcontainers />
      </Slide>
      <Slide>
        <Slide07DockerComposeDevcontainer />
      </Slide>
      <Slide>
        <Slide08WhatDevcontainersWereMeantToSolve />
      </Slide>
      <Slide>
        <Slide09DevcontainerAgentWorkflow />
      </Slide>
      <Slide>
        <Slide10WhatDevcontainersDontGive />
      </Slide>
      <Slide>
        <Slide11ProblemSection />
      </Slide>
      <Slide>
        <Slide12AgenticTools />
      </Slide>
      <Slide>
        <Slide13TrustProblem />
      </Slide>
      <Slide>
        <Slide14DesignGoal />
      </Slide>
      <Slide>
        <Slide15SandboxSection />
      </Slide>
      <Slide>
        <Slide16ArchitectureDiagram />
      </Slide>
      <Slide>
        <Slide17ArchitectureOverview />
      </Slide>
      <Slide>
        <Slide18SharedNetworkNamespace />
      </Slide>
      <Slide>
        <Slide19MitmproxyAllowlist />
      </Slide>
      <Slide>
        <Slide20RawIpBlocking />
      </Slide>
      <Slide>
        <Slide21DnsExfiltration />
      </Slide>
      <Slide>
        <Slide22DnsQueryFlow />
      </Slide>
      <Slide>
        <Slide23HttpInterceptionFlow />
      </Slide>
      <Slide>
        <Slide24WhatGetsBlocked />
      </Slide>
      <Slide>
        <Slide25GitCredentialIsolation />
      </Slide>
      <Slide>
        <Slide26DeployKeyLifecycle />
      </Slide>
      <Slide>
        <Slide27VsCodePortForwarding />
      </Slide>
      <Slide>
        <Slide28HonestTradeoffs />
      </Slide>
      <Slide>
        <Slide29Takeaways />
      </Slide>
      <Slide>
        <Slide30ThankYou />
      </Slide>
      <Slide>
        <Slide31AppendixSection />
      </Slide>
      <Slide>
        <Slide32HowVscodeRuns />
      </Slide>
      <Slide>
        <Slide33WhyTeamsUse />
      </Slide>
    </Deck>
  )
}
