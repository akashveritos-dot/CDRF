# 🔧 Vercel Environment Variable Update Required

## Critical: Add Connection Limit to Vercel

To fix the "max_user_connections exceeded" error, you need to add an environment variable to Vercel:

### Steps:

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: **cdrf**
3. Go to **Settings** → **Environment Variables**
4. Add this new variable:
   - **Name:** `DB_CONNECTION_LIMIT`
   - **Value:** `2`
   - **Environments:** Select all (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your application:
   - Go to **Deployments** tab
   - Click the three dots (•••) on the latest deployment
   - Click **Redeploy**
   - Select **Use existing Build Cache** (faster)
   - Click **Redeploy**

## Why This Fixes the Issue:

- Filess.io free tier allows max 5 connections
- Without this limit, Vercel might open too many connections
- Setting limit to 2 ensures you stay well under the 5 connection limit
- Connections now close immediately after use (maxIdle: 0)

## After Redeployment:

The error should stop appearing. If you still see issues, we may need to:
1. Upgrade Filess.io plan (paid tier with more connections)
2. Migrate to a different database provider (e.g., PlanetScale, Neon, Railway)
