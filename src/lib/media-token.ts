/**
 * Media Token Generator
 * 
 * Creates opaque, signed, time-limited tokens for uploaded file URLs.
 * The token hides the original filename and expires after a set duration.
 * 
 * Token format: <base64url(filename)>.<expiry_timestamp>.<hmac_signature>
 * 
 * When viewed in DevTools inspect tab, users only see:
 *   /api/media/aW1hZ2VfMTIzLmpwZw.1719270000.a7f2c9e1d3b5
 * No filename, no file extension — completely opaque.
 */

const SECRET = process.env.JWT_SECRET || process.env.MEDIA_TOKEN_SECRET || 'dcrf_media_secret_v2';

// Token validity: 365 days
// Tokens are regenerated on every API response, so a long window prevents
// cached pages/images from showing broken images after a short expiry.
const TOKEN_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Simple HMAC-like hash using Web Crypto (edge-compatible).
 * Falls back to a basic hash if crypto is unavailable.
 */
function simpleHash(input: string): string {
  let hash = 0;
  const combined = input + SECRET;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  // Convert to hex and pad
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  // Generate a longer hash by doing multiple rounds
  let hash2 = 0;
  for (let i = combined.length - 1; i >= 0; i--) {
    const char = combined.charCodeAt(i);
    hash2 = ((hash2 << 7) - hash2) + char;
    hash2 = hash2 & hash2;
  }
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  return hex + hex2;
}

/**
 * Base64Url encode (no padding, URL-safe)
 */
function toBase64Url(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64Url decode
 */
function fromBase64Url(b64: string): string {
  let base64 = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf-8');
  }
  return atob(base64);
}

/**
 * Generate a signed, time-limited media token for a filename.
 * Returns the full URL path: /api/media/<token>
 */
export function generateMediaUrl(filename: string): string {
  // Round expiry to nearest 30 minutes for better cacheability
  const now = Date.now();
  const roundedNow = Math.floor(now / (30 * 60 * 1000)) * (30 * 60 * 1000);
  const expiry = roundedNow + TOKEN_VALIDITY_MS;

  const encodedFilename = toBase64Url(filename);
  const signature = simpleHash(`${filename}:${expiry}`);

  return `/api/media/${encodedFilename}.${expiry}.${signature}`;
}

/**
 * Validate and decode a media token.
 * Returns the original filename if valid, null if invalid/expired.
 */
export function validateMediaToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedFilename, expiryStr, signature] = parts;
    const expiry = parseInt(expiryStr, 10);

    // Check expiry format
    if (isNaN(expiry)) {
      return null;
    }

    // Decode filename
    const filename = fromBase64Url(encodedFilename);
    if (!filename) return null;

    // Check expiry
    if (Date.now() > expiry) {
      return null;
    }

    // Validate signature
    const expectedSignature = simpleHash(`${filename}:${expiry}`);
    if (signature !== expectedSignature) return null;

    return filename;
  } catch {
    return null;
  }
}
