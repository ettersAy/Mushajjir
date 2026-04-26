# 🌳 Mushajjir

first visual task decomposition tool.

## Included MVP features

- Vue 3 + Vite
- Vue Flow infinite canvas
- Sticky note nodes
- Editable title/content
- Create 1–5 child notes from any note
- Black parent → child lines
- Drag notes
- Delete node and its descendants
- Autosave in browser localStorage
- Export/import JSON

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

## Code Quality

This project uses ESLint (with the Vue 3 plugin) and Prettier to catch errors early and enforce consistent formatting.

```bash
# Lint source files
npm run lint

# Auto-fix lint issues
npm run lint -- --fix

# Format source files with Prettier
npm run format
```

## Next good features

- AI Divide button
- OpenRouter integration
- Prompt context inheritance from ancestors
- Collapse/expand branches
- SQLite or file JSON backend
- Project list/history
