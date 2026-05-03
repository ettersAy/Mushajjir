# Changelog

All notable changes to Mushajjir will be documented in this file.

## [0.1.0] — 2025-05

### Added

- Initial release of Mushajjir — AI-powered task decomposition and visualization
- Vue Flow canvas with draggable sticky nodes
- AI task decomposition (divide) via OpenAI-compatible APIs (OpenRouter, DeepSeek, Grok)
- AI task reformulation for improving task descriptions
- Hierarchical tree structure with parent-child relationships
- Relation edges for non-hierarchical peer connections
- Tag system with filtering (backend, frontend, test, urgent, ai-generated)
- Task status tracking (todo, in-progress, blocked, done)
- Progress computation per subtree (recursive average of children)
- Search with context-highlighting (shows ancestors of matching nodes)
- Focus mode for isolating a selected branch
- Outline panel with collapsible tree view
- Settings panel for AI provider and prompt configuration
- localStorage persistence with schema version 2
- JSON export/import with schema version tracking
- Markdown export of tree structure
- Auto-layout algorithm for tree positioning
- Node duplication (subtree clone)
- Collapsible subtrees on canvas
- Dark/light theme support (CSS custom properties)

### Schema

- **Schema version 2**: Split legacy `status` field into `taskStatus` + `systemMessage`
- Added `notesOpen`, `collapsed` fields to node data
- Storage key: `mushajjir-tree-v2` (legacy: `mushajjir-tree-v1`)
- Wrap format: `{ schemaVersion, savedAt, tree }`

---

## [Unreleased]

- Data model documentation (`doc/data-model.md`)
- Test infrastructure with Vitest and smoke tests
- `.node-version` and `engines` field for Node.js version specification
- Pre-commit hooks via Husky + lint-staged
- Import extension validator script (`scripts/check-imports.sh`)
- MCP tooling for project indexing
- Deployment documentation (`doc/deployment.md`)
- Performance benchmark script (`benchmark/benchmark.mjs`)
- Standardized `window` over `globalThis` for browser-specific APIs
