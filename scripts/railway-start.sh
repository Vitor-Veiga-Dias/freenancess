#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "Applying database schema..."
./node_modules/.bin/prisma db push --skip-generate --accept-data-loss

echo "Starting server..."
exec node server.js
