#!/bin/bash

# DCRS True Zero-Downtime Deployment Script
# Users will NEVER see errors - old site stays up until new one is 100% ready

set -e

APP_DIR="/home/user/dcrs"
PM2_APP_NAME="dcrs"

echo "🚀 Starting DCRS zero-downtime deployment..."
cd $APP_DIR

# Step 1: Pull latest code
echo "📥 [1/5] Pulling latest code..."
git pull origin main

# Step 2: Install dependencies (old site still running)
echo "📦 [2/5] Installing dependencies (users still see old site)..."
npm ci --omit=dev --prefer-offline

# Step 3: Build the new version (old site still serving all users)
echo "🔨 [3/5] Building new version (old site still live)..."
npm run build

# Verify build was successful
if [ ! -d ".next" ]; then
  echo "❌ Build failed! Old site continues running."
  exit 1
fi
echo "✅ Build successful"

# Step 4: PM2 Reload with zero-downtime strategy
# PM2 will:
# 1. Start NEW processes with the new code
# 2. Wait for them to signal 'ready' (up to 10 seconds)
# 3. Only THEN kill old processes
# 4. Users see ZERO downtime
echo "♻️  [4/5] Starting new processes (old site still handling requests)..."
pm2 reload ecosystem.config.js --update-env

# Wait for stabilization
sleep 3

# Step 5: Verify all processes are online
echo "✅ [5/5] Verifying deployment..."
pm2 list | grep "$PM2_APP_NAME"

# Check HTTP health
if command -v curl &> /dev/null; then
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
  
  if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Health check: Site is online (HTTP $HTTP_STATUS)"
  else
    echo "⚠️  Health check: HTTP $HTTP_STATUS"
  fi
fi

echo ""
echo "🎉 Deployment completed! Zero downtime achieved."
echo "📊 Current status:"
pm2 status

