# Performance Budget

This document defines target thresholds for key operations. Benchmarks are measured via the benchmark script at `benchmark/benchmark.mjs` when present.

## Tree Operations

| Operation | Budget | Notes |
|---|---|---|
| `flowNodes` computed for 1000 nodes | < 5ms | Most expensive computed — builds enriched node objects for Vue Flow |
| `progressByNode` for 500 nodes | < 2ms | Recursive progress aggregation across all descendants |
| `visibleNodeIds` for 1000 nodes | < 3ms | Filter pipeline (collapsed + tags + search) |
| `autoLayout` for 500 nodes | < 50ms | `layoutTree()` — recursive measurement + placement |
| `normalizeTree` for 1000 nodes + 1000 edges | < 10ms | Import/load normalization — must be fast on cold start |

## Persistence

| Operation | Budget | Notes |
|---|---|---|
| `saveTreeNow` for 1000 nodes | < 5ms | JSON.stringify + localStorage.setItem |
| `loadTree` for 1000 nodes | < 15ms | localStorage.getItem + JSON.parse + normalizeTree |

## AI Operations

| Operation | Budget | Notes |
|---|---|---|
| AI Divide (API call) | < 15s | Network latency dominated; budget is for UX feedback |
| AI Reformulate (API call) | < 10s | Same — network dominated |
| `extractJsonArray` parsing | < 1ms | AI response parsing is negligible |

## Rendering

| Operation | Budget | Notes |
|---|---|---|
| Initial mount (1000 nodes) | < 500ms | Vue Flow initialization + layout |
| Node click → selection highlight | < 50ms | Visual feedback latency |
| Search filter re-render (500 visible nodes) | < 100ms | Filtered list + highlighting |

## Measurement Notes

- All budgets are for **median** of 5 runs on a modern laptop (M-series Mac or equivalent).
- First-time loads may be slower due to JIT compilation — warm cache results matter.
- Benchmarks should be run in headless Chromium via Playwright to match real browser conditions.

## Violation Response

If a benchmark exceeds the budget:
1. Determine whether the regression is caused by the current change set.
2. Profile the hot path using Chrome DevTools Performance tab.
3. Optimize or document the expected regression with justification.
4. Update budgets if the new performance is an acceptable trade-off for added functionality.
