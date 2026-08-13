#!/bin/bash

set -Eeuo pipefail

PROJECT="/root/landsky"
BRANCH="main"
LOG_DIR="$PROJECT/deploy/logs"
LOG_FILE="$LOG_DIR/deploy-$(date '+%Y-%m-%d_%H-%M-%S').log"

mkdir -p "$LOG_DIR"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "=================================================="
echo " LANDSKY PRODUCTION DEPLOYMENT"
echo " Started: $(date)"
echo "=================================================="

cd "$PROJECT"

echo "[1/10] Checking Git repository..."
git status --short

echo "[2/10] Fetching latest GitHub code..."
git fetch --prune origin "$BRANCH"

PREVIOUS_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse "origin/$BRANCH")

echo "GitHub commit:"
git log -1 --oneline "$REMOTE_COMMIT"

echo "[3/10] Updating source code..."
git reset --hard "$REMOTE_COMMIT"

# Rollback trap function in case of failure
rollback() {
    local EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
        echo "=================================================="
        echo "⚠️ DEPLOYMENT FAILED! Rolling back to previous commit..."
        git reset --hard "$PREVIOUS_COMMIT"
        echo "Rollback complete. Check logs for the exact error."
        echo "=================================================="
    fi
    exit $EXIT_CODE
}
trap rollback EXIT

echo "[4/10] Backend installation..."
cd "$PROJECT/backend-installer"

if [ -f package-lock.json ]; then
    npm ci --omit=dev
else
    npm install --omit=dev
fi

echo "[5/10] Frontend installation..."
cd "$PROJECT/frontend"

if [ -f package-lock.json ]; then
    npm ci
else
    npm install
fi

echo "[6/10] Building frontend..."
npm run build

echo "[7/10] Restarting LANDSKY backend..."
pm2 restart landsky-backend-installer --update-env

echo "[8/10] Restarting LANDSKY frontend..."
pm2 restart landsky-frontend --update-env

echo "[9/10] Saving PM2 configuration..."
pm2 save

echo "[10/10] Deployment verification..."
sleep 5
pm2 list

# Very basic health check using pm2 describe
pm2 describe landsky-backend-installer > /dev/null || (echo "Backend failed to start!" && exit 1)
pm2 describe landsky-frontend > /dev/null || (echo "Frontend failed to start!" && exit 1)

# Remove the rollback trap on success
trap - EXIT

echo "Deployed commit:"
git rev-parse HEAD

echo "=================================================="
echo " LANDSKY DEPLOYMENT SUCCESSFUL"
echo " Finished: $(date)"
echo "=================================================="
