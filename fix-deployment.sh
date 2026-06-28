#!/bin/bash

# This script will check your current PM2 setup and fix the 503 deployment issue

echo "🔍 Diagnosing PM2 setup..."
echo ""

# Check current PM2 status
echo "Current PM2 processes:"
pm2 list

echo ""
echo "Checking PM2 mode for dcrs:"
pm2 describe dcrs 2>/dev/null | grep -E "(exec mode|instances)" || echo "No dcrs process found"

echo ""
echo "─────────────────────────────────────────────────"
echo ""

# Count instances
INSTANCE_COUNT=$(pm2 list | grep -c "dcrs" || echo "0")

if [ "$INSTANCE_COUNT" -eq "0" ]; then
    echo "❌ No PM2 processes found!"
    echo ""
    echo "Let's start with the correct config:"
    echo ""
    read -p "Start DCRS with ecosystem.config.js? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pm2 start ecosystem.config.js
        pm2 save
        echo "✅ Started with cluster mode (2 instances)"
        pm2 list
    fi
elif [ "$INSTANCE_COUNT" -eq "1" ]; then
    echo "⚠️  PROBLEM FOUND: Only 1 instance running!"
    echo "   This causes 503 errors during deployment."
    echo ""
    echo "Solution: Switch to cluster mode (2+ instances)"
    echo ""
    read -p "Fix this now? This will restart your app. (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping current process..."
        pm2 delete dcrs
        
        echo "Starting with ecosystem config (2 instances)..."
        pm2 start ecosystem.config.js
        pm2 save
        
        echo ""
        echo "✅ Fixed! Now running with 2 instances"
        pm2 list
    fi
else
    echo "✅ Good! Multiple instances detected ($INSTANCE_COUNT)"
    echo ""
    echo "Checking if using cluster mode..."
    if pm2 describe dcrs | grep -q "cluster"; then
        echo "✅ Using cluster mode - this is correct!"
    else
        echo "⚠️  Using fork mode - should use cluster for zero-downtime"
        echo ""
        read -p "Switch to cluster mode? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            pm2 delete dcrs
            pm2 start ecosystem.config.js
            pm2 save
            echo "✅ Switched to cluster mode"
        fi
    fi
fi

echo ""
echo "─────────────────────────────────────────────────"
echo ""
echo "📝 Deployment Command Check:"
echo ""

# Check if deploy.sh uses reload or restart
if [ -f "deploy.sh" ]; then
    if grep -q "pm2 reload" deploy.sh; then
        echo "✅ deploy.sh uses 'pm2 reload' (correct for zero-downtime)"
    elif grep -q "pm2 restart" deploy.sh; then
        echo "❌ deploy.sh uses 'pm2 restart' (causes 503 errors!)"
        echo "   Need to change to 'pm2 reload'"
    else
        echo "⚠️  deploy.sh doesn't use pm2 reload or restart"
    fi
else
    echo "⚠️  No deploy.sh found"
fi

echo ""
echo "─────────────────────────────────────────────────"
echo ""
echo "🎯 Summary:"
echo ""
echo "For ZERO downtime deployments, you need:"
echo "  ✓ At least 2 PM2 instances running"
echo "  ✓ Cluster mode enabled"
echo "  ✓ Use 'pm2 reload' (not restart) during deployment"
echo "  ✓ ecosystem.config.js with wait_ready: true"
echo ""
echo "Current deployment will use:"
cat deploy.sh | grep "pm2" | head -1 || echo "  Unknown"
echo ""
