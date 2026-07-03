import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  replaceDirectory,
  rmSyncWithRetry,
  stopDesktopProcesses,
} from "./stop-desktop-processes.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(rootDir, "dist", "Freenances");
const distStagingDir = join(rootDir, "dist", "Freenances-next");
const launchSource = join(rootDir, "scripts", "launch-portable.mjs");

function resolveBundledNode() {
  const candidates = [
    process.execPath,
    "C:\\Program Files\\nodejs\\node.exe",
    "C:\\Program Files (x86)\\nodejs\\node.exe",
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("Node.js executable not found for desktop packaging.");
}

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

console.log("Building production runtime...");
stopDesktopProcesses();
run("npm", ["run", "icons:generate"]);
run("npm", ["run", "desktop:bundle"]);

console.log("Packaging portable desktop folder...");
stopDesktopProcesses();
rmSyncWithRetry(rmSync, distStagingDir);
mkdirSync(distStagingDir, { recursive: true });

cpSync(join(rootDir, "desktop", "runtime"), join(distStagingDir, "runtime"), {
  recursive: true,
});

mkdirSync(join(distStagingDir, "node"), { recursive: true });
cpSync(resolveBundledNode(), join(distStagingDir, "node", "node.exe"));
cpSync(launchSource, join(distStagingDir, "launch.mjs"));
cpSync(
  join(rootDir, "public", "icons", "icon-192.png"),
  join(distStagingDir, "Freenances.png"),
);

writeFileSync(
  join(distStagingDir, "Start Freenances.cmd"),
  [
    "@echo off",
    "setlocal",
    'cd /d "%~dp0"',
    '"node\\node.exe" "launch.mjs"',
    "",
  ].join("\r\n"),
  "utf8",
);

writeFileSync(
  join(distStagingDir, "README.txt"),
  [
    "Freenances Desktop (portable)",
    "",
    "Double-click: Start Freenances.cmd",
    "",
    "Database settings: runtime/.env",
    "App URL: http://127.0.0.1:3847",
    "",
    "Note: CrowdStrike and other EDR tools may block self-packed .exe files.",
    "This package uses plain Node.js + scripts instead of a packed executable.",
    "",
  ].join("\r\n"),
  "utf8",
);

replaceDirectory(rmSync, cpSync, distStagingDir, distDir);

console.log(`Portable desktop ready at ${distDir}`);
console.log("Launch with: dist\\Freenances\\Start Freenances.cmd");
