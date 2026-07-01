// Environment validation script
export const JWT_SECRET = process.env.JWT_SECRET;
export const CRON_SECRET = process.env.CRON_SECRET;

export function validateEnv() {
  if (process.env.NODE_ENV === 'production') {
    if (!JWT_SECRET || JWT_SECRET === 'dcrf_jwt_secret_key') {
      console.error('❌ FATAL: JWT_SECRET is not configured or insecure in production!');
      throw new Error('JWT_SECRET environment variable is required and must be secure in production.');
    }
    if (!CRON_SECRET || CRON_SECRET === 'dcrf_cron_secret_trigger') {
      console.error('❌ FATAL: CRON_SECRET is not configured or insecure in production!');
      throw new Error('CRON_SECRET environment variable is required and must be secure in production.');
    }
  }
}

export function getJwtSecret(): string {
  return JWT_SECRET || 'dcrf_jwt_secret_key';
}

export function getCronSecret(): string {
  return CRON_SECRET || 'dcrf_cron_secret_trigger';
}
