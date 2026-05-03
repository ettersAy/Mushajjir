# Contributing to Mushajjir

## Prerequisites

- **Node.js**: v22+ (project uses `.node-version` equivalent — check `engines` in `package.json`)
- **npm**: 10+
- **Git**: latest stable

## Setup

```bash
git clone git@github.com:ettersAy/Mushajjir.git
cd Mushajjir
npm install
```

## Dev Workflow

### Start dev server

```bash
npm run dev
```

Opens at `http://localhost:5173` (Vite default). The server is bound to `0.0.0.0` so it's accessible from other devices on the same network.

### Build for production

```bash
npm run build
npm run preview
```

### Code quality

```bash
# Lint (0 errors required before committing)
npm run lint

# Auto-fix lint issues
npm run lint -- --fix

# Format with Prettier
npm run format
```

> **Important:** Run both `npm run lint` and `npm run format` before every commit. The project uses ESLint v10 flat config and Prettier.

## Commit Workflow

1. **Fetch latest**: `git fetch origin && git log --oneline origin/main..HEAD` to check for divergence
2. **Rebase if behind**: `git stash` → `git pull --rebase origin main` → `git stash pop`
3. **Quality gates**: `npm run lint` + `npm run format` — both must pass
4. **Commit**: Use conventional commits (e.g., `feat:`, `fix:`, `docs:`, `refactor:`, `test:`)
5. **Push**: `git push origin <branch>` then open a PR against `main`

> **Note:** This repo uses git worktrees. Check `git remote -v` and `git log --oneline -3` before assuming state.

## Project Structure

```
Mushajjir/
├── src/
│   ├── App.vue                 # Root component
│   ├── main.js                 # App entry point
│   ├── style.css               # Global styles + CSS custom properties
│   ├── config/                 # Configuration constants
│   ├── components/             # Vue components
│   │   ├── StickyNode.vue      # Node card component
│   │   ├── Toolbar.vue         # Top toolbar
│   │   ├── OutlinePanel.vue    # Side outline panel
│   │   ├── SettingsPanel.vue   # Settings modal panel
│   │   └── TaskModal.vue       # Full-node edit modal
│   ├── composables/
│   │   └── useTreeLayout.js    # Tree layout algorithm
│   ├── stores/
│   │   ├── treeStore.js        # Tree data store (Pinia)
│   │   └── settingsStore.js    # Settings store (Pinia)
│   ├── services/
│   │   ├── storageService.js   # localStorage persistence
│   │   ├── aiService.js        # AI API calls
│   │   └── settingsService.js  # Settings persistence
│   └── utils/
│       ├── treeUtils.js        # Tree utility functions
│       └── markdown.js         # Markdown rendering
├── doc/
│   ├── adr/                    # Architecture Decision Records
│   ├── architecture-reference.md
│   └── performance-budget.md
└── index.html
```

## Architecture Overview

- **Framework**: Vue 3 (Composition API + `<script setup>`)
- **Build tool**: Vite
- **State management**: Pinia stores (`treeStore`, `settingsStore`)
- **Persistence**: localStorage (schema version 2)
- **No backend**: Fully client-side SPA
- **AI integration**: OpenAI-compatible APIs (OpenRouter, DeepSeek, Grok) via `fetch`

## Coding Conventions

- **ESM imports**: All local `.js` imports MUST include the `.js` extension (Node.js ESM requirement)
- **Naming**: PascalCase for components, camelCase for functions/variables, UPPER_SNAKE for constants
- **Semicolons**: None (Prettier enforces)
- **Quotes**: Single quotes (Prettier enforces)
- **Vue files**: Use `<script setup>` with Composition API
- **Scoped CSS**: Component styles use `<style scoped>`
- **Self-closing elements**: Use `<input />` style (no separate close tag)
- **v-html**: Must be preceded by `<!-- eslint-disable-next-line vue/no-v-html -->`

## Testing

Tests are not yet set up. When adding tests, use Vitest (Vite-native test runner) placed in a `src/__tests__/` directory mirroring the source structure.

## Pull Request Checklist

- [ ] Code compiles without errors
- [ ] `npm run lint` passes (0 errors)
- [ ] `npm run format` has been run
- [ ] No `.js` imports are missing the `.js` extension
- [ ] New features include corresponding docs updates if applicable
- [ ] Performance impact considered (see `doc/performance-budget.md`)
