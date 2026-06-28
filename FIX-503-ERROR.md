# Fix 503 Errors During Deployment

## The Problem
When you push code to GitHub, users see `503 Service Unavailable` for a few seconds.

## The Cause
Your PM2 is probably:
- Running only 1 instance (instead of 2+)
- Using `pm2 restart` (which stops before starting new)
- OR not using `pm2 reload` (which starts new before stopping old)

## The Solution

### Step 1: SSH into your server
```bash
ssh your_username@your_hostinger_server
cd /home/user/dcrs
```

### Step 2: Check current PM2 setup
```bash
pm2 list
```

**What you should see:**
- 2 or more instances of `dcrs` running
- Mode: `cluster`

**What causes 503:**
- Only 1 instance
- Mode: `fork`

### Step 3: Fix the setup

**Option A - Quick Check (run this script):**
```bash
chmod +x fix-deployment.sh
./fix-deployment.sh
```

**Option B - Manual Fix:**

If you have only 1 instance or fork mode:

```bash
# Stop current PM2
pm2 delete all

# Start with proper config (2 instances, cluster mode)
pm2 start ecosystem.config.js

# Save the config
pm2 save

# Verify
pm2 list
```

You should now see:
```
┌─────┬──────┬─────────┬──────┬───────┬─────────┐
│ id  │ name │ mode    │ ↺    │status │ cpu     │
├─────┼──────┼─────────┼──────┼───────┼─────────┤
│ 0   │ dcrs │ cluster │ 0    │online │ 0%      │
│ 1   │ dcrs │ cluster │ 0    │online │ 0%      │
└─────┴──────┴─────────┴──────┴───────┴─────────┘
```

### Step 4: Test deployment

Push a small change to GitHub and monitor:

```bash
# Watch PM2 logs
pm2 logs dcrs

# Or watch status
watch pm2 list
```

**What should happen:**
1. New processes start (id 2, 3)
2. They become ready
3. Old processes stop (id 0, 1)
4. New processes become id 0, 1

**Users will NOT see 503 errors!**

## Why This Works

### Old Way (Causes 503):
```
1. Stop old process → Website DOWN
2. Start new process → Wait 5-10 seconds
3. Website UP again
```
Users see 503 during step 2.

### New Way (Zero Downtime):
```
1. Old process still running → Website UP
2. Start new processes → Website still UP (old serving)
3. New processes ready → Switch traffic
4. Stop old processes → Website UP (new serving)
```
Users NEVER see 503!

## Troubleshooting

### Still seeing 503?

**Check 1:** How many instances?
```bash
pm2 list | grep dcrs | wc -l
```
Should be **2 or more**. If it's 1, do Step 3 again.

**Check 2:** Is it using reload?
```bash
cat deploy.sh | grep pm2
```
Should see: `pm2 reload ecosystem.config.js`
NOT: `pm2 restart`

**Check 3:** Check server logs during deployment
```bash
pm2 logs dcrs --lines 50
```

Look for:
- ✅ `[SERVER] Sending ready signal to PM2...`
- ✅ Process started with id X
- ❌ Any errors

### Still not working?

The 503 might be from:
1. **Hostinger's proxy** - They sometimes cache 503 responses
2. **Build taking too long** - Optimize build time
3. **Memory issues** - Check `pm2 monit`

## Files Changed

These files enable zero-downtime:

1. `ecosystem.config.js` - PM2 cluster config
2. `server.js` - Sends 'ready' signal to PM2
3. `deploy.sh` - Uses `pm2 reload` instead of restart
4. `.github/workflows/deploy.yml` - Runs deploy.sh

## Verification

After setup, test with:

```bash
# Terminal 1: Watch PM2
watch -n 1 pm2 list

# Terminal 2: Watch website
while true; do curl -I https://dcrf.world | head -1; sleep 1; done

# Terminal 3: Deploy
git push origin main
```

You should see:
- PM2 shows 4 processes briefly (2 old + 2 new)
- curl NEVER shows 503
- PM2 goes back to 2 processes

✅ **Zero downtime achieved!**
