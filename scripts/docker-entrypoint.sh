#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is required"
  exit 1
fi

echo "Applying database schema..."
prisma db push --skip-generate --accept-data-loss

echo "Starting server on port ${PORT:-3000}..."
exec node server.js
