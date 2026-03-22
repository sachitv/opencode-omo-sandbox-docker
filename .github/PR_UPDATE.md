# PR Update Request

## Updated PR Title
```
Fix asset paths for GitHub Pages deployment
```

## Updated PR Description

Assets (architecture diagrams, screenshots, SVG icons) were failing to load on GitHub Pages because absolute paths like `/architecture-diagram.svg` don't resolve correctly when the site is deployed to a subpath like `/opencode-omo-sandbox-docker/`.

### Changes

- **Asset references**: Prefixed all public asset paths with `import.meta.env.BASE_URL` to support the GitHub Pages base path
  - Architecture diagrams in slides 13 and 15
  - VS Code screenshots in slide 04
  - Icon SVGs (docker, vscode, terminal) in slides 04 and 05
  - Background image in slide 01

- **TypeScript types**: Added Vite client reference to `vite-env.d.ts` for `import.meta.env` support

### Technical Details

The `BASE_URL` environment variable is automatically populated by Vite during build based on the `--base` flag (set to `/opencode-omo-sandbox-docker/` in the deploy workflow).

**Before:**
```tsx
<img src="/architecture-diagram.svg" alt="Architecture diagram" />
```

**After:**
```tsx
<img src={`${import.meta.env.BASE_URL}architecture-diagram.svg`} alt="Architecture diagram" />
```

### Testing

The build process validates asset paths during compilation. TypeScript will catch any issues with `import.meta.env` usage, and Vite will fail the build if assets cannot be resolved.

### Files Changed

- `presentation/src/slides/01-intro.tsx` - Background image
- `presentation/src/slides/04-what-is-devcontainer.tsx` - Screenshots and icons
- `presentation/src/slides/05-example-devcontainers.tsx` - Docker icon
- `presentation/src/slides/13-design-goal.tsx` - Sandbox architecture diagram
- `presentation/src/slides/15-architecture-diagram.tsx` - Architecture diagram
- `presentation/src/vite-env.d.ts` - Vite client types reference

---

**Note:** The initial commit included a `verify-assets.py` script, but this was removed in commit 465b814 based on feedback that the build process itself validates asset paths.
