import { spawn, spawnSync } from "node:child_process";
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

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundleDir = join(rootDir, "dist", "desktop");
const runtimeDir = join(bundleDir, "runtime");

loadProjectEnv();

process.env.FREENANCES_RUNTIME = "desktop";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3847";
process.env.BETTER_AUTH_URL ??= "http://localhost:3847";
process.env.PORT = "3847";
process.env.HOSTNAME = "127.0.0.1";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function copyStandaloneBundle() {
  const standaloneDir = join(rootDir, ".next", "standalone");
  const staticDir = join(rootDir, ".next", "static");
  const publicDir = join(rootDir, "public");

  if (!existsSync(standaloneDir)) {
    throw new Error("Missing .next/standalone. Run desktop:build first.");
  }

  rmSync(bundleDir, { recursive: true, force: true });
  mkdirSync(runtimeDir, { recursive: true });

  cpSync(standaloneDir, runtimeDir, { recursive: true });
  cpSync(staticDir, join(runtimeDir, ".next", "static"), { recursive: true });
  cpSync(publicDir, join(runtimeDir, "public"), { recursive: true });

  const prismaClientDir = join(rootDir, "node_modules", ".prisma");
  const prismaPackageDir = join(rootDir, "node_modules", "@prisma");
  if (existsSync(prismaClientDir)) {
    cpSync(prismaClientDir, join(runtimeDir, "node_modules", ".prisma"), {
      recursive: true,
    });
  }
  if (existsSync(prismaPackageDir)) {
    cpSync(prismaPackageDir, join(runtimeDir, "node_modules", "@prisma"), {
      recursive: true,
    });
  }
}

function writeBundleEnv() {
  const envSource = join(rootDir, ".env");
  const envTarget = join(bundleDir, ".env");

  if (!existsSync(envSource)) {
    throw new Error("Missing .env in project root.");
  }

  const envContent = readFileSync(envSource, "utf8");
  const lines = envContent.split(/\r?\n/).filter(Boolean);
  const merged = new Map();

  for (const line of lines) {
    if (line.trim().startsWith("#")) {
      continue;
    }
    const index = line.indexOf("=");
    if (index === -1) {
      continue;
    }
    merged.set(line.slice(0, index).trim(), line.slice(index + 1).trim());
  }

  merged.set("FREENANCES_RUNTIME", "desktop");
  merged.set("NEXT_PUBLIC_APP_URL", "http://localhost:3847");
  merged.set("BETTER_AUTH_URL", "http://localhost:3847");
  merged.set("PORT", "3847");
  merged.set("HOSTNAME", "127.0.0.1");
  merged.set("NODE_ENV", "production");

  writeFileSync(
    envTarget,
    `${[...merged.entries()].map(([key, value]) => `${key}=${value}`).join("\n")}\n`,
    "utf8",
  );
}

function copyLauncherScript() {
  cpSync(
    join(rootDir, "scripts", "desktop-launcher.mjs"),
    join(bundleDir, "desktop-launcher.mjs"),
  );
}

function writeStartScripts() {
  writeFileSync(
    join(bundleDir, "Freenances.cmd"),
    `@echo off\r\ncd /d "%~dp0"\r\nnode desktop-launcher.mjs\r\n`,
    "utf8",
  );

  writeFileSync(
    join(bundleDir, "README.txt"),
    [
      "Freenances Desktop (production bundle)",
      "",
      "Requirements:",
      "- Node.js 22+ available on PATH",
      "",
      "Run:",
      "- Double-click Freenances.exe or Freenances.cmd",
      "- Or: node desktop-launcher.mjs",
      "",
      "Database/config:",
      "- Edit .env in this folder",
      "",
    ].join("\n"),
    "utf8",
  );
}

function buildExecutable() {
  const launcherPath = join(bundleDir, "desktop-launcher.mjs");
  run("npx", [
    "--yes",
    "@yao-pkg/pkg",
    launcherPath,
    "--targets",
    "node22-win-x64",
    "--output",
    join(bundleDir, "Freenances.exe"),
    "--compress",
    "GZip",
  ]);
}

console.log("Building Next.js production bundle...");
run("npm", ["run", "desktop:build"]);

console.log("Assembling desktop runtime...");
copyStandaloneBundle();
writeBundleEnv();
copyLauncherScript();
writeStartScripts();

console.log("Creating Freenances.exe launcher...");
buildExecutable();

console.log(`Desktop bundle ready at ${bundleDir}`);
