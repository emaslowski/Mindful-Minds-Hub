#!/bin/bash
set -euo pipefail

# Post-merge setup runs against development only. Production schema changes
# are handled by Replit's Publish flow, never by server startup.
if [[ "${NODE_ENV:-development}" == "production" ]]; then
  echo "Post-merge setup must not run in production." >&2
  exit 1
fi

CI=true pnpm install --frozen-lockfile --prefer-offline

# Whole-schema pushes can prompt about unrelated legacy table renames.
# Apply reviewed, repeatable development migrations without dropping data.
shopt -s nullglob
for migration in lib/db/post-merge/*.sql; do
  echo "Applying development migration: $migration"
  PGCONNECT_TIMEOUT=10 psql "${DATABASE_URL:?Development DATABASE_URL is required}" \
    --no-psqlrc --set=ON_ERROR_STOP=1 --single-transaction --file="$migration"
done
