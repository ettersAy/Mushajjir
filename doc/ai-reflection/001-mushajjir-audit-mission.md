# Mission Reflection — Mushajjir Full Codebase Audit

## Time Wasters

- Had to read every file individually (17 source files) — no project-level index or summary existed
- `treeStore.js` and `treeUtils.js` are large and required scrolling/searching to understand dependencies
- No tests meant I couldn't verify behavior by running any — had to trace logic manually for `progressByNode`, `visibleNodeIds`, etc.
- `.clinerules` mentions conventions but does NOT document the tree data model schema, edge kind system, or flowNodes/flowEdges computed pipeline — had to derive this from code
- No architecture diagram or typed interfaces — object shapes (node data, edge data, settings) had to be reverse-engineered

## Hard to Find

- The exact shape of `normalizeNodeData` output — scattered as implicit across `treeUtils.js` export
- The relation edge vs hierarchy edge distinction logic — spread across `treeUtils.js`, `treeStore.js`, `style.css`
- The AI divide child count bug (`slice(0,5)` ignoring requested count) — only found by tracing `divideTask` → `extractJsonArray` → `treeStore.aiDivide`
- Settings merge logic in `settingsService.js` — deep merge of defaults with saved values, easy to miss custom provider handling
- No single place listing all environment assumptions (browser-only, localStorage, no server)

## Confusion / Hesitation

- `useTreeLayout.js` exports BOTH `useTreeLayout()` (composable pattern) AND `layoutTree()` (standalone func) — unclear which to recommend for future work
- `globalThis` vs `window` in `storageService.js` — minor but inconsistent with rest of codebase
- `backgroundColor` computed in `CanvasView.vue` duplicates what CSS variables already handle
- Whether `DEFAULT_TAGS` and `TASK_STATUSES` belong in `treeUtils.js` vs a separate config file — no convention documented

## Repeated Searches

- Searched for "slice(0, 5)" multiple times to understand the child limit bug
- Searched for "localStorage" to understand persistence approach
- Searched for "apiKey" to understand security posture
- Searched for "alert(" to find all error UX paths

## Incorrect Assumptions

- Assumed there would be at least some tests for a production app — found zero
- Assumed `.clinerules` would document the data model — it only documents workflow conventions
- Assumed `layoutTree` was called from the composable — it bypasses it entirely

## Missing Documentation

- No document describing the tree data model (node fields, edge kinds, schema version)
- No document listing environment/browser assumptions
- No changelog or migration guide between schema versions
- No document explaining the computed pipeline: `nodes` → `visibleNodeIds` → `flowNodes`/`flowEdges`
- AI divide prompt template structure is undocumented — relies on reading `aiService.js` directly

## `.clinerules` Gaps

- Should document the tree data model: `{ id, type, position, data: { title, content, notes, tags, taskStatus, collapsed, width, height, childCount, parentId, systemMessage } }`
- Should document edge kinds: `hierarchy` (solid, `smoothstep`) vs `relation` (dashed, purple, optional label)
- Should document the computed pipeline and recomputation triggers
- Should document that AI providers use OpenAI-compatible `/chat/completions` endpoints
- Should document the settings schema: `{ general, save, ai: { providers, selectedProviderId }, prompts: { dividePrompts, selectedDividePromptId } }`

## Automation Opportunities

- Running lint + build + format before every commit could be automated via Husky
- Repeated full-tree walks in computed properties could be profiled/optimized — no perf tooling exists
- No script to generate test fixtures for tree data
- No automated way to validate AI JSON response schema
- No bundled dev server health check (auto open browser, verify Vite is running)
