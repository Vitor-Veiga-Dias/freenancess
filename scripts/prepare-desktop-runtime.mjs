import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadProjectEnv } from "./load-env.mjs";
import {
  replaceDirectory,
  rmSyncWithRetry,
  stopDesktopProcesses,
} from "./stop-desktop-processes.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtimeRoot = join(rootDir, "desktop", "runtime");
const runtimeDir = join(runtimeRoot, "app");
const buildDir = join(rootDir, ".desktop-build");
const standaloneDir = join(rootDir, ".next", "standalone");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function ensurePrismaClient(buildRoot) {
  const engineName = "query_engine-windows.dll.node";
  const buildEngine = join(
    buildRoot,
    "node_modules",
    ".prisma",
    "client",
    engineName,
  );

  if (existsSync(buildEngine)) {
    return;
  }

  mkdirSync(join(buildRoot, "node_modules", ".prisma"), { recursive: true });
  mkdirSync(join(buildRoot, "node_modules", "@prisma"), { recursive: true });

  cpSync(
    join(rootDir, "node_modules", ".prisma", "client"),
    join(buildRoot, "node_modules", ".prisma", "client"),
    { recursive: true, force: true },
  );
  cpSync(
    join(rootDir, "node_modules", "@prisma", "client"),
    join(buildRoot, "node_modules", "@prisma", "client"),
    { recursive: true, force: true },
  );
}

function copyRuntimeAssets() {
  console.log("Stopping desktop processes before copying runtime...");
  stopDesktopProcesses();
  spawnSync("powershell", ["-NoProfile", "-Command", "Start-Sleep -Seconds 2"], {
    stdio: "ignore",
  });

  rmSyncWithRetry(rmSync, buildDir);
  mkdirSync(buildDir, { recursive: true });

  cpSync(standaloneDir, buildDir, { recursive: true, force: true });
  cpSync(join(rootDir, ".next", "static"), join(buildDir, ".next", "static"), {
    recursive: true,
    force: true,
  });
  cpSync(join(rootDir, "public"), join(buildDir, "public"), {
    recursive: true,
    force: true,
  });
  cpSync(join(rootDir, "prisma"), join(buildDir, "prisma"), {
    recursive: true,
    force: true,
  });

  ensurePrismaClient(buildDir);

  console.log("Swapping desktop runtime folder...");
  replaceDirectory(rmSync, cpSync, buildDir, runtimeDir);

  const envSource = join(rootDir, ".env");
  if (existsSync(envSource)) {
    cpSync(envSource, join(runtimeRoot, ".env"), { force: true });
    writeFileSync(
      join(runtimeRoot, ".env"),
      [
        readFileSync(join(runtimeRoot, ".env"), "utf8")
          .split(/\r?\n/)
          .filter(
            (line) =>
              line.trim() &&
              !line.trim().startsWith("#") &&
              !line.startsWith("SOURCE_") &&
              !line.startsWith("TARGET_") &&
              !line.startsWith("AIVEN_"),
          )
          .join("\n"),
        'BETTER_AUTH_URL="http://127.0.0.1:3847"',
        'NEXT_PUBLIC_APP_URL="http://127.0.0.1:3847"',
        "",
      ].join("\n"),
      "utf8",
    );
  }

  writeFileSync(
    join(runtimeRoot, "README.txt"),
    [
      "Freenances desktop runtime",
      "",
      "Edit .env in this folder to change database/auth settings.",
      "The app starts server.js on http://127.0.0.1:3847",
      "",
    ].join("\n"),
    "utf8",
  );
}

loadProjectEnv();

process.env.FREENANCES_RUNTIME = "desktop";
process.env.NODE_ENV = "production";
process.env.NEXT_PUBLIC_APP_URL = "http://127.0.0.1:3847";
process.env.BETTER_AUTH_URL = "http://127.0.0.1:3847";

console.log("Generating Prisma client...");
run("npx", ["prisma", "generate"]);

console.log("Building Next.js production bundle for desktop...");
run("npx", ["next", "build"]);

if (!existsSync(join(standaloneDir, "server.js"))) {
  console.error("Missing .next/standalone/server.js. Build failed.");
  process.exit(1);
}

console.log("Copying standalone runtime into desktop/runtime/app...");
copyRuntimeAssets();

console.log("Desktop runtime prepared.");
