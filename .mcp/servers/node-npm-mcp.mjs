import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(process.env.MUSHAJJIR_PROJECT_ROOT ?? path.join(serverDir, "..", ".."));
const packagePath = path.join(projectRoot, "package.json");

async function readPackageJson() {
  return JSON.parse(await readFile(packagePath, "utf8"));
}

function run(command, args, timeoutMs = 120000) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: {
        ...process.env,
        npm_config_update_notifier: "false",
        npm_config_fund: "false"
      },
      shell: false
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, stdout: stdout.slice(-20000), stderr: stderr.slice(-20000) });
    });
  });
}

const mcp = new McpServer({
  name: "mushajjir-node-npm",
  version: "0.1.0"
});

mcp.registerTool(
  "get_package_info",
  {
    title: "Get package metadata",
    description: "Read this project's package.json metadata, scripts, dependencies, and devDependencies.",
    inputSchema: {}
  },
  async () => {
    const pkg = await readPackageJson();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              name: pkg.name,
              version: pkg.version,
              private: pkg.private,
              type: pkg.type,
              scripts: pkg.scripts ?? {},
              dependencies: pkg.dependencies ?? {},
              devDependencies: pkg.devDependencies ?? {}
            },
            null,
            2
          )
        }
      ]
    };
  }
);

mcp.registerTool(
  "list_npm_scripts",
  {
    title: "List npm scripts",
    description: "List npm scripts available in this project.",
    inputSchema: {}
  },
  async () => {
    const pkg = await readPackageJson();
    return {
      content: [{ type: "text", text: JSON.stringify(pkg.scripts ?? {}, null, 2) }]
    };
  }
);

mcp.registerTool(
  "run_npm_script",
  {
    title: "Run npm script",
    description: "Run an existing npm script from this project using npm run. Defaults to dryRun.",
    inputSchema: {
      script: z.string().min(1),
      args: z.array(z.string()).default([]),
      dryRun: z.boolean().default(true),
      timeoutMs: z.number().int().min(1000).max(300000).default(120000)
    }
  },
  async ({ script, args, dryRun, timeoutMs }) => {
    const pkg = await readPackageJson();
    if (!pkg.scripts || !Object.hasOwn(pkg.scripts, script)) {
      throw new Error(`Unknown npm script: ${script}`);
    }

    const unsafeArg = args.find((arg) => !/^[\w@./:=,+-]+$/.test(arg));
    if (unsafeArg) {
      throw new Error(`Refusing unsafe argument: ${unsafeArg}`);
    }

    const command = ["npm", "run", script, ...(args.length ? ["--", ...args] : [])];
    if (dryRun) {
      return {
        content: [{ type: "text", text: JSON.stringify({ cwd: projectRoot, command }, null, 2) }]
      };
    }

    const result = await run(command[0], command.slice(1), timeoutMs);
    return {
      content: [{ type: "text", text: JSON.stringify({ cwd: projectRoot, command, ...result }, null, 2) }]
    };
  }
);

await mcp.connect(new StdioServerTransport());
