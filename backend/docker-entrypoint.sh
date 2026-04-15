#!/bin/sh
set -e
# Root .env often sets DATABASE_URL for localhost + user "postgres", which breaks Prisma inside Docker.
# Build the URL from POSTGRES_* so it matches the postgres service and supports special chars in the password.
unset DATABASE_URL 2>/dev/null || true
if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_DB" ]; then
  echo "docker-entrypoint: POSTGRES_USER and POSTGRES_DB must be set (e.g. via env_file)."
  exit 1
fi
ENC_PW=$(node -e "console.log(encodeURIComponent(process.env.POSTGRES_PASSWORD || ''))")
export DATABASE_URL="postgresql://${POSTGRES_USER}:${ENC_PW}@postgres:5432/${POSTGRES_DB}"
echo "docker-entrypoint: DATABASE_URL host=postgres user=${POSTGRES_USER} db=${POSTGRES_DB}"

npx prisma migrate deploy
exec node dist/main.js
