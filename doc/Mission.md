You are working on `🌳 Mushajjir`, a local-first visual task decomposition application.

Stack:

* Vite
* Vue 3
* Vue Flow
* Pinia

Goal:
Transform the current prototype into a modern, minimalist, production-quality visual task decomposition tool optimized for recursive AI-assisted software planning.

IMPORTANT:
Do NOT overengineer.
Keep the UI minimal, fast, clean, and highly usable.
Focus on UX quality and scalability of the node system.

---

# CORE CONCEPT

The app is a recursive decomposition tree.

Each node represents a task/specification.

A node can generate child nodes recursively.

Example:

```txt
Implement User Management
├── Backend API
│   ├── Controllers
│   ├── Services
│   └── Models
├── Frontend Vue UI
├── PHPUnit Tests
└── Playwright Tests
```

---

# DESIGN DIRECTION

Create a modern minimalist interface.

Requirements:

* clean spacing
* smooth animations
* rounded cards
* subtle shadows
* clean typography
* infinite canvas
* dark mode + light mode
* uncluttered UI
* avoid heavy borders
* avoid skeuomorphic sticky note look

Use:

* soft neutral background
* elegant node cards
* minimalist toolbar
* contextual actions

---

# IMPLEMENT ALL THESE IMPROVEMENTS

## 1. NODE SYSTEM IMPROVEMENTS

Implement fully editable nodes.

Each node must support:

* editable title
* editable content/body
* drag and drop
* resize if needed
* delete node
* duplicate node
* quick add child action
* collapse/expand children

Collapsed nodes must display:

* hidden descendants count

---

## 2. TREE UX IMPROVEMENTS

Improve tree readability.

Implement:

* auto-layout for children
* balanced spacing
* smooth edge rendering
* clean connection lines

Children should auto-position intelligently.

Avoid overlapping nodes.

---

## 3. COLLAPSIBLE BRANCHES

Implement branch folding.

Requirements:

* collapse entire subtree
* expand subtree
* animated transitions
* maintain node positions

---

## 4. TAG SYSTEM

Implement visual tags.

Requirements:

* multiple tags per node
* colored tags
* quick tag editor
* tag filtering

Example tags:

* backend
* frontend
* test
* urgent
* ai-generated

---

## 5. SEARCH SYSTEM

Implement global search.

Requirements:

* search title/content
* instant filtering
* highlight matching nodes
* auto-focus matching node

---

## 6. FOCUS MODE

Implement focus mode.

Behavior:

* selected branch stays fully visible
* everything else becomes dimmed

Used to reduce visual clutter.

---

## 7. RELATION CONNECTIONS

Support connections outside hierarchy.

Requirements:

* create manual relation between any nodes
* distinguish hierarchy edges vs relation edges
* optional labels on relation edges

---

## 8. NODE NOTES

Implement hidden expandable notes section.

Requirements:

* markdown support
* collapsible
* hidden by default

Used for:

* implementation notes
* references
* technical constraints

---

## 9. TASK STATUS SYSTEM

Implement task workflow states.

States:

* todo
* in progress
* blocked
* done

Requirements:

* visual status indicator
* progress display on parent node
* auto progress based on children completion

---

## 10. PERSISTENCE

Implement reliable local persistence.

Requirements:

* autosave
* debounce writes
* load previous session automatically

Storage:

* start with JSON persistence

Structure code so SQLite can later replace it easily.

---

## 11. IMPORT / EXPORT

Implement:

* export JSON
* import JSON
* export markdown outline

---

## 12. OUTLINE VIEW

Add alternate outline/tree list view.

Requirements:

* synchronized with graph
* collapsible
* click focuses graph node

---

## 13. KEYBOARD SHORTCUTS

Implement shortcuts.

Examples:

* add child
* delete node
* collapse node
* search
* focus mode

---

## 14. PERFORMANCE

Optimize for large trees.

Requirements:

* avoid unnecessary rerenders
* support hundreds of nodes smoothly

---

## 15. ARCHITECTURE QUALITY

Refactor architecture if needed.

Requirements:

* composable architecture
* reusable components
* clean state management
* avoid fat components

Suggested structure:

```txt
src/
├── components/
├── composables/
├── stores/
├── services/
├── layouts/
├── utils/
```

---

# IMPORTANT UI REQUIREMENTS

* minimalistic
* modern
* highly readable
* smooth interactions
* no clutter
* no giant toolbars
* avoid modal spam
* prefer inline editing

---

# FUTURE PREPARATION

Prepare architecture for future AI integration.

Future features:

* OpenRouter integration
* recursive AI decomposition
* prompt templates
* AI-generated branches

Create architecture now so this can be added cleanly later.

---

# FINAL TASK

After implementation:

1. review the entire architecture
2. identify weak points
3. identify UX issues
4. identify scalability problems
5. identify technical debt
6. identify possible future optimizations
7. identify missing developer tooling

Then provide:

* improvement recommendations
* refactor suggestions
* automation opportunities
* performance improvements

---

Important instructions:

* Ensure compatibility and proper operation with all installed MCP servers. if they are not runing run them first.
* If you determine that a task would be handled more effectively using an existing MCP server, you are authorized to install it yourself or ask me to install it for you.
* If, during this mission, you identify repetitive actions that could be automated with a Bash script for future tasks, let me know so I can plan and create one.
* Likewise, if you have ideas for useful Laravel commands, automation tools, or even a new MCP server that could improve future workflows, share them with me. I will create dedicated tasks to implement those ideas.
