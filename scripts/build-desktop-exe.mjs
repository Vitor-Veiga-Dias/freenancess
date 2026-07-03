import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { stopDesktopProcesses } from "./stop-desktop-processes.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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

stopDesktopProcesses();
spawnSync("powershell", ["-NoProfile", "-Command", "Start-Sleep -Seconds 1"], {
  stdio: "ignore",
});

console.log("Preparing desktop runtime...");
run("npm", ["run", "desktop:bundle"]);

console.log("Building Windows executable...");
run("npm", ["run", "build", "--prefix", "desktop"]);

console.log("Desktop executable build finished.");
