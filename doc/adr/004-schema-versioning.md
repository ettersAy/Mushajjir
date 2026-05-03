# ADR 004: Schema Versioning — Envelope with `schemaVersion`

**Status:** Accepted  
**Date:** 2025-04  
**Context:** The tree data structure (nodes, edges, node data) evolves as features are added. Without versioning, old saved data could break after schema changes. A backwards-compatible migration strategy is needed.

**Decision:** Wrap persisted data in an envelope object with `schemaVersion`, `savedAt`, and `tree` fields. Use `normalizeTree()` to normalize any loaded data regardless of version.

**Rationale:**
- **Forward migration** — `normalizeTree()` applies defaults for any missing fields (e.g., new `notes` field on old nodes).
- **Backward compatibility** — v1 schema (bare `{nodes, edges}` without envelope) is still detected and loaded via legacy key fallback.
- **Self-describing** — The schema version is explicit in the persisted JSON, making debugging easier.
- **Minimal overhead** — The envelope adds <100 bytes to each save.

**Consequences:**
- Schema migration logic lives in `storageService.js` and `treeUtils.js::normalizeNodeData()`.
- Each new field added to `normalizeNodeData()` gets a sensible default — no separate migration step needed for additive changes.
- Breaking changes (removing fields, changing types) require a version check and explicit migration.
