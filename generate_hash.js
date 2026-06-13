const { scryptSync, randomBytes } = require('crypto');

const password = 'D(rf@Adm!n#2026$Xk9';
const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64);

const passwordHash = `scrypt.1000.${salt}.${hash.toString('hex')}`;

console.log('\n==============================================');
console.log('PASSWORD HASH GENERATED SUCCESSFULLY');
console.log('==============================================\n');
console.log('New Password:', password);
console.log('\nGenerated Hash:\n');
console.log(passwordHash);
console.log('\n==============================================');
console.log('SQL UPDATE COMMAND:');
console.log('==============================================\n');
console.log(`UPDATE users 
SET password_hash = '${passwordHash}',
    updated_at = NOW()
WHERE id = 1 
  AND email = 'admin@dcrf.org';`);
console.log('\n==============================================');
console.log('VERIFICATION COMMAND:');
console.log('==============================================\n');
console.log(`SELECT id, email, name, role, updated_at 
FROM users 
WHERE id = 1;`);
console.log('\n==============================================\n');
