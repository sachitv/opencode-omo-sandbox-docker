import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import Slide01Intro from '../src/slides/01-intro'
import Slide02DevcontainersSection from '../src/slides/02-devcontainers-section'
import Slide03WhatIsDevcontainer from '../src/slides/03-what-is-devcontainer'
import Slide04DevcontainerJson from '../src/slides/04-devcontainer-json'
import Slide05HowVscodeRuns from '../src/slides/05-how-vscode-runs'
import Slide06DockerCompose from '../src/slides/06-docker-compose'
import Slide07WhyTeamsUse from '../src/slides/07-why-teams-use'
import Slide08WhatDevcontainersDontGive from '../src/slides/08-what-devcontainers-dont-give'
import Slide09ProblemSection from '../src/slides/09-problem-section'
import Slide10AgenticTools from '../src/slides/10-agentic-tools'
import Slide11TrustProblem from '../src/slides/11-trust-problem'
import Slide12DesignGoal from '../src/slides/12-design-goal'
import Slide13SandboxSection from '../src/slides/13-sandbox-section'
import Slide14ArchitectureOverview from '../src/slides/14-architecture-overview'
import Slide15SharedNetworkNamespace from '../src/slides/15-shared-network-namespace'
import Slide16MitmproxyAllowlist from '../src/slides/16-mitmproxy-allowlist'
import Slide17DnsExfiltration from '../src/slides/17-dns-exfiltration'
import Slide18GitCredentialIsolation from '../src/slides/18-git-credential-isolation'
import Slide19WhatGetsBlocked from '../src/slides/19-what-gets-blocked'
import Slide20HonestTradeoffs from '../src/slides/20-honest-tradeoffs'
import Slide21Takeaways from '../src/slides/21-takeaways'

const slides = [
  Slide01Intro,
  Slide02DevcontainersSection,
  Slide03WhatIsDevcontainer,
  Slide04DevcontainerJson,
  Slide05HowVscodeRuns,
  Slide06DockerCompose,
  Slide07WhyTeamsUse,
  Slide08WhatDevcontainersDontGive,
  Slide09ProblemSection,
  Slide10AgenticTools,
  Slide11TrustProblem,
  Slide12DesignGoal,
  Slide13SandboxSection,
  Slide14ArchitectureOverview,
  Slide15SharedNetworkNamespace,
  Slide16MitmproxyAllowlist,
  Slide17DnsExfiltration,
  Slide18GitCredentialIsolation,
  Slide19WhatGetsBlocked,
  Slide20HonestTradeoffs,
  Slide21Takeaways,
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
        height: 900px;
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
        height: 900px;
        overflow: hidden;
      }
      .slide {
        width: 1600px;
        height: 900px;
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
