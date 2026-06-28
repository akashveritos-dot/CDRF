#!/bin/bash

echo "🔍 Checking PM2 Setup for Zero-Downtime..."
echo ""

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 is installed"
    pm2 --version
else
    echo "❌ PM2 is NOT installed"
    echo "   Install with: npm install -g pm2"
    exit 1
fi

echo ""
echo "📊 Current PM2 Processes:"
pm2 list

echo ""
echo "🔧 Current PM2 Mode:"
pm2 describe dcrs 2>/dev/null | grep "exec mode" || echo "❌ No 'dcrs' process found"

echo ""
echo "📈 Number of Instances:"
INSTANCES=$(pm2 list | grep "dcrs" | wc -l)
echo "Running instances: $INSTANCES"

if [ "$INSTANCES" -lt 2 ]; then
    echo "⚠️  WARNING: You need at least 2 instances for zero-downtime!"
    echo "   Current setup will cause 503 errors during deployment."
else
    echo "✅ Good! Multiple instances can enable zero-downtime"
fi

echo ""
echo "📝 Recommendations:"
echo ""

if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ ecosystem.config.js not found"
    echo "   This file is needed for cluster mode and zero-downtime"
else
    echo "✅ ecosystem.config.js exists"
fi

echo ""
echo "🔄 To fix 503 errors during deployment:"
echo "1. Stop current PM2 processes: pm2 delete all"
echo "2. Start with ecosystem config: pm2 start ecosystem.config.js"
echo "3. Save: pm2 save"
echo "4. Future deployments: pm2 reload ecosystem.config.js"
echo ""
echo "This will keep old processes running while new ones start!"
