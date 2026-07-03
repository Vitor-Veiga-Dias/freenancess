import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));
const runtimeRoot = join(appRoot, "runtime");
const runtimeApp = join(runtimeRoot, "app");
const nodeExecutable = join(appRoot, "node", "node.exe");
const port = 3847;
const appUrl = `http://127.0.0.1:${port}`;

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[line.slice(0, separatorIndex).trim()] ??= value;
  }
}

async function waitForHealth(timeoutMs = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${appUrl}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Server still booting.
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
  }

  throw new Error(`Desktop server did not start at ${appUrl}`);
}

function openAppWindow() {
  const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

  if (existsSync(edge)) {
    spawn(edge, [`--app=${appUrl}`], {
      detached: true,
      stdio: "ignore",
    }).unref();
    return;
  }

  spawn("cmd", ["/c", "start", "", appUrl], {
    detached: true,
    stdio: "ignore",
    shell: true,
  }).unref();
}

async function main() {
  if (!existsSync(join(runtimeApp, "server.js"))) {
    console.error("Runtime missing. Rebuild with: npm run desktop:package");
    process.exit(1);
  }

  if (!existsSync(nodeExecutable)) {
    console.error("Bundled Node.js missing in node/node.exe");
    process.exit(1);
  }

  loadEnvFile(join(runtimeRoot, ".env"));

  process.env.FREENANCES_RUNTIME = "desktop";
  process.env.NODE_ENV = "production";
  process.env.PORT = String(port);
  process.env.HOSTNAME = "127.0.0.1";
  process.env.NEXT_PUBLIC_APP_URL = appUrl;
  process.env.BETTER_AUTH_URL = appUrl;

  console.log(`Starting Freenances desktop at ${appUrl} ...`);

  const server = spawn(nodeExecutable, ["server.js"], {
    cwd: runtimeApp,
    env: process.env,
    stdio: "inherit",
  });

  const shutdown = () => {
    if (!server.killed) {
      server.kill();
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("exit", shutdown);

  server.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  await waitForHealth();
  console.log("Desktop server ready.");
  openAppWindow();
  console.log("Press Ctrl+C to stop the desktop server.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
