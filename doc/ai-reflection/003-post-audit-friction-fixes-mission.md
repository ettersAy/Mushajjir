# Mission Reflection — Post-Audit Friction Fixes (#10)

## Time Wasters

- Had to scan 10 points in the issue, but 4 were already partially or fully implemented — clarifying which points still need work would save discovery time
- Reading `treeStore.js` again to understand data model for test creation — the newly created `doc/data-model.md` eliminates this for future agents
- Test for `descendantIds` cycle handling failed — expected `['b']` but got `['b', 'a']`; had to re-read the source to understand the `seen` set propagation across recursive calls
- `renderMarkdown(null)` vs `renderMarkdown(undefined)` behavior difference — default parameter only triggers for `undefined`, not `null`; initially assumed both would return `''`
- `renderMarkdown('')` returns `''` vs `renderMarkdown(null)` returns `'<p>null</p>'` — unexpected inconsistency in the function's input handling

## Hard to Find

- Whether `globalThis.clearTimeout` was intentional or legacy — had to read the full `storageService.js` to confirm browser-only context
- The exact shape of `normalizeNodeData` output for test assertions — had to copy field-by-field from the source to build test fixtures
- Which store computed properties are "critical" for smoke testing — the issue says "critical store computed properties" but doesn't specify which ones; chose `progressByNode`, `visibleNodeIds`, `flowNodes` based on benchmark references

## Confusion / Hesitation

- Point 2 (Test Infrastructure) said "Zero tests exist" but `src/utils/__tests__/testFixtures.test.js` and `src/services/__tests__/aiResponseSchema.test.js` already existed — the issue description was stale
- Point 4 (Pre-Commit Hooks) was already fully set up with Husky + lint-staged — no work needed
- Point 7 (MCP Tool) was already partially done via `.mcp/servers/node-npm-mcp.mjs` — created `scripts/project-index.mjs` as complement
- Point 9 (Benchmark) was already fully implemented — no work needed
- The `vitest.config.js` uses `environment: 'node'` but some tests use `window` references — had to verify tests don't actually need browser APIs

## Repeated Searches

- Searched for `normalizeNodeData` multiple times across `treeUtils.js`, `treeStore.js`, `testFixtures.js` to understand all field defaults
- Searched for localStorage keys to map persistence migration path
- Read `settingsService.js` twice to understand DEFAULT_SETTINGS structure for the data model doc

## Documentation Improvement Reflection

- `doc/data-model.md` now exists — future agents get 10-minute discovery in 1 minute
- `CONTRIBUTING.md` testing section was stale ("Tests are not yet set up") — now updated with actual test conventions and run commands
- `doc/deployment.md` now documents GitHub Pages deploy URL, triggers, and verification steps
- `.node-version` now explicitly signals Node.js 22 requirement

## Automation Reflection

- Import extension checking was manual grep — now automated via `scripts/check-imports.sh` with `npm run check-imports`
- Project component/store discovery was manual file reading — now automated via `scripts/project-index.mjs`
- Test setup requires remembering `vitest run` path and pattern — `npm test` script already covers this
- Pre-commit quality gates were manual — Husky + lint-staged already automate formatting/linting
