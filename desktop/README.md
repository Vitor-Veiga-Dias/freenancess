# Freenances Desktop

Desktop shell for Freenances. It uses the **same PostgreSQL database** as the web app (`DATABASE_URL` in `.env`, e.g. Aiven).

## Architecture

```
Web + Desktop
     └── DATABASE_URL (Aiven PostgreSQL)
Desktop only adds:
     └── FREENANCES_RUNTIME=desktop
     └── http://127.0.0.1:3847
```

## Portable desktop (recommended on Windows)

Avoids packed `.exe` files that CrowdStrike and other EDR tools often quarantine.

```powershell
npm run desktop:package
```

Then double-click:

```
dist\Freenances\Start Freenances.cmd
```

The folder contains:

- `node/node.exe` — bundled Node runtime
- `runtime/` — production Next.js standalone app + `.env`
- `launch.mjs` — starts server and opens app window

## CrowdStrike / EDR

Packed executables built with tools like `pkg` are frequently flagged as suspicious (self-extracting Node, child process spawn). Prefer **`Start Freenances.cmd`** instead of a single `.exe`.

If IT can allowlist development paths:

- `C:\Users\<you>\freenances\dist\Freenances\`
- `C:\Users\<you>\freenances\desktop\runtime\`

For production distribution later: code-sign the installer (Tauri NSIS or MSI) and submit false-positive reports if needed.

## Development

```powershell
npm run desktop:prod
```

Opens production build on port 3847 from the project folder.

> Next.js allows only one `next dev` per project folder. Use `npm run desktop:dev` **or** `npm run dev`, not both.

## Native shell (Tauri, optional)

Requires Rust + Windows SDK (Visual Studio Build Tools). Produces a signed-installer-ready `.exe` after setup:

```bash
cd desktop
npm install
npm run build
```

## Scripts

| Script | Description |
|---|---|
| `npm run desktop:package` | Portable folder in `dist/Freenances/` |
| `npm run desktop:prod` | Production server + app window (dev folder) |
| `npm run desktop:dev` | Dev server on port 3847 |
| `npm run db:migrate-aiven` | Copy local data into Aiven Postgres |
