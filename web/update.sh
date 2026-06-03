#!/bin/bash
# Production update script:
# 1. Back up local data/config files
# 2. Pull latest code from GitHub
# 3. Rebuild frontend assets
# 4. Re-initialize the database in a non-destructive way

set -euo pipefail

cd "$(dirname "$0")"
ROOT="$(pwd)"
PYTHON="$(command -v python3 || command -v python)"
BRANCH="${BRANCH:-main}"
REMOTE="${REMOTE:-origin}"
BACKUP_ROOT="${BACKUP_ROOT:-/tmp/orderok-backup-$(date +%Y%m%d%H%M%S)}"

backup_path() {
  local src="$1"
  if [ -e "$src" ]; then
    cp -a "$src" "$BACKUP_ROOT/"
  fi
}

echo "=== 0. Backup local data/config ==="
mkdir -p "$BACKUP_ROOT"
backup_path backend/instance
backup_path backend/.env
backup_path .env

if ! command -v git >/dev/null 2>&1; then
  echo "ERROR: git is required for update."
  exit 1
fi

dirty_changes="$(git status --porcelain --untracked-files=no | awk '
  $2 !~ /^backend\/runtime\// &&
  $2 !~ /^backend\/static\// &&
  $2 !~ /^backend\/instance\// { print }
')"
if [ -n "$dirty_changes" ]; then
  echo "ERROR: working tree has local code changes. Commit/stash them first."
  echo "$dirty_changes"
  exit 1
fi

echo "=== 1. Pull latest code from GitHub ==="
git fetch "$REMOTE" "$BRANCH"
git pull --ff-only "$REMOTE" "$BRANCH"

echo "=== 2. Install backend dependencies ==="
$PYTHON -m pip install -r backend/requirements.txt --break-system-packages 2>/dev/null || \
$PYTHON -m pip install -r backend/requirements.txt

echo "=== 3. Install frontend dependencies ==="
cd frontend
npm ci

echo "=== 4. Build frontend ==="
npm run build

echo "=== 5. Refresh static assets ==="
cd "$ROOT"
rm -rf backend/runtime/static
mkdir -p backend/runtime
cp -r frontend/dist backend/runtime/static

echo "=== 6. Ensure database schema is ready ==="
cd backend
$PYTHON -c "from app import init_db; init_db()"

echo ""
echo "Update complete."
echo "Backup directory: $BACKUP_ROOT"
echo "If the service is managed by systemd, restart it now."
