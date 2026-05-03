# Post-Issue #10 Improvement Opportunities

Discovered during implementation of [Issue #10](https://github.com/ettersAy/Mushajjir/issues/10) (Post-Audit Friction Fixes).

---

## 1. `renderMarkdown` Input Handling Inconsistency

**Problem**: `renderMarkdown(null)` returns `'<p>null</p>'` while `renderMarkdown(undefined)` returns `''`. The default parameter `markdown = ''` only triggers for `undefined`, not `null`. This is a subtle JavaScript behavior that confused test writing.

**Why it slows agents**: Test expectations fail unexpectedly. Agents must read the function signature carefully to understand the default parameter behavior with `null` vs `undefined`.

**Expected improvement**: Add an explicit `if (markdown == null) return ''` guard at the top of `renderMarkdown()` for consistent behavior.

**Future agent benefit**: Predictable function behavior. No test debugging for null/undefined edge cases.

---

## 2. AI Provider Troubleshooting Guide Missing

**Problem**: When AI API calls fail (CORS, missing API key, rate limits, bad model name, provider timeout), the error messages are generic. There is no documentation explaining common failure modes and how to diagnose them.

**Why it slows agents**: Every agent working on AI integration must learn provider error patterns from scratch.

**Expected improvement**: Add `doc/troubleshooting-ai.md` with common failure modes per provider (OpenRouter, DeepSeek, Grok), expected error messages, and resolution steps.

**Future agent benefit**: Quick diagnosis of AI provider issues without reading `aiService.js` internals.

---

## 3. Computed Pipeline Not Visually Documented

**Problem**: The most complex part of the system — the reactive pipeline `nodes/edges → visibleNodeIds → flowNodes/flowEdges` — is documented in text but has no visual diagram. Understanding the filter chain (collapsed → tags → search → focus dimming) requires tracing through `treeStore.js`.

**Why it slows agents**: ~8 minutes reading computed property chains to understand display logic.

**Expected improvement**: Add a Mermaid flowchart in `doc/architecture-reference.md` showing the data flow: `nodes/edges` → `childrenByParent` + `parentByChild` + `nodeById` → `collapsedHiddenIds` + `tagVisibleIds` + `searchContextIds` → `visibleNodeIds` → `flowNodes`/`flowEdges`.

**Future agent benefit**: 30-second understanding instead of 8-minute code tracing.

---

## 4. No Security Documentation

**Problem**: API keys are stored in localStorage with no encryption. `renderMarkdown()` uses `v-html` (with `eslint-disable-next-line`). There is no security documentation discussing the risk posture, XSS surface, or why browser-only localStorage is an acceptable trade-off.

**Why it slows agents**: Agents evaluating security must audit the entire codebase to understand the risk model.

**Expected improvement**: Add `doc/security.md` documenting: API key storage rationale, XSS mitigation (HTML escaping in `renderMarkdown`), no backend = no auth risks, CSP recommendations for GitHub Pages deployment.

**Future agent benefit**: Instant security posture understanding.

---

## 5. No Schema Migration Guide

**Problem**: Schema v1 → v2 migration is handled in code by `normalizeNodeData()` (legacy `status` field) and `storageService.js` (legacy key), but there is no standalone document explaining what changed between versions and how to migrate.

**Why it slows agents**: Every agent that encounters a legacy data format must reverse-engineer the migration from code.

**Expected improvement**: Add a section to `doc/data-model.md` or create a standalone migration guide listing: field changes (status → taskStatus + systemMessage), key rename (v1 → v2), wrap format change (flat → {schemaVersion, savedAt, tree}), and how `loadTree()` handles both formats.

**Future agent benefit**: Quick understanding of data format evolution.

---

## 6. `outlineRows` Computed Not in Architecture Docs

**Problem**: The `outlineRows` computed property in `treeStore.js` powers the OutlinePanel but is not mentioned in `architecture-reference.md`. It has its own walk algorithm distinct from `flowNodes`.

**Why it slows agents**: Agents working on the OutlinePanel must discover this computed property by reading the full store.

**Expected improvement**: Add `outlineRows` to the architecture reference alongside `flowNodes` and `flowEdges`.

**Future agent benefit**: Complete component-to-data-flow mapping for all panels.

---

## 7. Test `environment: 'node'` vs Browser API Usage

**Problem**: `vitest.config.js` sets `environment: 'node'` but several source files use browser APIs (`window`, `localStorage`, `crypto.randomUUID`). Tests pass because current tests don't exercise browser-API-dependent code paths, but future tests for `storageService.js` or `treeStore.js` will fail.

**Why it slows agents**: Confusing configuration mismatch — agents won't know which environment to use for new tests.

**Expected improvement**: Either change vitest environment to `jsdom` or document which modules require browser mocking and add `jsdom` as a dev dependency when browser-API tests are added.

**Future agent benefit**: No test environment confusion when adding storage/store tests.

---

## Summary

| # | Area | Severity | Effort |
|---|---|---|---|
| 1 | `renderMarkdown` null guard | Low | Tiny |
| 2 | AI troubleshooting guide | Medium | Small |
| 3 | Computed pipeline diagram | Medium | Medium |
| 4 | Security documentation | Medium | Small |
| 5 | Schema migration guide | Medium | Small |
| 6 | `outlineRows` in architecture docs | Low | Tiny |
| 7 | Test environment alignment | Medium | Small |
