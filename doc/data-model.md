# Data Model Reference

This document describes the Mushajjir tree data model — node shapes, edge kinds, settings schema, and persistence format. Intended for AI agents and contributors who need fast schema understanding without reading source code.

## Table of Contents

- [Tree Node](#tree-node)
- [Edge](#edge)
- [Task Statuses](#task-statuses)
- [Settings](#settings)
- [Persistence Format](#persistence-format)
- [Validation Rules](#validation-rules)
- [Schema Versioning](#schema-versioning)

---

## Tree Node

Every node in the tree is a plain JavaScript object. The canonical normalization happens in `normalizeNodeData()` (`src/utils/treeUtils.js`). All fields described below are the **normalized** output — any input is coerced through `normalizeNodeData()`.

### Node Shape

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | `makeId('node')` | Unique identifier (UUID or fallback timestamp-based) |
| `type` | `string` | `'task'` | Node type. Only `'task'` is used; legacy `'sticky'` is mapped to `'task'` |
| `position` | `{ x: number, y: number }` | `{ x: 0, y: 0 }` | Canvas position in pixels |
| `data` | `object` | _see below_ | Node data object — all semantic content lives here |

### `data` Fields

| Field | Type | Default | Range / Constraints | Description |
|---|---|---|---|---|
| `title` | `string` | `'Untitled task'` | Non-empty after normalize | Task title displayed on the node card |
| `content` | `string` | `''` | Any string | Main task description |
| `notes` | `string` | `''` | Any string | Additional notes (distinct from content) |
| `notesOpen` | `boolean` | `false` | | Whether the notes section is expanded in the UI |
| `tags` | `string[]` | `[]` | Cleaned via `cleanTag()`: trimmed, lowercased, spaces→dashes, max 28 chars | Categorization tags |
| `childCount` | `number \| null` | `null` | `1–12` when set | Hint for AI divide: how many children to generate |
| `parentId` | `string \| null` | `null` | Matches an existing node `id` or `null` | Set during normalization but primarily tracked via edges |
| `taskStatus` | `string` | `'todo'` | One of: `'todo'`, `'in-progress'`, `'blocked'`, `'done'` | Current task state |
| `systemMessage` | `string` | `''` | Any string | Status message shown during AI operations (e.g. "AI working...") |
| `collapsed` | `boolean` | `false` | | Whether children are hidden in the canvas |
| `width` | `number` | `320` | `280–560` | Node card width in pixels |
| `height` | `number \| null` | `null` | `230–760` when set | Node card height in pixels; `null` = auto-height |

### Legacy Migration

The `normalizeNodeData()` function handles a legacy `status` field:

- If `status` matches a known `TASK_STATUSES` id → maps to `taskStatus`
- Otherwise → maps to `systemMessage`

This ensures backward compatibility with data saved before the `taskStatus`/`systemMessage` split.

---

## Edge

Edges connect nodes. There are two kinds:

### Hierarchy Edge (parent → child)

Represents the tree structure. A node can have one parent (via hierarchy) and multiple children.

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | `makeId('edge')` | Unique identifier |
| `source` | `string` | _(required)_ | Parent node ID |
| `target` | `string` | _(required)_ | Child node ID |
| `type` | `string` | `'smoothstep'` | Edge rendering style |
| `data.kind` | `string` | `'hierarchy'` | Edge kind discriminator |
| `data.label` | `string` | `''` | Unused for hierarchy edges |

### Relation Edge (peer connection)

Represents non-hierarchical relationships between any two nodes.

| Field | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | `makeId('relation')` | Unique identifier |
| `source` | `string` | _(required)_ | Source node ID |
| `target` | `string` | _(required)_ | Target node ID |
| `type` | `string` | `'smoothstep'` | Edge rendering style |
| `data.kind` | `string` | `'relation'` | Edge kind discriminator |
| `data.label` | `string` | `''` | Optional label shown on the edge |

### Edge Validation

- `normalizeTree()` filters out edges where source or target don't exist in nodes
- Hierarchy edges are used by `buildChildrenByParent()`, `buildParentByChild()`, `ancestorIds()`, `descendantIds()`
- Relation edges are excluded from tree-structure computations

---

## Task Statuses

Defined in `src/config/index.js`:

| ID | Label |
|---|---|
| `todo` | Todo |
| `in-progress` | In progress |
| `blocked` | Blocked |
| `done` | Done |

Progress computation (in `treeStore.progressByNode`):
- Leaf with status `done` → 100%
- Leaf with status `in-progress` → 50%
- Leaf with any other status → 0%
- Non-leaf → average of all children's progress (rounded)

---

## Settings

Settings are persisted in localStorage under key `mushajjir-settings-v1`. Default values are defined in `src/services/settingsService.js`.

### Schema

```jsonc
{
  "general": {
    "appName": "Mushajjir",       // string
    "defaultChildCount": 4,       // number, used when creating children without explicit count
    "theme": "light"              // string, theme identifier
  },
  "save": {
    "folderPath": "",             // string, future Filesystem Access API path
    "format": "md"                // string, export format
  },
  "ai": {
    "selectedProviderId": "openrouter",  // string, references a provider in the providers array
    "providers": [                       // array of provider objects
      {
        "id": "openrouter",              // string, unique provider identifier
        "name": "OpenRouter",            // string, display name
        "baseUrl": "https://...",        // string, API endpoint
        "model": "deepseek/...",         // string, model identifier
        "apiKey": ""                     // string, user-provided
      }
    ]
  },
  "prompts": {
    "selectedDividePromptId": "coding-default",  // string, references a divide prompt
    "dividePrompts": [                            // array of prompt objects
      {
        "id": "coding-default",                   // string, unique prompt identifier
        "name": "Coding — Default",               // string, display name
        "content": "You are a senior..."          // string, system prompt text
      }
    ]
  }
}
```

### Merge Strategy

On load, saved settings are merged with defaults:
- Default providers are updated in-place (matching by `id`)
- Custom providers (not in defaults) are preserved
- Same merge logic applies to divide prompts

---

## Persistence Format

### Tree Data (localStorage key: `mushajjir-tree-v2`)

```jsonc
{
  "schemaVersion": 2,
  "savedAt": "2025-01-01T00:00:00.000Z",
  "tree": {
    "nodes": [ /* array of normalized nodes */ ],
    "edges": [ /* array of normalized edges */ ]
  }
}
```

### Legacy Key

Previous version used key `mushajjir-tree-v1`. On load, if `v2` is not found, `v1` is attempted. The legacy format lacked `schemaVersion` — in that case, the entire stored value is treated as the `tree` object.

---

## Validation Rules

- **Node title**: Falls back to `'Untitled task'` if empty/falsy
- **Node width**: Clamped to `280–560`
- **Node height**: Clamped to `230–760` when set, `null` when unset
- **Child count**: Clamped to `1–12`
- **Tags**: Cleaned (trimmed, lowercased, spaces→dashes, max 28 chars), filtered to remove empty strings
- **Edges**: Orphaned edges (source or target not in nodes) are dropped by `normalizeTree()`
- **Position**: Coordinates are rounded to integers by `updateNodePosition()`
- **Root node**: Cannot be deleted (`deleteNode('root')` is a no-op)

---

## Schema Versioning

See [ADR 004: Schema Versioning](adr/004-schema-versioning.md) for the versioning strategy.

Current schema version: **2**

Changes from v1:
- `status` field split into `taskStatus` + `systemMessage`
- `notesOpen` field added for expandable notes
- `collapsed` field added for collapsing subtrees
- Storage key renamed from `mushajjir-tree-v1` to `mushajjir-tree-v2`
- Wrap format changed from flat object to `{ schemaVersion, savedAt, tree }`
