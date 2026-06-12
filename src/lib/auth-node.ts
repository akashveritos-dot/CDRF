import cryptoNode from 'crypto';

const ITERATIONS = 1000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

// ─── Password hashing & verification (Node.js runtime only) ───────────────────

export function hashPassword(password: string): string {
  const salt = cryptoNode.randomBytes(16).toString('hex');
  const hash = cryptoNode.scryptSync(password, salt, KEY_LEN).toString('hex');
  return `scrypt.${ITERATIONS}.${salt}.${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split('.');
    if (parts.length !== 4) return false;
    const algo = parts[0];
    const salt = parts[2];
    const hash = parts[3];

    if (algo === 'scrypt') {
      const calculated = cryptoNode.scryptSync(password, salt, KEY_LEN).toString('hex');
      return calculated === hash;
    } else if (algo === 'pbkdf2') {
      const calculated = cryptoNode.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
      return calculated === hash;
    }
  } catch (err) {
    console.error('Password verification failed:', err);
  }
  return false;
}
