# Zero-Downtime Deployment Setup

This project uses PM2 cluster mode with graceful reloading to ensure **TRUE zero-downtime** deployments.

## How It Works

### The Problem
When deploying updates, users would see "503 Service Unavailable" errors because the server was restarting.

### The Solution
1. **PM2 Cluster Mode**: Run multiple instances (2+)
2. **Graceful Reload**: New processes start BEFORE old ones stop
3. **Ready Signal**: Server tells PM2 when it's ready to accept traffic
4. **Old Site Stays Live**: Users keep seeing the working site until new version is 100% ready

## Deployment Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Git Pull (old site still running)                    │
├─────────────────────────────────────────────────────────┤
│ 2. npm install (old site still running)                 │
├─────────────────────────────────────────────────────────┤
│ 3. npm run build (old site still running)               │
├─────────────────────────────────────────────────────────┤
│ 4. PM2 starts NEW processes                             │
│    - New code loads                                      │
│    - New processes send 'ready' signal                   │
│    - PM2 waits for 'ready' (up to 10 seconds)           │
├─────────────────────────────────────────────────────────┤
│ 5. PM2 routes traffic to NEW processes                  │
├─────────────────────────────────────────────────────────┤
│ 6. PM2 gracefully stops OLD processes                   │
└─────────────────────────────────────────────────────────┘
```

**Users experience ZERO downtime - they never see errors!**

## Setup on Server

### First Time Setup

```bash
cd /home/user/dcrs

# Install PM2 globally
npm install -g pm2

# Start the app with ecosystem config
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on server boot
pm2 startup
```

### Deployment

Deployments happen automatically via GitHub Actions when you push to `main` branch.

Or manually run:
```bash
cd /home/user/dcrs
./deploy.sh
```

## Configuration Files

### ecosystem.config.js
- Runs 2+ instances in cluster mode
- Configures graceful shutdown
- Sets memory limits
- Enables ready signal

### server.js
- Sends 'ready' signal to PM2 when server is fully started
- Handles graceful shutdowns on SIGTERM/SIGINT

### deploy.sh
- Automated deployment script
- Pulls code → installs deps → builds → reloads PM2
- Verifies health after deployment

### .github/workflows/deploy.yml
- GitHub Actions workflow
- Triggers on push to main
- Runs deploy.sh on server via SSH

## Monitoring

Check app status:
```bash
pm2 status
pm2 logs dcrs --lines 100
pm2 monit
```

## Troubleshooting

If you see 503 errors:

1. **Check PM2 status**:
   ```bash
   pm2 list
   ```

2. **Check logs**:
   ```bash
   pm2 logs dcrs --lines 50
   ```

3. **Restart if needed**:
   ```bash
   pm2 restart ecosystem.config.js
   ```

4. **Verify instances**:
   - Should have at least 2 instances running
   - If only 1 instance, zero-downtime won't work

5. **Check memory**:
   ```bash
   pm2 monit
   ```
   - If memory is too high, increase max_memory_restart in ecosystem.config.js

## Key Settings

In `ecosystem.config.js`:

```javascript
instances: 2,           // Must be 2+ for zero-downtime
wait_ready: true,       // Wait for 'ready' signal
listen_timeout: 10000,  // Wait up to 10s for ready
kill_timeout: 5000,     // Graceful shutdown time
```

These settings ensure old processes keep serving users until new ones are ready!
