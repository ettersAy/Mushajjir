# Mushajjir Architecture Reference

> **Purpose**: This document describes the complete data model, edge kind system, store computed pipeline, settings schema, and AI provider interface. Future AI agents should understand the system within 5 minutes.

---

## 1. Node Schema

Each node in the tree is a Vue Flow node (`vue-flow` library). The core shape is:

```js
{
  id: string,          // e.g. "node_550e8400-e29b-..."
  type: 'task',        // always 'task' (sticky type is normalized to 'task')
  position: { x: number, y: number },
  data: {
    // Core fields
    title: string,              // default: 'Untitled task'
    content: string,            // default: ''
    notes: string,              // default: ''
    notesOpen: boolean,         // default: false
    tags: string[],             // cleaned tag strings, max 28 chars

    // Tree structure
    parentId: string | null,    // null for root
    childCount: number | null,  // clamped 1..12, null if unset

    // Status & progress
    taskStatus: 'todo' | 'in-progress' | 'blocked' | 'done',
    systemMessage: string,      // AI working message or error

    // Display
    collapsed: boolean,         // default: false
    width: number,              // clamped 280..560, default 320
    height: number | null,      // clamped 230..760, null = auto

    // Computed (added at render time — not persisted)
    progress: number,           // 0..100, from progressByNode
    actualChildCount: number,
    hiddenDescendantCount: number,
    searchMatch: boolean,
    dimmed: boolean,
    relationDraftSourceId: string | null,
  }
}
```

### Normalization

- `normalizeNodeData(data)` in `src/utils/treeUtils.js` is the canonical normalizer.
- It migrates legacy `status` field → `taskStatus`/`systemMessage`.
- All nodes pass through `normalizeNode()` on load.

---

## 2. Edge Kinds

Two edge kinds exist, distinguished by `edge.data.kind`:

### Hierarchy Edges (`kind: 'hierarchy'`)
- **Purpose**: Parent-child relationships in the tree.
- **Style**: Solid line, 2px stroke, color `var(--edge)`.
- **Type**: `smoothstep`.
- **Animated**: Yes, when the source node is in `loadingNodeIds`.
- **Usage**: Created by `createHierarchyEdge(source, target)`.
- **Excluded from**: `relationEdges`, `childrenByParent`, `parentByChild` computations.

### Relation Edges (`kind: 'relation'`)
- **Purpose**: Cross-tree relationships (dependencies, references).
- **Style**: Dashed line (`7 6`), 1.8px stroke, color `var(--relation)`.
- **Type**: `smoothstep`.
- **Label**: Optional string shown on the edge.
- **Usage**: Created by `createRelationEdge(source, target, label)`.
- **Filtering**: `hierarchyEdges` excludes relation edges.

### Edge Shape

```js
{
  id: string,           // e.g. "edge_..." or "relation_..."
  source: string,       // source node id
  target: string,       // target node id
  type: 'smoothstep',   // Vue Flow edge type
  label: string,        // only for relation edges
  data: {
    kind: 'hierarchy' | 'relation',
    label: string,      // only for relation edges
  },
}
```

---

## 3. Pinia Store Computed Pipeline

The `treeStore` (`src/stores/treeStore.js`) uses a chain of Vue `computed()` properties. Understanding execution order is critical for performance work.

### Computed Dependency Graph

```
nodes (ref) ───────────────────────────────────┐
edges (ref) ────┐                               │
                 ├── hierarchyEdges              │
                 ├── relationEdges               │
                 ├── nodeById (Map)              │
                 ├── childrenByParent (Map)      │
                 ├── parentByChild (Map)         │
                 │                               │
searchQuery ─────┤                               │
activeTagFilters ─┤                              │
                  │                              │
                  ├── matchingNodeIds            │
                  │       │                      │
                  │  ┌────┘                      │
                  │  ├── searchContextIds         │
                  │  ├── firstSearchMatchId      │
                  │                              │
                  ├── tagVisibleIds              │
                  │                              │
                  ├── collapsedHiddenIds         │
                  │       │                      │
                  │       ├── visibleNodeIds     │
                  │              │               │
selectedNodeId ───┤              │               │
                  ├── focusedBranchIds           │
                  │                              │
                  ├── progressByNode             │
                  │       │                      │
                  ├── availableTags              │
                  │                              │
                  ├── flowNodes ─────────────────┤
                  ├── flowEdges ─────────────────┤
                  │                              │
                  ├── outlineRows                │
                  ├── selectedNode               │
                  ├── isBusy                     │
```

### Key Computed Details

| Computed | Inputs | Description |
|---|---|---|
| `hierarchyEdges` | `edges` | Filters out relation edges |
| `relationEdges` | `edges` | Only relation edges |
| `nodeById` | `nodes` | Map<id, node> for O(1) lookup |
| `childrenByParent` | `hierarchyEdges` | Map<parentId, childId[]> |
| `parentByChild` | `hierarchyEdges` | Map<childId, parentId> |
| `matchingNodeIds` | `nodes`, `searchQuery` | Set of node ids matching text search |
| `searchContextIds` | `matchingNodeIds`, `parentByChild` | Matching ids + all their ancestors |
| `tagVisibleIds` | `nodes`, `activeTagFilters`, `parentByChild` | Nodes matching tag filters + ancestors |
| `collapsedHiddenIds` | `nodes`, `childrenByParent` | Descendants of collapsed nodes |
| `visibleNodeIds` | `collapsedHiddenIds`, `tagVisibleIds` | Nodes not hidden by collapse or tag filter |
| `focusedBranchIds` | `selectedNodeId`, `parentByChild`, `childrenByParent` | Selected node + ancestors + descendants |
| `progressByNode` | `nodes`, `childrenByParent`, `nodeById` | Recursive progress (children average → leaf status) |
| `flowNodes` | All of the above | Final display-ready nodes for Vue Flow |
| `flowEdges` | All of the above | Final display-ready edges for Vue Flow |
| `outlineRows` | `nodeById`, `childrenByParent`, `progressByNode` | Flat ordered list for outline panel |

### Progress Computation

```
progressByNode = recursiveMap where:
  leaf node:    todo=0, in-progress=50, done=100
  parent node:  average of all children's progress (rounded)
```

---

## 4. Settings Schema

Persisted to `localStorage` under key `mushajjir-settings-v1`.

```js
{
  general: {
    appName: 'Mushajjir',
    defaultChildCount: 4,   // used when creating children without AI
    theme: 'light' | 'dark',
  },
  save: {
    folderPath: '',          // for file export
    format: 'md',            // export format
  },
  ai: {
    selectedProviderId: string,  // e.g. 'openrouter'
    providers: [
      {
        id: string,          // e.g. 'openrouter'
        name: string,        // display name
        baseUrl: string,     // API endpoint URL
        model: string,       // model name
        apiKey: string,      // API key (stored in localStorage)
      }
    ],
  },
  prompts: {
    selectedDividePromptId: string,
    dividePrompts: [
      {
        id: string,
        name: string,
        content: string,     // system prompt for AI divide
      }
    ],
  },
}
```

### Default Providers

| ID | Name | Base URL | Model |
|---|---|---|---|
| `openrouter` | OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | `deepseek/deepseek-chat-v3-0324:free` |
| `deepseek` | DeepSeek | `https://api.deepseek.com/chat/completions` | `deepseek-chat` |
| `grok` | Grok / xAI | `https://api.x.ai/v1/chat/completions` | `grok-3-mini` |

---

## 5. AI Provider Interface

### API Contract

All providers follow the OpenAI chat completions format:

```
POST {baseUrl}
Authorization: Bearer {apiKey}
Content-Type: application/json

{
  model: string,
  messages: [
    { role: 'system', content: string },
    { role: 'user', content: string },
  ],
  temperature: number (default 0.35),
}
```

Response:

```json
{
  "choices": [
    {
      "message": {
        "content": "{\"title\":\"...\",\"content\":\"...\"}"
      }
    }
  ]
}
```

### Endpoints

#### `divideTask({ provider, node, ancestors, count, systemPrompt })`
- **Purpose**: Split a task into subtasks via AI.
- **Input**: Provider config, parent node, ancestor context, optional count (3-8), optional system prompt override.
- **Expected Response**: JSON array of `{ title, content, description? }` objects.
- **Output**: Array of `{ title: string, content: string }` objects (max 5 items).

#### `reformulateTask({ provider, node, ancestors })`
- **Purpose**: Improve a task's title/content via AI.
- **Input**: Provider config, target node, ancestor context.
- **Expected Response**: JSON object `{ "title": "...", "content": "..." }`.
- **Output**: `{ title: string, content: string }`.

### Error Handling (current)
- Errors caught per-call in `aiDivide`/`aiReformulate` store methods.
- Error message set on `node.data.systemMessage`.
- `alert()` is used as a fallback UI notification (to be improved).

---

## 6. Storage / Persistence

| Store | Key | Format |
|---|---|---|
| Tree nodes & edges | `mushajjir-tree-v2` | `{ schemaVersion: 2, savedAt: ISO, tree: { nodes, edges } }` |
| Settings | `mushajjir-settings-v1` | Direct JSON of settings object |

- Tree save is debounced at 250ms via `saveTree()`.
- Force-save on `beforeunload` via `saveTreeNow()`.
- Legacy schema v1 key `mushajjir-tree-v1` is read on load for migration.

---

## 7. Utility Functions

| Function | File | Purpose |
|---|---|---|
| `normalizeNodeData` | `treeUtils.js` | Sanitizes/clamps all node data fields |
| `normalizeNode` | `treeUtils.js` | Ensures node has id, position, data |
| `normalizeEdge` | `treeUtils.js` | Ensures edge has id, kind, type |
| `normalizeTree` | `treeUtils.js` | Normalizes `{ nodes, edges }` payload |
| `buildChildrenByParent` | `treeUtils.js` | Builds Map from hierarchy edges |
| `buildParentByChild` | `treeUtils.js` | Builds Map from hierarchy edges |
| `descendantIds` | `treeUtils.js` | Recursive descendant lookup |
| `ancestorIds` | `treeUtils.js` | Iterative ancestor lookup |
| `treeToMarkdown` | `treeUtils.js` | Serializes tree to Markdown |
| `renderMarkdown` | `markdown.js` | Renders Markdown to HTML (safe) |
| `layoutTree` | `useTreeLayout.js` | Tree layout algorithm (recursive measure & place) |
