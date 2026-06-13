# 🚀 Deployment Steps for User Management System

## Step 1: Update Database Schema

1. **Go to Filess.io**: https://filess.io
2. **Login** to your account
3. **Select database**: `dcrf_northjoyto`
4. **Open SQL Query Editor**
5. **Copy and paste** the complete SQL from `COMPLETE_SETUP.sql`
6. **Execute the query**

## Step 2: Update Environment Variable on Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: cdrf
3. **Go to Settings** → **Environment Variables**
4. **Add this variable**:
   - Name: `DB_CONNECTION_LIMIT`
   - Value: `2`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
5. **Click Save**

## Step 3: Deploy Updated Code

1. **Go to Deployments** tab in Vercel
2. **Click the three dots (•••)** on the latest deployment
3. **Click "Redeploy"**
4. **Select "Use existing Build Cache"**
5. **Click "Redeploy"**
6. **Wait** for deployment to complete (~2-3 minutes)

## Step 4: Test the New System

1. **Logout** from current admin session
2. **Go to**: https://cdrf.vercel.app/admin/login
3. **Login** with new credentials:
   - Email: `admin@dcrf.org`
   - Password: `D(rf@Adm!n#2026$Xk9`
4. **You should now see**:
   - "SUPERADMIN" role displayed in the profile section
   - "Users" menu item in the navigation (with UserCog icon)
   - Access to full user management system

## What's Changed:

### ✅ Role System:
- **SUPERADMIN**: Full access (manage users, delete content)
- **ADMIN**: Limited access (update/publish content, cannot delete or manage users)
- **MEMBER**: No admin access
- **GUEST**: No admin access

### ✅ User Management Features (SUPERADMIN only):
- ✨ Create new users
- ✏️ Edit user details (name, email, role)
- 🔒 Change user passwords
- ✅ Activate/Deactivate users
- 🗑️ Delete users
- 🔐 Strong password requirements (8+ chars, uppercase, lowercase, number, symbol)

### ✅ Permission System:
- ADMIN users **cannot** see the Users section
- ADMIN users **cannot** delete content (news, reports, etc.)
- Only SUPERADMIN can delete content
- Both ADMIN and SUPERADMIN can update and publish

### ✅ Database Connection Fix:
- Connection pool limit set to 2 (under Filess.io's 5 connection limit)
- Idle connections close immediately to free resources
- Should fix "max_user_connections exceeded" errors

## Troubleshooting:

### If Users section still not showing:
1. Clear browser cache and hard refresh (Ctrl+Shift+R)
2. Verify the SQL ran successfully (check users table)
3. Logout and login again
4. Check browser console for errors

### If database errors persist:
1. Verify `DB_CONNECTION_LIMIT=2` is set in Vercel
2. Check that the deployment completed successfully
3. Consider upgrading Filess.io plan or migrating to a better database host

### If login fails:
1. Verify the password was updated in the database
2. Check that `role = 'SUPERADMIN'` for admin@dcrf.org
3. Check that `is_active = TRUE` for the user
