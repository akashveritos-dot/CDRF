-- ==========================================
-- UPDATE USER ROLES SCHEMA
-- ==========================================
-- Add SUPERADMIN role and is_active field
-- ==========================================

USE dcrf_northjoyto;

-- 1. Modify the users table to add SUPERADMIN role and is_active field
ALTER TABLE users 
MODIFY COLUMN role ENUM('SUPERADMIN', 'ADMIN', 'MEMBER', 'GUEST') NOT NULL DEFAULT 'GUEST';

-- 2. Add is_active column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER role;

-- 3. Update the current admin to SUPERADMIN
UPDATE users 
SET role = 'SUPERADMIN', 
    is_active = TRUE 
WHERE id = 1 AND email = 'admin@dcrf.org';

-- 4. Verify the changes
SELECT id, email, name, role, is_active, created_at, updated_at 
FROM users 
ORDER BY id;
