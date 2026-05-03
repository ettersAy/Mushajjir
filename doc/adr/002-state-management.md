# ADR 002: State Management — Pinia (Composition API)

**Status:** Accepted  
**Date:** 2025-04  
**Context:** Vue 3 SPA requiring shared reactive state across components — tree data, UI state (search, focus mode, filters), and relation-draft state. Options included Pinia, Vuex 4, and the raw Composition API with `provide/inject`.

**Decision:** Use Pinia with the Composition API (`setup` store) style.

**Rationale:**
- **Pinia is the official Vue 3 recommendation** — Vuex 4 is in maintenance mode; Pinia is the Vue core team's successor.
- **Composition API style** — The `defineStore('name', () => { ... })` pattern integrates naturally with Vue 3's `<script setup>` components.
- **TypeScript optional** — Pinia works well without TypeScript, matching the project's JS-only choice.
- **DevTools support** — Pinia integrates with Vue DevTools for time-travel debugging.
- **Lightweight** — ~1KB gzipped; no boilerplate.

**Consequences:**
- Two stores (`treeStore`, `settingsStore`) with clear separation of concerns.
- Computed properties in stores use Vue's `computed()` refs — standard Composition API.
- No mutation event system (like Vuex) — direct state mutation is the Pinia convention.
