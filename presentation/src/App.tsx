import { Deck, Slide } from '@revealjs/react'
import 'reveal.js/reveal.css'
import './index.css'
import { createRevealNotesAspectFix } from './reveal-notes-aspect-fix'

import Slide01Intro from './slides/01-intro'
import Slide02Disclaimer from './slides/02-disclaimer'
import Slide02bWhyThisProject from './slides/02b-why-this-project'
import Slide03DevcontainersSection from './slides/03-devcontainers-section'
import Slide04WhatIsDevcontainer from './slides/04-what-is-devcontainer'
import Slide05ExampleDevcontainers from './slides/05-example-devcontainers'
import Slide06DockerComposeDevcontainer from './slides/06-docker-compose-devcontainer'
import Slide07HowVscodeRuns from './slides/07-how-vscode-runs'
import Slide09WhatDevcontainersWereMeantToSolve from './slides/09-what-devcontainers-were-meant-to-solve'
import Slide08WhyTeamsUse from './slides/08-why-teams-use'
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
import Slide29AppendixSection from './slides/29-appendix-section'
import Slide31VsCodePortForwarding from './slides/31-vscode-port-forwarding'
import Slide32DeployKeyLifecycle from './slides/32-deploy-key-lifecycle'
import Slide33RawIpBlocking from './slides/33-raw-ip-blocking'

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
      <Slide>
        <Slide01Intro />
      </Slide>
      <Slide>
        <Slide02Disclaimer />
      </Slide>
      <Slide>
        <Slide02bWhyThisProject />
      </Slide>
      <Slide>
        <Slide03DevcontainersSection />
      </Slide>
      <Slide>
        <Slide04WhatIsDevcontainer />
      </Slide>
      <Slide>
        <Slide05ExampleDevcontainers />
      </Slide>
      <Slide>
        <Slide06DockerComposeDevcontainer />
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
      <Slide>
        <Slide12ProblemSection />
      </Slide>
      <Slide>
        <Slide13AgenticTools />
      </Slide>
      <Slide>
        <Slide14TrustProblem />
      </Slide>
      <Slide>
        <Slide15DesignGoal />
      </Slide>
      <Slide>
        <Slide16SandboxSection />
      </Slide>
      <Slide>
        <Slide17ArchitectureDiagram />
      </Slide>
      <Slide>
        <Slide18ArchitectureOverview />
      </Slide>
      <Slide>
        <Slide19SharedNetworkNamespace />
      </Slide>
      <Slide>
        <Slide20MitmproxyAllowlist />
      </Slide>
      <Slide>
        <Slide33RawIpBlocking />
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
        <Slide32DeployKeyLifecycle />
      </Slide>
      <Slide>
        <Slide31VsCodePortForwarding />
      </Slide>
      <Slide>
        <Slide26HonestTradeoffs />
      </Slide>
      <Slide>
        <Slide27Takeaways />
      </Slide>
      <Slide>
        <Slide28ThankYou />
      </Slide>
      <Slide>
        <Slide29AppendixSection />
      </Slide>
      <Slide>
        <Slide07HowVscodeRuns />
      </Slide>
      <Slide>
        <Slide08WhyTeamsUse />
      </Slide>
    </Deck>
  )
}
