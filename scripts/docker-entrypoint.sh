#!/bin/sh

if [ -n "$DATABASE_URL" ]; then
  echo "Applying database schema..."
  prisma db push --skip-generate --accept-data-loss || echo "WARN: db push failed"
else
  echo "WARN: DATABASE_URL not set"
fi

echo "Starting server on port ${PORT:-3000}..."
exec node server.js
