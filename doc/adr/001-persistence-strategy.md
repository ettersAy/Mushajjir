# ADR 001: Persistence Strategy — localStorage

**Status:** Accepted  
**Date:** 2025-04  
**Context:** Mushajjir is a client-side SPA with no backend. It needs to persist the user's tree data across browser sessions. Options included localStorage, IndexedDB, and a backend BFF (Backend for Frontend).

**Decision:** Use localStorage with JSON serialization and debounced saves.

**Rationale:**
- **No backend requirement** — localStorage works offline, no server needed.
- **Simple schema** — The tree is a small-to-medium JSON object (typically <100KB). No querying, indexing, or relational needs.
- **Schema versioning** — A `schemaVersion` field in the stored JSON enables forward-compatible migrations.
- **Debounced writes** — A 250ms debounce on `saveTree` prevents excessive writes while ensuring data is persisted within ~1 second of changes.
- **IndexedDB would be overkill** — It adds async complexity without benefit for single-object persistence.
- **A BFF would add a full backend** — Out of scope for the MVP; the app intentionally has no server.

**Consequences:**
- Trees larger than ~5MB may hit localStorage quota limits (typically 5-10MB per origin).
- No multi-device sync or cloud backup without building a backend.
- Data loss risk on localStorage clear — users must manually export JSON for durable backups.

**Schema version history:**
- v1: Initial schema with `nodes`/`edges` arrays.
- v2 (current): Wrapped in envelope with `schemaVersion`, `savedAt`, `tree` properties. Added legacy v1 read support.
