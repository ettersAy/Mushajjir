# Documentation Audit

> Generated after implementing Audit Improvement (#7) improvements.
> Identifies remaining documentation gaps that increase discovery cost.

---

## What Was Added in This Mission

| Document | Status |
|---|---|
| `doc/architecture-reference.md` | ✅ New — full data model, computed pipeline, settings schema, AI interface |
| `.clinerules` Data Model section | ✅ Updated — node shape, edge kinds, store pipeline, settings schema |
| `doc/ai-reflection/002-audit-improvements-implementation.md` | ✅ New — implementation reflection |

---

## Remaining Gaps

### Missing Setup / Developer Onboarding

- **No `CONTRIBUTING.md`** — first-time contributors (including AI agents) must reverse-engineer the setup flow from `package.json` scripts
- **No `.nvmrc` or Node version requirement** — the project may break on older Node versions (uses ESM, `globalThis`, etc.)
- **No browser compatibility doc** — the app uses `localStorage`, `crypto.randomUUID()`, `fetch`, `structuredClone` — no document lists which browsers are supported
- **No dev server health check** — no script to verify Vite is running, open browser, check for errors

### Missing Architecture Documentation

- **No ADR (Architecture Decision Records)** — why Pinia instead of Vuex? Why localStorage instead of IndexedDB/SQLite? Why no backend? These decisions are implicit
- **No component tree diagram** — how `App.vue` → `CanvasView.vue` → `StickyNode.vue` → `TaskModal.vue` interconnect is undocumented
- **No CSS architecture doc** — CSS variables (`--edge`, `--relation`, `--bg`) are defined in `style.css` but their naming convention and usage rules are undocumented
- **No Vue Flow integration notes** — what Vue Flow features are used, which are avoided, custom node types
- **No export/import schema doc** — the `schemaVersion: 2` format has no migration guide between versions

### Missing Process Documentation

- **No release process** — how to version, build, and deploy the SPA to GitHub Pages is only in `.github/workflows/deploy-github-pages.yml`
- **No testing strategy** — what to test, what not to test, how to run specific test subsets
- **No performance budget** — the benchmark exists but there's no documented target (e.g., "flowNodes must complete under 5ms for 1000 nodes")
- **No security notes** — API keys stored in `localStorage` is documented but no security implications or alternatives discussed

### Undocumented Code Areas

- **`useTreeLayout.js` exports two APIs** — the composable `useTreeLayout()` and the standalone `layoutTree()`. Only `layoutTree` is used by the store. No guidance on which to use
- **`DEFAULT_TAGS` and `TASK_STATUSES` in `treeUtils.js`** — configuration data mixed with utility functions. No convention for where config belongs
- **`globalThis` vs `window` in `storageService.js`** — inconsistent pattern. `storageService.js` uses `globalThis` for timer functions but `typeof localStorage === 'undefined'` for localStorage detection
- **`backgroundColor` computed in `CanvasView.vue`** — duplicates what CSS variables handle. Unclear if this is legacy or intentional

---

## Recommended Documentation to Add

| Priority | Document | Reason |
|---|---|---|
| High | `CONTRIBUTING.md` | First-time setup instructions reduce discovery time to zero |
| Medium | Component interaction doc | Vue Flow + Pinia integration pattern is core to the app |
| Medium | ADR for persistence choice | Explains localStorage vs alternatives for future maintainers |
| Low | CSS variable reference | Theme customization requires knowing all `--var` names |
| Low | Performance budget doc | Benchmark without targets is just measurement, not quality gate |
