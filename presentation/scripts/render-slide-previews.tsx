import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import Slide01Intro from '../src/slides/01-intro'
import Slide02Disclaimer from '../src/slides/02-disclaimer'
import Slide03DevcontainersSection from '../src/slides/03-devcontainers-section'
import Slide04WhatIsDevcontainer from '../src/slides/04-what-is-devcontainer'
import Slide05ExampleDevcontainers from '../src/slides/05-example-devcontainers'
import Slide06DockerComposeDevcontainer from '../src/slides/06-docker-compose-devcontainer'
import Slide07HowVscodeRuns from '../src/slides/07-how-vscode-runs'
import Slide08WhyTeamsUse from '../src/slides/08-why-teams-use'
import Slide09WhatDevcontainersDontGive from '../src/slides/09-what-devcontainers-dont-give'
import Slide10ProblemSection from '../src/slides/10-problem-section'
import Slide11AgenticTools from '../src/slides/11-agentic-tools'
import Slide12TrustProblem from '../src/slides/12-trust-problem'
import Slide13DesignGoal from '../src/slides/13-design-goal'
import Slide14SandboxSection from '../src/slides/14-sandbox-section'
import Slide15ArchitectureDiagram from '../src/slides/15-architecture-diagram'
import Slide16ArchitectureOverview from '../src/slides/16-architecture-overview'
import Slide17SharedNetworkNamespace from '../src/slides/17-shared-network-namespace'
import Slide18MitmproxyAllowlist from '../src/slides/18-mitmproxy-allowlist'
import Slide19DnsExfiltration from '../src/slides/19-dns-exfiltration'
import Slide20DnsQueryFlow from '../src/slides/20-dns-query-flow'
import Slide21HttpInterceptionFlow from '../src/slides/21-http-interception-flow'
import Slide22WhatGetsBlocked from '../src/slides/22-what-gets-blocked'
import Slide23GitCredentialIsolation from '../src/slides/23-git-credential-isolation'
import Slide24HonestTradeoffs from '../src/slides/24-honest-tradeoffs'
import Slide25Takeaways from '../src/slides/25-takeaways'
import Slide26ThankYou from '../src/slides/26-thank-you'

const slides = [
  Slide01Intro,
  Slide02Disclaimer,
  Slide03DevcontainersSection,
  Slide04WhatIsDevcontainer,
  Slide05ExampleDevcontainers,
  Slide06DockerComposeDevcontainer,
  Slide07HowVscodeRuns,
  Slide08WhyTeamsUse,
  Slide09WhatDevcontainersDontGive,
  Slide10ProblemSection,
  Slide11AgenticTools,
  Slide12TrustProblem,
  Slide13DesignGoal,
  Slide14SandboxSection,
  Slide15ArchitectureDiagram,
  Slide16ArchitectureOverview,
  Slide17SharedNetworkNamespace,
  Slide18MitmproxyAllowlist,
  Slide19DnsExfiltration,
  Slide20DnsQueryFlow,
  Slide21HttpInterceptionFlow,
  Slide22WhatGetsBlocked,
  Slide23GitCredentialIsolation,
  Slide24HonestTradeoffs,
  Slide25Takeaways,
  Slide26ThankYou,
] as const

const css = readFileSync(join(import.meta.dir, '../src/index.css'), 'utf8')

const outDir = join(import.meta.dir, '../tmp-slide-previews')
mkdirSync(outDir, { recursive: true })

for (const [idx, SlideComponent] of slides.entries()) {
  const body = renderToStaticMarkup(React.createElement(SlideComponent))
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      ${css}
      html, body {
        margin: 0;
        width: 1600px;
        height: 1000px;
        overflow: hidden;
        background: #0d1117;
      }
      body {
        display: flex;
        align-items: stretch;
        justify-content: stretch;
      }
      #preview-root {
        width: 1600px;
        height: 1000px;
        overflow: hidden;
      }
      .slide {
        width: 1600px;
        height: 1000px;
        max-width: none;
        margin: 0;
      }
      .slide.title-slide {
        width: 1600px;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div id="preview-root">${body}</div>
  </body>
</html>`

  const filename = `${String(idx + 1).padStart(2, '0')}.html`
  writeFileSync(join(outDir, filename), html)
}

console.log(outDir)
