USE dcrf_northjoyto;

-- Add is_active column
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER role;

-- Update role enum to include SUPERADMIN
ALTER TABLE users MODIFY COLUMN role ENUM('SUPERADMIN', 'ADMIN', 'MEMBER', 'GUEST') NOT NULL DEFAULT 'GUEST';

-- Update admin user
UPDATE users 
SET role = 'SUPERADMIN', is_active = TRUE, updated_at = NOW()
WHERE email = 'admin@dcrf.org';

-- Verify
SELECT id, email, name, role, is_active FROM users WHERE email = 'admin@dcrf.org';
