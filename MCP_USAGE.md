# MCP Usage

This project uses workspace-local MCP configuration in `.vscode/mcp.json`.
The MCP server dependencies live under `.mcp/` and are launched over stdio only.

## Available MCP Servers

| Server | Purpose | Notes |
| --- | --- | --- |
| `filesystem` | Read, search, and edit files in this project | Restricted to this workspace folder only. It is not configured for home-directory access. |
| `git` | Inspect repository status, diffs, commits, logs, branches, and related Git data | Scoped to this repository path. |
| `sqlite` | Query and inspect a future local SQLite database | Uses `.mcp/data/mushajjir.sqlite`. |
| `playwright` | Browser automation for future UI testing and Vite app checks | Uses Chromium, isolated sessions, sandboxing, and `.mcp/playwright` output. |
| `browser` | Chrome DevTools browser inspection and debugging | Uses `chrome-devtools-mcp` with isolated browser data, no usage statistics, and no CrUX lookups. |
| `nodeNpm` | Inspect package metadata and run existing npm scripts | Project-local custom MCP. `run_npm_script` defaults to dry-run. |
| `httpApi` | Fetch HTTP/API content | Uses the reference fetch server. VS Code sandbox allows localhost, `127.0.0.1`, `::1`, and `registry.npmjs.org` by default. |

## Security Defaults

- All servers are local stdio servers.
- VS Code sandboxing is enabled for every configured server.
- Filesystem MCP receives only `${workspaceFolder}` as its allowed directory.
- Home directory reads are denied in the VS Code sandbox config.
- Write access is limited to the workspace or a narrower `.mcp/` subfolder where practical.
- No MCP server is configured with broad home-directory access.

## Test From The Terminal

Run every configured server:

```bash
node .mcp/verify-mcp.mjs
```

Run one server:

```bash
node .mcp/verify-mcp.mjs filesystem
node .mcp/verify-mcp.mjs git
node .mcp/verify-mcp.mjs sqlite
node .mcp/verify-mcp.mjs playwright
node .mcp/verify-mcp.mjs browser
node .mcp/verify-mcp.mjs nodeNpm
node .mcp/verify-mcp.mjs httpApi
```

Expected output looks like `ok <server>: <n> tools`.

## Test From VS Code

1. Open this folder in VS Code.
2. Run `MCP: List Servers` from the Command Palette.
3. Start each server if it is not already running.
4. Use `MCP: Browse Resources` for resource-capable servers such as `sqlite`.
5. Ask Copilot/Codex to use a named MCP server.

## Restart Servers

- In VS Code, run `MCP: List Servers`, choose a server, then choose restart.
- Saving `.vscode/mcp.json` also causes VS Code/Copilot to reload MCP configuration.
- If tools look stale, run `MCP: Reset Cached Tools`.
- From the terminal, stop the verifier with `Ctrl+C`; VS Code manages MCP server lifecycle itself.

## Example Prompts

- `Use the filesystem MCP to list the top-level files in this project.`
- `Use the git MCP to summarize my current uncommitted changes without modifying files.`
- `Use the sqlite MCP to show tables in the local Mushajjir database.`
- `Use the nodeNpm MCP to list available npm scripts.`
- `Use the nodeNpm MCP to dry-run the build script.`
- `Use the Playwright MCP to open the Vite dev server and check the canvas view.`
- `Use the browser MCP to inspect console errors on localhost.`
- `Use the httpApi MCP to fetch http://localhost:5173 after the dev server is running.`

## Config Locations

- VS Code MCP config: `.vscode/mcp.json`
- Project MCP package metadata: `.mcp/package.json`
- Project MCP verifier: `.mcp/verify-mcp.mjs`
- Project custom Node/NPM MCP server: `.mcp/servers/node-npm-mcp.mjs`
- Python MCP virtualenv: `.mcp/venv`
- Local MCP npm packages: `.mcp/node_modules`
- Future SQLite database path: `.mcp/data/mushajjir.sqlite`
