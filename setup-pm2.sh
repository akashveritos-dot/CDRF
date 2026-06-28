#!/bin/bash

# One-time PM2 setup script for zero-downtime deployments
# Run this ONCE on your Hostinger server

echo "🔧 Setting up PM2 for zero-downtime deployments..."

# Stop any existing PM2 processes
echo "Stopping existing PM2 processes..."
pm2 delete all 2>/dev/null || true

# Start with the ecosystem config (2 instances)
echo "Starting DCRS with ecosystem config..."
pm2 start ecosystem.config.js

# Save the PM2 process list
echo "Saving PM2 process list..."
pm2 save

# Setup PM2 to auto-start on server reboot
echo "Setting up PM2 startup script..."
pm2 startup

echo ""
echo "✅ PM2 setup complete!"
echo ""
echo "📊 Current status:"
pm2 status
echo ""
echo "📝 Next steps:"
echo "1. Copy the command shown above (if any) and run it as root/sudo"
echo "2. Push to GitHub main branch to test auto-deployment"
echo "3. Monitor with: pm2 logs dcrs"
echo ""
echo "🎉 Your app now has ZERO-DOWNTIME deployments!"
