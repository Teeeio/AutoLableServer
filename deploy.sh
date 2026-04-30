#!/usr/bin/env bash

set -euo pipefail

APP_NAME="auto-label-server"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"
PID_FILE="$ROOT_DIR/server.pid"

cd "$ROOT_DIR"

echo "==> Deploying $APP_NAME"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is required."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is required."
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node.js 18+ is required."
  exit 1
fi

mkdir -p "$LOG_DIR"
mkdir -p "$ROOT_DIR/data"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

set -a
. ./.env
set +a

if [ -f package-lock.json ]; then
  npm ci --omit=dev
else
  npm install --omit=dev
fi

PORT="${PORT:-8787}"

if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    pm2 restart "$APP_NAME" --update-env
  else
    pm2 start index.js --name "$APP_NAME" --update-env
  fi
  pm2 save >/dev/null 2>&1 || true
else
  if [ -f "$PID_FILE" ]; then
    EXISTING_PID="$(cat "$PID_FILE" || true)"
    if [ -n "${EXISTING_PID:-}" ] && kill -0 "$EXISTING_PID" >/dev/null 2>&1; then
      kill "$EXISTING_PID" >/dev/null 2>&1 || true
      sleep 1
    fi
  fi

  nohup node index.js >"$LOG_DIR/server.out.log" 2>"$LOG_DIR/server.err.log" &
  echo $! > "$PID_FILE"
fi

for attempt in $(seq 1 15); do
  if node -e "require('http').get('http://127.0.0.1:${PORT}/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"; then
    echo "Deployment succeeded: http://127.0.0.1:${PORT}/api/health"
    exit 0
  fi
  sleep 1
done

echo "ERROR: Health check failed after deploy."
exit 1
