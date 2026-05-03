# Mushajjir Architecture Reference

## Component Hierarchy

```
App.vue
 └── CanvasView.vue                     [Main layout + keyboard shortcuts]
      ├── Toolbar.vue                   [Search, tag filters, actions]
      │    │  Store: treeStore (searchQuery, activeTagFilters, availableTags)
      │    │  Store: settingsStore (settings.general)
      │    └── Props: outlineOpen
      ├── OutlinePanel.vue              [Tree outline sidebar]
      │    │  Store: treeStore (outlineRows, outlineCollapsedIds)
      │    └── Emits: none (mutates store directly)
      ├── SettingsPanel.vue             [Modal settings]
      │    │  Store: settingsStore
      │    └── Emits: close
      ├── TaskModal.vue                 [Full-node inline edit modal]
      │    │  Store: treeStore
      │    │  Props: nodeId
      │    └── Emits: close
      └── VueFlow (from @vue-flow/core) [Infinite canvas]
           └── StickyNode.vue           [Node card component]
               │  Store: treeStore
               │  Props: id, data
               │  Types: 'task' | 'sticky' (both mapped to StickyNode)
               └── Emits: open-modal (bubbled to CanvasView)
```

### Data Flow

1. **User input → Store mutation**: Components call store actions directly (e.g., `store.updateNodeData(id, patch)`) — no Vuex-style commit/dispatch pattern.
2. **Store → Vue Flow**: `treeStore.flowNodes` and `treeStore.flowEdges` are computed refs that transform raw `nodes`/`edges` into Vue Flow-compatible objects with visibility, selection, and dimming logic.
3. **Persistence**: `watch` on `[nodes, edges]` triggers debounced `saveTree()` in `storageService.js`. On `beforeunload`, `saveTreeNow()` fires synchronously.
4. **Settings**: `watch` on `settings` triggers `saveSettings()` in `settingsService.js`.

### Key Computed Properties

| Computed | Source | Purpose |
|---|---|---|
| `flowNodes` | `nodes` | Enriched nodes for Vue Flow (visibility, progress, search/focus dimming) |
| `flowEdges` | `edges` | Enriched edges for Vue Flow (visibility, animation, styling) |
| `visibleNodeIds` | `nodes` + filters | Union of collapse, tag, and search filters |
| `progressByNode` | `nodes` → `childrenByParent` | Recursive completion % from leaf taskStatus |
| `outlineRows` | `nodes` → `childrenByParent` | Flat tree rows for OutlinePanel |
| `availableTags` | `DEFAULT_TAGS` + all node tags | Tag filter autocomplete set |

## CSS Custom Properties (Design Tokens)

All colors and design tokens are defined as CSS custom properties on `:root` and `:root[data-theme='dark']` in `src/style.css`.

### Color Tokens

| Variable | Light Default | Dark Default | Usage |
|---|---|---|---|
| `--canvas` | `#f4f3ef` | `#17181b` | Page/canvas background |
| `--surface` | `#ffffff` | `#202226` | Panel backgrounds |
| `--node` | `#ffffff` | `#24272d` | Node card background |
| `--field` | `#f1f2f4` | `#2f333b` | Input, textarea, select backgrounds |
| `--preview` | `#f7f7f8` | `#292d34` | Markdown preview background |
| `--code` | `#e8eaee` | `#3a3f48` | Inline code background |
| `--text` | `#18181b` | `#f4f4f5` | Primary text color |
| `--muted` | `#71717a` | `#a1a1aa` | Secondary/label text |
| `--muted-strong` | `#3f3f46` | `#d4d4d8` | Strong muted text (content, notes) |
| `--accent` | `#2563eb` | `#60a5fa` | Interactive/accent color |
| `--danger` | `#dc2626` | `#ef4444` | Destructive actions (delete) |
| `--relation` | `#7c3aed` | `#a78bfa` | Relation edge color |
| `--button` | `#20242a` | `#f4f4f5` | Primary button background |
| `--button-secondary` | `#5b6470` | `#4b5563` | Secondary button background |
| `--button-text` | `#ffffff` | `#17181b` | Button text color |

### Edge Tokens

| Variable | Light Default | Dark Default | Usage |
|---|---|---|---|
| `--edge` | `#a4a8b0` | `#5e6672` | Hierarchy edge stroke |

### Border/Shadow Tokens

| Variable | Light Default | Dark Default | Usage |
|---|---|---|---|
| `--panel-border` | `rgba(32,36,41,0.12)` | `rgba(255,255,255,0.11)` | Panel/container borders |
| `--shadow` | `0 12px 34px rgba(23,23,23,0.08)` | `0 16px 38px rgba(0,0,0,0.22)` | Subtle shadow |
| `--shadow-strong` | `0 16px 44px rgba(23,23,23,0.13)` | `0 18px 48px rgba(0,0,0,0.34)` | Elevated shadow (hover, modal) |

### Adding a New CSS Variable

1. Define the variable in both `:root` and `:root[data-theme='dark']` in `src/style.css`.
2. Add it to the table above.
3. Reference via `var(--variable-name)` in component `<style>` blocks.

## Store-to-Component Access Pattern

All components access Pinia stores by calling the store composable at the `<script setup>` top level:

```js
import { useTreeStore } from '../stores/treeStore.js'

const store = useTreeStore()
```

Stores are **not** injected or provided — each component that needs store data calls `useXxxStore()` directly. This is the standard Pinia pattern and works because Pinia stores are singletons.

## Keyboard Shortcuts

| Key | Context | Action |
|---|---|---|
| `Enter` / `A` | Canvas (not typing) | Quick-add child to selected node |
| `Delete` | Canvas (not typing) | Delete selected node (not root) |
| `C` | Canvas (not typing) | Toggle collapse on selected node |
| `F` | Canvas (not typing) | Toggle focus mode |
| `Ctrl+K` / `Cmd+K` | Any | Focus search input |
| `/` | Any (not typing) | Focus search input |
| `Escape` | Search active | Clear search / cancel relation draft |
