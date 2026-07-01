#!/bin/sh

echo "PORT=${PORT:-3000}"
echo "HOSTNAME=${HOSTNAME:-0.0.0.0}"

if [ -n "$DATABASE_URL" ]; then
  echo "Applying database schema..."
  if node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss; then
    echo "Database schema applied."
  else
    echo "WARN: prisma db push failed — starting app anyway."
  fi
else
  echo "WARN: DATABASE_URL not set — skipping db push."
fi

echo "Starting server..."
exec node server.js
