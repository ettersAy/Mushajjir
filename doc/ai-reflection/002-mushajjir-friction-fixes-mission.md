# Mission Reflection — Post-Audit Friction Fixes (#8)

## Time Wasters

- Had to manually grep every `from '..` pattern across 21 files to find extensionless imports — no tool detected this
- Read every source file (17+) even though only ~8 needed changes — no project-level index
- `npm run lint` and `npm run build` each took ~30s+ to complete — no fast feedback loop
- No tests to run for confidence — relied solely on build output

## Hard to Find

- All JS-to-JS import sites required manual `grep -rn "from '\.\."` scanning
- Whether `useTreeLayout()` was imported anywhere else besides `treeStore.js` — only grep revealed it was unused
- Whether `DEFAULT_TAGS`/`TASK_STATUSES` were re-exported or used by external consumers — only used within the project
- The exact boundary between `.vue` and `.js` imports for extension policy

## Confusion / Hesitation

- Whether to add `.js` extensions to `.vue` file imports of `.js` files — Vite resolves without extensions, but Node.js ESM requires them for Node scripts. Decided to add everywhere for consistency.
- Whether extracting config to `src/config/` with re-exports was over-engineering for a small codebase — decided clean separation is worth the minor indirection.
- Whether to remove `useTreeLayout()` entirely vs deprecating — removed since it was dead code with zero callers.

## Repeated Searches

- Grep for `from '\.\.[^\.]` multiple times to find extensionless imports after each batch edit
- Grep for `useTreeLayout` to verify no other imports existed
- Grep for `TASK_STATUSES` and `DEFAULT_TAGS` to find all consumer locations

## Incorrect Assumptions

- Assumed Vite would warn about extensionless imports — it doesn't, they work silently but break Node.js scripts
- Assumed `npm run lint` would catch missing extensions or unused exports — ESLint doesn't check this
- Assumed there was a benchmark directory based on issue #7 references — no benchmark files existed yet

## Missing `.clinerules` Entries Discovered During This Mission

- ESM import extension policy was undocumented — now added
- Config constants location was undocumented — now added
- ADR and architecture doc locations were undocumented — now added

## Automation Opportunities

- MCP tool for Mushajjir project (like Moussawer has) would eliminate file discovery overhead
- Pre-commit hook (`lint-staged` + Husky) to auto-format and lint before commits
- Script to validate all JS imports have `.js` extensions (detect extensionless local imports)
- Script to detect unused exports (would have caught `useTreeLayout()` automatically)
- Fast `npm run lint:changed` script that only lints git-dirty files
- Test suite (Vitest) with basic smoke test: `npm run build` is insufficient confidence
