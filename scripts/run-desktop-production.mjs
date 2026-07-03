import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadProjectEnv } from "./load-env.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtimeRoot = join(rootDir, "desktop", "runtime");
const appDir = join(runtimeRoot, "app");
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

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
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

    await sleep(500);
  }

  throw new Error(`Desktop server did not become healthy at ${appUrl}`);
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
  loadProjectEnv();
  loadEnvFile(join(runtimeRoot, ".env"));

  if (!existsSync(join(appDir, "server.js"))) {
    console.error("Runtime missing. Run: npm run desktop:bundle");
    process.exit(1);
  }

  process.env.FREENANCES_RUNTIME = "desktop";
  process.env.NODE_ENV = "production";
  process.env.PORT = String(port);
  process.env.HOSTNAME = "127.0.0.1";
  process.env.NEXT_PUBLIC_APP_URL = appUrl;
  process.env.BETTER_AUTH_URL = appUrl;

  console.log(`Starting Freenances desktop at ${appUrl} ...`);

  const server = spawn(process.execPath, ["server.js"], {
    cwd: appDir,
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
