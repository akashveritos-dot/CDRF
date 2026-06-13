-- ==========================================
-- UPDATE SUPERADMIN PASSWORD
-- ==========================================
-- Email: admin@dcrf.org
-- New Password: D(rf@Adm!n#2026$Xk9
-- ==========================================

USE dcrf_northjoyto;

UPDATE users 
SET password_hash = 'scrypt.1000.5cb9038ae5ed3440a1e3120bcac99ead.e5e3d5f9855b51c6fafc8f98c5369772ebeeb1d77cf51261ac428421db356b3564059bbb921e13e9b41f9ac74ab5a27c2eb0664d5b16b5f8095582b690df8377',
    updated_at = NOW()
WHERE id = 1 
  AND email = 'admin@dcrf.org';

-- Verify the update was successful
SELECT id, email, name, role, updated_at 
FROM users 
WHERE id = 1;
