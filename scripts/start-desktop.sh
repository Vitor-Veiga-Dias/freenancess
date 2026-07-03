#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.desktop ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.desktop
  set +a
fi

export FREENANCES_RUNTIME="${FREENANCES_RUNTIME:-desktop}"
export DESKTOP_DATABASE_URL="${DESKTOP_DATABASE_URL:-file:./data/desktop/freenances.db}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3847}"
export BETTER_AUTH_URL="${BETTER_AUTH_URL:-http://localhost:3847}"

mkdir -p data/desktop

npm run desktop:push
npm run desktop:serve
