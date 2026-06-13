-- ==========================================
-- COMPLETE SUPERADMIN SETUP
-- ==========================================
-- Run this SQL to enable the Users section in admin panel
-- ==========================================

USE dcrf_northjoyto;

-- Step 1: Modify the users table to add SUPERADMIN role
ALTER TABLE users 
MODIFY COLUMN role ENUM('SUPERADMIN', 'ADMIN', 'MEMBER', 'GUEST') NOT NULL DEFAULT 'GUEST';

-- Step 2: Add is_active column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER role;

-- Step 3: Update the current admin user to SUPERADMIN with new password
UPDATE users 
SET role = 'SUPERADMIN',
    is_active = TRUE,
    password_hash = 'scrypt.1000.5cb9038ae5ed3440a1e3120bcac99ead.e5e3d5f9855b51c6fafc8f98c5369772ebeeb1d77cf51261ac428421db356b3564059bbb921e13e9b41f9ac74ab5a27c2eb0664d5b16b5f8095582b690df8377',
    updated_at = NOW()
WHERE id = 1 AND email = 'admin@dcrf.org';

-- Step 4: Verify the changes
SELECT id, email, name, role, is_active, created_at, updated_at 
FROM users 
ORDER BY id;

-- ==========================================
-- AFTER RUNNING THIS:
-- ==========================================
-- 1. Logout from admin panel: https://cdrf.vercel.app/admin
-- 2. Login again with:
--    Email: admin@dcrf.org
--    Password: D(rf@Adm!n#2026$Xk9
-- 3. You will now see "Users" in the navigation menu
-- ==========================================
