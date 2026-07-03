import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadProjectEnv } from "./load-env.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

loadProjectEnv();

process.env.FREENANCES_RUNTIME ??= "desktop";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3847";
process.env.BETTER_AUTH_URL ??= "http://localhost:3847";

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/with-desktop-env.mjs <command> [...args]");
  process.exit(1);
}

const result = spawnSync(command, args, {
  cwd: rootDir,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
