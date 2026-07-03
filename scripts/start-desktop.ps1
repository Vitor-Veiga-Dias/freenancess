$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$EnvFile = Join-Path $Root ".env.desktop"
if (Test-Path $EnvFile) {
  Get-Content $EnvFile | ForEach-Object {
    if ($_ -match "^\s*#" -or $_ -match "^\s*$") { return }
    $pair = $_ -split "=", 2
    if ($pair.Length -eq 2) {
      Set-Item -Path "Env:$($pair[0].Trim())" -Value $pair[1].Trim()
    }
  }
}

if (-not (Test-Path (Join-Path $Root "desktop\runtime\app\server.js"))) {
  Write-Host "Building desktop production bundle..."
  npm run desktop:bundle
}

Write-Host "Starting Freenances desktop (production)..."
node scripts/run-desktop-production.mjs
