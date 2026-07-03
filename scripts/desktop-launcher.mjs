import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appPort = 3847;
const appUrl = `http://127.0.0.1:${appPort}`;

function getBundleDir() {
  if (typeof process.pkg !== "undefined") {
    return dirname(process.execPath);
  }

  return resolve(dirname(fileURLToPath(import.meta.url)), "..");
}

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
    const value = line.slice(separatorIndex + 1).trim();
    process.env[key] ??= value;
  }
}

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
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

  throw new Error("Desktop server did not become ready in time.");
}

function openAppWindow() {
  if (process.platform !== "win32") {
    spawn("xdg-open", [appUrl], { detached: true, stdio: "ignore" }).unref();
    return;
  }

  const edgePaths = [
    join(process.env["ProgramFiles(x86)"] ?? "", "Microsoft", "Edge", "Application", "msedge.exe"),
    join(process.env.ProgramFiles ?? "", "Microsoft", "Edge", "Application", "msedge.exe"),
  ].filter(existsSync);

  if (edgePaths.length > 0) {
    spawn(edgePaths[0], [`--app=${appUrl}`], {
      detached: true,
      stdio: "ignore",
    }).unref();
    return;
  }

  spawn("cmd", ["/c", "start", "", appUrl], {
    detached: true,
    stdio: "ignore",
  }).unref();
}

async function main() {
  const bundleDir = getBundleDir();
  const runtimeDir = join(bundleDir, "runtime");
  const serverEntry = join(runtimeDir, "server.js");

  loadEnvFile(join(bundleDir, ".env"));

  process.env.FREENANCES_RUNTIME ??= "desktop";
  process.env.NEXT_PUBLIC_APP_URL ??= appUrl;
  process.env.BETTER_AUTH_URL ??= appUrl;
  process.env.PORT ??= String(appPort);
  process.env.HOSTNAME ??= "127.0.0.1";
  process.env.NODE_ENV ??= "production";

  if (!existsSync(serverEntry)) {
    throw new Error(`Missing runtime server at ${serverEntry}`);
  }

  console.log("Starting Freenances desktop server...");
  const server = spawn(process.execPath, [serverEntry], {
    cwd: runtimeDir,
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

  await waitForServer();
  console.log(`Opening ${appUrl}`);
  openAppWindow();

  await new Promise(() => {
    // Keep process alive while the server runs.
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
