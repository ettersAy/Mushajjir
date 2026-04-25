import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(root, ".vscode", "mcp.json");
const config = JSON.parse(await readFile(configPath, "utf8"));
const only = new Set(process.argv.slice(2));

function expand(value) {
  return value
    .replaceAll("${workspaceFolder}", root)
    .replaceAll("${userHome}", process.env.HOME ?? "");
}

function expandDeep(value) {
  if (typeof value === "string") return expand(value);
  if (Array.isArray(value)) return value.map(expandDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, expandDeep(child)]));
  }
  return value;
}

async function tryRequest(client, method) {
  try {
    if (method === "tools/list") {
      const result = await client.listTools();
      return `${result.tools?.length ?? 0} tools`;
    }
    if (method === "resources/list") {
      const result = await client.listResources();
      return `${result.resources?.length ?? 0} resources`;
    }
  } catch (error) {
    return `not available (${error.message})`;
  }
}

for (const [name, rawServer] of Object.entries(config.servers)) {
  if (only.size && !only.has(name)) continue;

  const server = expandDeep(rawServer);
  const transport = new StdioClientTransport({
    command: server.command,
    args: server.args ?? [],
    env: { ...process.env, ...(server.env ?? {}) },
    cwd: root
  });
  const client = new Client({ name: "mushajjir-mcp-verifier", version: "0.1.0" });

  try {
    await client.connect(transport);
    const tools = await tryRequest(client, "tools/list");
    const resources = await tryRequest(client, "resources/list");
    console.log(`ok ${name}: ${tools}; ${resources}`);
  } catch (error) {
    console.error(`fail ${name}: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => {});
  }
}
