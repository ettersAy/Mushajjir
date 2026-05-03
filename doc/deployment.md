# Deployment

Mushajjir is deployed as a static site on **GitHub Pages**.

## Deploy URL

```
https://ettersAy.github.io/Mushajjir/
```

## How Deployment Works

Deployment is handled by the GitHub Actions workflow at `.github/workflows/deploy-github-pages.yml`.

### Trigger

- **Automatic**: On every push to the `main` branch
- **Manual**: Via the [Actions tab](https://github.com/ettersAy/Mushajjir/actions) → "Deploy to GitHub Pages" → "Run workflow"

### Pipeline

1. Checkout repository
2. Setup Node.js (v20 in CI)
3. Install dependencies (`npm install`)
4. Build production bundle (`npm run build`)
5. Upload `dist/` as GitHub Pages artifact
6. Deploy artifact to `gh-pages` environment

### Permissions

The workflow requires these GitHub Pages permissions (configured in the workflow YAML):

- `contents: read`
- `pages: write`
- `id-token: write`

## Manual Deployment

If you need to deploy manually:

```bash
# Build the project
npm run build

# The output is in dist/
# Deploy using your preferred static hosting (Netlify, Vercel, etc.)
```

## Preview Locally

```bash
npm run build
npm run preview
```

Opens a production preview on `http://localhost:4173` (Vite preview default).

## Environment

Mushajjir is a fully client-side SPA — no backend, no environment variables needed for deployment. The only runtime dependency is a modern browser with localStorage support.

## Post-Deploy Verification

After deployment, verify:

1. The app loads at the deploy URL
2. localStorage persistence works (refresh the page, data should persist)
3. No console errors on load
4. AI features work if API keys are configured in Settings
