import { spawnSync } from "node:child_process";

export function stopDesktopProcesses() {
  if (process.platform !== "win32") {
    spawnSync("sh", ["-c", "lsof -ti:3847 | xargs kill -9 2>/dev/null || true"], {
      stdio: "ignore",
    });
    return;
  }

  const script = [
    "$ErrorActionPreference = 'SilentlyContinue'",
    "Get-NetTCPConnection -LocalPort 3847 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }",
    "$patterns = @('desktop\\\\runtime', 'dist\\\\Freenances', 'launch-portable.mjs', 'run-desktop-production.mjs', 'server.js')",
    "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object {",
    "  $cmd = $_.CommandLine",
    "  if ($null -eq $cmd) { return }",
    "  foreach ($pattern in $patterns) {",
    "    if ($cmd -like \"*$pattern*\") { Stop-Process -Id $_.ProcessId -Force; break }",
    "  }",
    "}",
    "Start-Sleep -Seconds 2",
  ].join("; ");

  spawnSync("powershell", ["-NoProfile", "-Command", script], { stdio: "ignore" });
}

export function rmSyncWithRetry(rmSync, targetPath, attempts = 8) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      rmSync(targetPath, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 500,
      });
      return;
    } catch (error) {
      lastError = error;
      stopDesktopProcesses();
      spawnSync(
        "powershell",
        ["-NoProfile", "-Command", "Start-Sleep -Seconds 2"],
        { stdio: "ignore" },
      );
    }
  }

  throw lastError;
}

export function replaceDirectory(rmSync, cpSync, sourceDir, targetDir) {
  stopDesktopProcesses();
  spawnSync(
    "powershell",
    ["-NoProfile", "-Command", "Start-Sleep -Seconds 2"],
    { stdio: "ignore" },
  );

  rmSyncWithRetry(rmSync, targetDir);
  cpSync(sourceDir, targetDir, { recursive: true, force: true });
  rmSyncWithRetry(rmSync, sourceDir);
}
