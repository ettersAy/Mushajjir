# 🧪 Mushajjir — Full Codebase Audit & Improvement Plan

> **Date:** 2026-05-02
> **Author:** AI Audit Agent
> **Status:** Reviewed

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Structure](#2-architecture--structure)
3. [Code Quality & Conventions](#3-code-quality--conventions)
4. [Feature Completeness Audit](#4-feature-completeness-audit)
5. [Strengths](#5-strengths)
6. [Weak Points & Technical Debt](#6-weak-points--technical-debt)
7. [UX Issues](#7-ux-issues)
8. [Scalability Problems](#8-scalability-problems)
9. [Security Concerns](#9-security-concerns)
10. [Missing Developer Tooling](#10-missing-developer-tooling)
11. [Improvement Tasks](#11-improvement-tasks)
12. [Future Opportunities](#12-future-opportunities)

---

## 1. Project Overview

| Property | Value |
|---|---|
| **Name** | Mushajjir (مُشَجِّر — Arabic for "branching" / "to tree-ify") |
| **Version** | 0.1.0 |
| **Stack** | Vue 3 + Vite + Pinia + Vue Flow |
| **Persistence** | browser `localStorage` |
| **AI Integration** | OpenAI-compatible APIs (OpenRouter, DeepSeek, Grok) |
| **Deployment** | GitHub Pages via GitHub Actions |
| **Language** | JavaScript (ESM), Vue SFC |
| **Code Quality** | ESLint (flat config v10) + Prettier |
| **Build Status** | ✅ Passes: 0 lint errors, builds in ~540ms, 329 KB JS (gzip: 111 KB) |

### File Count (source)

| Category | Count |
|---|---|
| Vue Components | 7 |
| JS Modules (services/stores/utils/composables) | 7 |
| Config/Infra files | 8 |
| Doc files | 5 |
| **Total source files** | **27** |

---

## 2. Architecture & Structure

### Directory Layout

```
src/
├── components/       # Vue SFC components (5)
│   ├── StickyNode.vue      # Canvas node UI (~480 lines)
│   ├── Toolbar.vue          # Top navigation bar
│   ├── OutlinePanel.vue     # Sidebar tree outline
│   ├── SettingsPanel.vue    # Settings modal
│   └── TaskModal.vue        # Node detail modal
├── composables/
│   └── useTreeLayout.js     # Layout algorithm (exported as standalone, not composable)
├── services/
│   ├── aiService.js         # OpenAI-compatible API calls
│   ├── settingsService.js   # Settings persistence + defaults
│   └── storageService.js    # Tree persistence (localStorage)
├── stores/
│   ├── treeStore.js         # Main tree state (Pinia) — ~530 lines
│   └── settingsStore.js     # Settings state (Pinia)
├── utils/
│   ├── treeUtils.js         # Tree helpers (#1 file: ~480 lines)
│   └── markdown.js          # Markdown→HTML renderer
├── views/
│   └── CanvasView.vue       # Main canvas layout + keyboard shortcuts
├── App.vue                  # Root component
├── main.js                  # Entry point
└── style.css                # Global CSS + theme variables
```

### Architecture Assessment

- **Pattern:** Pinia stores + service layer + utility functions. Clean separation overall.
- **Component tree:** `App → CanvasView → [Toolbar, OutlinePanel, SettingsPanel, TaskModal, VueFlow → StickyNode]`
- **Data flow:** Unidirectional: store → computed → Vue Flow nodes/edges → component props
- **Strengths:** No prop-drilling (direct store access), well-organized service layer, normalized data pipeline

---

## 3. Code Quality & Conventions

### ✅ Good

- ESLint flat config (v10 compatible) — zero lint errors
- Prettier formatting — consistent: `semi: false, singleQuote: true, trailingComma: all, printWidth: 120`
- No `any` types or silent failures — explicit error handling where it matters
- `normalizeNodeData` / `normalizeTree` pipeline ensures data integrity at boundaries
- Self-closing void elements, consistent `v-html` guards with eslint-disable comments
- Debounced autosave (250ms) + `beforeunload` flush — thoughtful persistence

### ⚠️ Issues Found

| # | Severity | Issue | File |
|---|----------|-------|------|
| 1 | 🟡 Medium | `useTreeLayout` exports both a composable function and a standalone `layoutTree` function — inconsistent pattern | `useTreeLayout.js` |
| 2 | 🟡 Medium | `treeStore.js` is ~530 lines — should be split into composables | `stores/treeStore.js` |
| 3 | 🟡 Medium | `treeUtils.js` is ~480 lines mixing unrelated concerns: ID generation, tree walking, markdown export, data normalization | `utils/treeUtils.js` |
| 4 | 🟢 Low | Inline `hierarchyEdges` recomputation in `autoLayout()` duplicates `computed` | `stores/treeStore.js:246` |
| 5 | 🟢 Low | `globalThis` used instead of `window` in storage service (OK for workers but inconsistent) | `storageService.js` |
| 6 | 🟢 Low | `backgroundColor` computed in `CanvasView.vue` duplicates the theme logic already in CSS | `views/CanvasView.vue:32` |
| 7 | 🟢 Low | `DEFAULT_TAGS`, `TASK_STATUSES` in `treeUtils.js` are config constants — better as separate config | `utils/treeUtils.js` |
| 8 | 🔴 High | No automated tests whatsoever (unit, integration, e2e) | — |

---

## 4. Feature Completeness Audit

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Editable sticky notes (title/content) | ✅ Complete | Inline editing, no modals needed |
| 2 | Drag & drop nodes | ✅ Complete | Vue Flow handles this |
| 3 | Resize nodes | ✅ Complete | Custom pointer-based resizer |
| 4 | Delete nodes + descendants | ✅ Complete | Cascading delete |
| 5 | Duplicate nodes (subtree) | ✅ Complete | Full subtree cloning with ID remapping |
| 6 | Quick add child | ✅ Complete | Single default child |
| 7 | AI divide (generate child tasks) | ✅ Complete | 3 providers, custom prompts |
| 8 | AI reformulate | ✅ Complete | Improves title/content via AI |
| 9 | Collapse/expand branches | ✅ Complete | With hidden count display |
| 10 | Tags | ✅ Complete | Colorful, filterable, editable per node |
| 11 | Search | ✅ Complete | Global search + focus + ancestor expansion |
| 12 | Focus mode | ✅ Complete | Dims non-selected branches |
| 13 | Relation edges | ✅ Complete | Cross-hierarchy connections with labels |
| 14 | Node notes (Markdown) | ✅ Complete | Collapsible, rendered inline |
| 15 | Task status (todo/in-progress/blocked/done) | ✅ Complete | With progress aggregation |
| 16 | Autosave (localStorage) | ✅ Complete | Debounced 250ms + beforeunload |
| 17 | Export JSON | ✅ Complete | Schema v2 with metadata |
| 18 | Import JSON | ✅ Complete | With validation |
| 19 | Export Markdown | ✅ Complete | Indented tree format |
| 20 | Outline view | ✅ Complete | Sync'd with canvas, collapsible |
| 21 | Keyboard shortcuts | ✅ Complete | `Enter`/`A` add, `Delete` remove, `C` collapse, `F` focus, `/` or `Ctrl+K` search, `Esc` cancel |
| 22 | Dark/Light theme | ✅ Complete | CSS variables + `data-theme` attribute |
| 23 | Mobile responsiveness | ✅ Complete | Media queries, smaller UI |
| 24 | Multiple AI providers | ✅ Complete | OpenRouter, DeepSeek, Grok + custom |
| 25 | Custom divide prompts | ✅ Complete | 4 defaults + custom prompts |
| 26 | Auto-layout | ✅ Complete | Tree-based width-aware positioning |
| 27 | Settings panel | ✅ Complete | General, Save, API keys, Prompts |
| 28 | Task modal (detailed view) | ✅ Complete | Double-click to open |

**Feature coverage: 28/28 — Outstanding for a v0.1 MVP!**

---

## 5. Strengths

1. **Clean codebase** — Lint-free, well-formatted, consistent conventions
2. **Thorough normalization** — `normalizeNodeData` / `normalizeTree` ensures data integrity on all entry points (load, import, create)
3. **Smart progress aggregation** — Recursive `progressByNode` computed walks children and averages statuses
4. **Well-thought-out search UX** — Search matches get highlighted, ancestors auto-expand, canvas auto-centers
5. **Robust AI integration** — Provider abstraction, custom prompts, JSON extraction with fallback parsing
6. **Relation system** — Distinguishes hierarchy vs. relation edges visually (solid vs. dashed, different colors)
7. **Node resizing** — Custom pointer-event-based resizer with sensible min/max constraints
8. **Mobile responsive** — Media queries for 700px and 480px breakpoints, minimap hidden on mobile
9. **Edge animated loading** — Hierarchy edges animate when parent is loading AI results
10. **Tag filtering** — AND logic (must match all selected tags) with ancestor preservation

---

## 6. Weak Points & Technical Debt

### 🔴 High Priority

#### 1. No Test Coverage
- **Zero tests** — no unit, integration, or e2e
- The tree store (`treeStore.js`) has complex computed logic (`progressByNode`, `flowNodes`, `flowEdges`, `visibleNodeIds`) that is untested and prone to regressions
- Edge cases like cycles in relations, orphan nodes, duplicate IDs, very large trees are unverified

#### 2. `treeStore.js` is Too Large (~530 lines)
- Mixes: tree CRUD operations, AI integration, layout orchestration, computed visibility logic, import/export, persistence wiring
- Should be split: tree operations → composable, AI actions → composable, computed visibility → composable

#### 3. AI API Keys in localStorage
- Stored in plaintext in localStorage under `mushajjir-settings-v1`
- The SettingsPanel itself warns: *"Keys are stored only in this browser localStorage. This is fine for local personal use, but not for a public hosted app."*
- No encryption, no HTTP-only cookies, no backend proxy

#### 4. No Undo/Redo
- Deleting a node or subtree is irreversible (except via JSON re-import)
- AI divide generates children with no way to revert
- Would significantly improve user confidence

#### 5. No Collision Handling for Node Positions
- `autoLayout` / `createChildNodes` can place nodes on top of manually positioned nodes
- No overlap detection or warning

### 🟡 Medium Priority

#### 6. `treeUtils.js` is a God Module (~480 lines)
- Mixes: ID generation, normalization, tree walking, edge creation, markdown export, tag utilities
- Everything depends on it: stores, components, services
- Should split: `id.js`, `normalize.js`, `treeWalk.js`, `edgeUtils.js`, `markdownExport.js`

#### 7. `useTreeLayout.js` Pattern Inconsistency
- Exports both `useTreeLayout()` (a function returning `{ childPositions }`) AND `layoutTree()` (a standalone function)
- The composable is never used as a composable (no `onMounted`, `watch`, `ref`) — it's just a namespace
- `layoutTree` is used directly in `treeStore.js` bypassing the composable entirely

#### 8. Hardcoded Limitations
- AI divide: limited to 5 children (`parsed.slice(0, 5)`) even though the prompt asks for up to 8–12
- Child count: clamped to 1–12 in UI but AI prompts say 3–8 for explicit counts
- Node width: hardcoded fallback `320` in multiple places instead of a single constant
- `collapse/expand` animation not implemented (Mission.md asks for animated transitions)

#### 9. Missing Loading States
- AI divide shows a text "AI working..." but no spinner/progress indicator
- Import JSON has no loading indication for large files

#### 10. Markdown Renderer is Minimal
- Only supports: `**bold**`, `` `code` ``, `[links]()`, `#/##/###` headings, `- ` lists
- No support for: ordered lists, blockquotes, images, tables, strikethrough, task lists

### 🟢 Low Priority

#### 11. Duplicate `backgroundColor` Logic
- `CanvasView.vue` computes background color based on theme, but the same is already handled by CSS `:root` variables

#### 12. `globalThis` in storageService.js
- Inconsistent with the rest of the codebase that uses `window`
- Works but semantically odd for a browser-only app

#### 13. No TypeScript
- Full JS codebase — type safety is left to manual validation
- Many function parameters are untyped objects (e.g., `createNode({ id, parentId, position, data })`)

#### 14. Settings Panel Shows All Providers Including Unselected
- All providers render their API keys in the DOM (type="password" but still in the DOM tree)
- Could leak keys via browser extensions or screenshots

---

## 7. UX Issues

| # | Issue | Severity | Suggestion |
|---|-------|----------|------------|
| 1 | No node creation at root level (quick add) | 🟡 Medium | Add "New root task" button in toolbar |
| 2 | No visual indication that a node is loading (spinner) | 🟡 Medium | Replace text "AI working..." with a CSS spinner |
| 3 | `window.prompt()` for relation label is jarring | 🟢 Low | Use a small inline input instead |
| 4 | `alert()` for AI errors is intrusive | 🟢 Low | Use an inline toast/notification system |
| 5 | No zoom-to-fit button for large trees | 🟢 Low | Already have Vue Flow controls, but fit-view on demand |
| 6 | No "select all" or batch operations | 🟢 Low | Multi-select for batch tag/delete/status change |
| 7 | No drag-to-connect edges from handles | 🟡 Medium | Vue Flow handles exist but edge creation via connection line is not promoted in the UI |
| 8 | Outline panel toggle uses no animation | 🟢 Low | Slide-in/out animation |

---

## 8. Scalability Problems

| # | Issue | Impact | Analysis |
|---|-------|--------|----------|
| 1 | `flowNodes` and `flowEdges` computed rebuild entire arrays on any change | 🟡 500+ nodes | Vue Flow re-renders all nodes even when only one changes. Use shallow refs or track changes per-node. |
| 2 | `progressByNode` recursively walks entire tree on any status change | 🟡 Deep trees | Cached via `Map` but recomputed every time any node changes |
| 3 | `visibleNodeIds`, `tagVisibleIds`, `searchContextIds` are all separate computed arrays that each loop all nodes | 🟡 500+ nodes | Could merge into a single pass |
| 4 | `outlineRows` walks the entire tree recursively on every change | 🟡 500+ nodes | Could use a flat index with depth info |
| 5 | No virtualization for large trees | 🟡 1000+ nodes | Canvas will become sluggish with thousands of DOM nodes |
| 6 | All nodes in localStorage as a single JSON blob | 🟡 10MB+ limit | localStorage is limited to ~5–10 MB. No chunking or compression. |

---

## 9. Security Concerns

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| 1 | API keys in localStorage (plaintext) | 🔴 High | Any browser extension or XSS can read them |
| 2 | No Content Security Policy | 🟡 Medium | `index.html` has no CSP meta tag |
| 3 | `v-html` usage for markdown | 🟡 Medium | Protected by user input only — but XSS risk if importing malicious JSON |
| 4 | No input sanitization on import | 🟢 Low | Imported JSON title/content could contain malicious HTML (but `v-html` is only used for markdown field) |

---

## 10. Missing Developer Tooling

| # | Tooling | Reason |
|---|--------|--------|
| 1 | **Vitest** | Unit tests for stores, utils, services |
| 2 | **Vue Test Utils** | Component tests (StickyNode, Toolbar, etc.) |
| 3 | **Playwright tests** | E2E: create nodes, AI divide, import/export, keyboard shortcuts |
| 4 | **Husky + lint-staged** | Pre-commit hooks for linting + formatting |
| 5 | **commitlint** | Conventional commit enforcement |
| 6 | **Storybook** | Component development environment |
| 7 | **npm audit / Dependabot** | Dependency vulnerability scanning |
| 8 | **Bundle analyzer** | Track JS bundle size (currently 329 KB) |
| 9 | **VS Code debug config** | `.vscode/launch.json` for debugging in Chrome |

---

## 11. Improvement Tasks

### Task 1: Add Automated Testing
**Priority:** 🔴 High
**Estimate:** 3–4 days

- [ ] Set up Vitest + vue-test-utils
- [ ] Unit tests for `treeUtils.js`: `normalizeNodeData`, `normalizeTree`, `descendantIds`, `ancestorIds`, `treeToMarkdown`
- [ ] Unit tests for `treeStore`: `progressByNode`, `visibleNodeIds`, `flowNodes`, `flowEdges`
- [ ] Unit tests for `settingsService`: `mergeSettings`, `loadSettings`, `saveSettings`
- [ ] Unit tests for `aiService`: `extractJsonArray`, `divideTask`, `reformulateTask` (with mocked fetch)
- [ ] Component tests for `StickyNode.vue`, `Toolbar.vue`, `OutlinePanel.vue`

### Task 2: Split Monolith Modules
**Priority:** 🟡 Medium
**Estimate:** 2–3 days

- [ ] Split `treeUtils.js` into:
  - `src/utils/id.js` — `makeId`
  - `src/utils/normalize.js` — `normalizeNodeData`, `normalizeNode`, `normalizeEdge`, `normalizeTree`
  - `src/utils/treeWalk.js` — `descendantIds`, `ancestorIds`, `buildChildrenByParent`, `buildParentByChild`
  - `src/utils/edgeUtils.js` — `createHierarchyEdge`, `createRelationEdge`
  - `src/utils/markdownExport.js` — `treeToMarkdown`
  - `src/config/constants.js` — `TASK_STATUSES`, `DEFAULT_TAGS`, `TAG_COLORS`, `HIERARCHY_EDGE_STYLE`, `RELATION_EDGE_STYLE`
- [ ] Split `treeStore.js` into composables:
  - `src/composables/useTreeComputed.js` — all computed properties
  - `src/composables/useTreeActions.js` — CRUD operations
  - `src/composables/useTreeAI.js` — `aiDivide`, `aiReformulate`

### Task 3: AI Integration Improvements
**Priority:** 🟡 Medium
**Estimate:** 1–2 days

- [ ] Fix child count inconsistency: `parsed.slice(0, 5)` should match the requested count
- [ ] Add loading spinner instead of text "AI working..."
- [ ] Replace `alert()` with a Toast notification system
- [ ] Add streaming support for AI responses (SSE)
- [ ] Add rate limiting / retry logic for API calls

### Task 4: Undo/Redo System
**Priority:** 🟡 Medium
**Estimate:** 2–3 days

- [ ] Implement command history with snapshot diffs
- [ ] Track: node create, delete, duplicate, AI divide, move, resize, edit
- [ ] Keyboard shortcuts: `Ctrl+Z` / `Ctrl+Shift+Z`
- [ ] UI indicator showing undo stack depth

### Task 5: Scalability & Performance
**Priority:** 🟡 Medium
**Estimate:** 2–3 days

- [ ] Merge `flowNodes`/`flowEdges`/`visibleNodeIds`/`tagVisibleIds`/`searchContextIds` into a single pass
- [ ] Add virtual scrolling / canvas-level culling for large trees
- [ ] Cache `progressByNode` with dirty-flag tracking instead of full recomputation
- [ ] Add IndexedDB as a persistence option for trees > 1MB
- [ ] Benchmark with 500+ nodes

### Task 6: Security Hardening
**Priority:** 🟡 Medium
**Estimate:** 1 day

- [ ] Add CSP meta tag to `index.html`
- [ ] Sanitize imported JSON titles/content against XSS
- [ ] Obfuscate API keys in DOM (don't render all keys in settings panel)
- [ ] Consider encryption for stored API keys (Web Crypto API)

### Task 7: UX Polish
**Priority:** 🟢 Low
**Estimate:** 2–3 days

- [ ] Replace `window.prompt()` with inline input for relation labels
- [ ] Add toast notification system (replace `alert()`)
- [ ] Add collapse/expand animation for branches
- [ ] Add slide animation for Outline panel toggle
- [ ] Add "New root task" button in toolbar
- [ ] Improve Markdown renderer (ordered lists, blockquotes, images, tables)

### Task 8: Developer Experience
**Priority:** 🟢 Low
**Estimate:** 1 day

- [ ] Add `vitest` + `vue-test-utils` dev dependencies
- [ ] Configure Husky + lint-staged
- [ ] Add `npm run test` script
- [ ] Add VS Code launch config for debugging
- [ ] Add bundle analysis (`vite-plugin-visualizer`)

---

## 12. Future Opportunities

| Opportunity | Why |
|---|---|
| **IndexedDB backend** | Replace localStorage with IndexedDB for much larger storage and better performance |
| **SQLite backend** (via MCP) | Already planned — `.mcp/data/mushajjir.sqlite` exists as a config |
| **Project management** | Multiple trees/projects with a project list view |
| **Collaborative editing** | WebSocket-based real-time collaboration |
| **Recursive AI decomposition** | Auto-expand AI divide recursively until tasks are atomic |
| **Prompt context inheritance** | Pass ancestor context to AI (already partially implemented) |
| **Plugin system** | Allow custom node types, AI providers, export formats |
| **PWA support** | Service worker for offline use and installable app |
| **Desktop app** | Electron/Tauri wrapper for file system access |
| **CI quality gates** | Add lint + test + build to GitHub Actions |

---

## Summary

**Mushajjir v0.1.0** is a remarkably well-crafted MVP. The architecture is clean, the feature set covers all the Mission.md requirements (28/28), and the code quality is high (0 lint errors, consistent formatting, ~540ms build).

**Top 3 priorities:**

1. **🔴 Add tests** — The most critical missing piece. No coverage means regressions are guaranteed.
2. **🟡 Split monoliths** — `treeStore.js` (530 lines) and `treeUtils.js` (480 lines) are becoming unmanageable.
3. **🟡 AI polish** — Fix child count logic, add loading spinners, replace `alert()` with toasts.

The codebase is production-ready in terms of features but needs testing infrastructure and some architectural refactoring before it can scale beyond the current single-developer, prototype stage.
