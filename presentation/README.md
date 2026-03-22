# Presentation

Reveal.js slide deck for a 20-minute conference presentation about the
devcontainer sandbox project.

## Run

```sh
cd presentation
bun install
bun run dev
```

Open `http://localhost:3000`.

Press `s` in Reveal.js to open speaker notes.

## Capture Screenshots

The deck includes a headless Playwright capture script that exports every slide step
to `artifacts/slide-shots/` and rebuilds `artifacts/slide-deck.pdf`.

Install Chromium once:

```sh
uv run playwright install chromium
```

Then capture the full deck:

```sh
uv run scripts/capture-slide-shots.py
```

Useful overrides:

```sh
EXPORT_PDF=0 uv run scripts/capture-slide-shots.py
MAX_CAPTURES=5 uv run scripts/capture-slide-shots.py
HEADLESS=0 uv run scripts/capture-slide-shots.py
```

## Diagrams

Diagrams are pre-rendered as SVGs using [Mermaid CLI](https://github.com/mermaid-js/mermaid-cli) and served as static files from `public/`. The slides reference them via `<img src="/....svg">`.

Source files are in `diagrams/` alongside their config:

| Source | Output |
|--------|--------|
| `diagrams/architecture.mmd` | `public/architecture-diagram.svg` |
| `diagrams/sandbox-overview.mmd` | `public/sandbox-architecture-diagram.svg` |

To regenerate:

```sh
# Architecture diagram (shared network namespace / network controls)
bun x mmdc \
  -i diagrams/architecture.mmd \
  -o public/architecture-diagram.svg \
  -c src/slides/mermaid.config.json \
  --cssFile src/slides/mermaid.css \
  -p src/slides/puppeteer.config.json \
  -b transparent

# Mermaid outputs width="100%" which breaks objectFit: contain in browsers.
# Post-process to set explicit pixel dimensions from the viewBox:
node -e "
const fs = require('fs');
let svg = fs.readFileSync('public/architecture-diagram.svg', 'utf-8');
const vb = svg.match(/viewBox=\"([^\"]+)\"/)[1].split(' ').map(Number);
svg = svg.replace(/width=\"100%\"/, \`width=\"\${vb[2]}\" height=\"\${vb[3]}\"\`);
svg = svg.replace(/style=\"max-width:[^\"]*\"/, '');
fs.writeFileSync('public/architecture-diagram.svg', svg);
"

# Sandbox overview diagram (design goal)
bun x mmdc \
  -i diagrams/sandbox-overview.mmd \
  -o public/sandbox-architecture-diagram.svg \
  -c src/slides/mermaid.config.json \
  --cssFile src/slides/mermaid.css \
  -p src/slides/puppeteer.config.json \
  -b transparent
```
