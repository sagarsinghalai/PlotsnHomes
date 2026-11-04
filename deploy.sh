#!/bin/bash
# =============================================================================
# PlotsnHomes — production deploy script (Hostinger VPS / Docker Compose)
#
# Pulls the latest code from GitHub and rebuilds the app container. The app's
# startup command runs `build:hostinger`, which regenerates the MySQL schema,
# runs `prisma db push` (applies schema changes to the live DB), builds Next.js,
# and starts the server. The MySQL data volume (mysql_data) is never touched.
#
# Usage (on the server):
#   cd /opt/plotsnhomes && ./deploy.sh
#
# SAFETY: never run `docker compose down -v` — the -v deletes the database
# volume. This script never does that.
# =============================================================================
set -euo pipefail

PROJECT_DIR="/opt/plotsnhomes"
BRANCH="main"

cd "$PROJECT_DIR"

echo "==> Pulling latest code from origin/$BRANCH ..."
git pull origin "$BRANCH"

echo "==> Rebuilding and restarting the app (this runs the build + prisma db push) ..."
docker compose up -d --build

echo "==> Cleaning up old dangling images ..."
docker image prune -f

echo ""
echo "==> Done. Current containers:"
docker ps

echo ""
echo "Tip: watch the app start with  ->  docker compose logs -f app   (Ctrl+C to stop watching)"
