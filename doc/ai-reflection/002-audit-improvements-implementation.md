# Mission Reflection — Audit Improvements Implementation

## Time Wasters

- Reading all 17+ source files again to understand the data model — the architecture reference document I created now solves this for future agents
- `treeUtils.js` import without `.js` extension caused Node.js ESM failures in benchmark script — had to trace back and fix. All ESM imports in the project should use `.js` extensions consistently
- The fixture generator's parent-assignment algorithm caused infinite recursion (cycle) with larger trees — had to debug the `availableParents` pool logic. Root cause: children were added to the eligible-parent pool before they had a parent, creating potential cycles
- Installing `vitest` followed by `husky` + `lint-staged` required two npm install cycles — could batch installs upfront

## Hard to Find

- No single list of which scripts/npm commands exist — had to read `package.json` each time
- No `.gitignore` entry for benchmark outputs or test artifacts — checked manually
- The `lint-staged` config placement in `package.json` vs `.lintstagedrc.js` — no convention documented
- Husky v9+ init command (`npx husky init`) differs from older versions — had to verify

## Confusion / Hesitation

- Whether to use `vitest` with `environment: 'node'` or `environment: 'jsdom'` — current utils don't need DOM, but store tests eventually will. Set to `node` for now
- Seeded PRNG implementation for test fixtures — simple LCG is fine for reproducibility but isn't crypto-safe. Added a comment noting this is for test use only
- AI schema validator lives in `src/services/` but could also go in `src/utils/` — kept it in services since it's tightly coupled to AI response handling

## Repeated Searches

- Searched `package.json` multiple times to verify script names and dependency versions
- Searched for `alert(` across the codebase to find all error UX paths to replace
- Searched for `import .* from` to verify ESM import patterns

## Incorrect Assumptions

- Assumed `vitest` would automatically run all `*.test.js` files — it does, but config was needed for Vue plugin resolution
- Assumed customTree with seed=42 would always produce the same parent-child distribution with `maxChildrenPerParent=2` — random picks by index in `availableParents` list changed when parent-assignment logic changed
- Assumed the existing `extractJsonArray` regex was the only JSON extraction needed — AI responses often wrap JSON in markdown code blocks, requiring a more robust extraction strategy

## Missing Documentation (Still)

- No CONTRIBUTING.md or developer setup guide — `npm install && npm run dev` is simple but undocumented
- No architecture decision records (ADRs) for why Pinia vs Vuex, why localStorage vs IndexedDB, etc.
- No component tree documentation — understanding how `StickyNode.vue` → `TaskModal.vue` → `SettingsPanel.vue` connect requires reading templates

## Automation Discoveries During This Mission

- `npx vitest run` is fast enough (<500ms for 43 tests) to run on every commit
- `node benchmark/benchmark.mjs` completes in ~2 seconds for all 5 tree sizes — can be part of CI
- AI response schema validation is now automated with retry logic — no more silent failures or alert() popups
- The benchmark script's `--format json` flag enables programmatic CI integration
- The fixture generator's `seed` parameter enables deterministic test data — critical for reproducible debugging
