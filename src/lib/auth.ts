const webCrypto = (typeof crypto !== 'undefined' ? crypto : null) as any;

// ─── Edge-compatible Base64Url helper ─────────────────────────────────────────

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─── Web Crypto HMAC JWT Utility ──────────────────────────────────────────────

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const keyData = encoder.encode(secret);
  return webCrypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signToken(payload: any, secret: string = process.env.JWT_SECRET || 'dcrf_jwt_secret_key'): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const base64Header = arrayBufferToBase64Url(encoder.encode(JSON.stringify(header)).buffer);
  const base64Payload = arrayBufferToBase64Url(encoder.encode(JSON.stringify(payload)).buffer);
  const signatureInput = `${base64Header}.${base64Payload}`;
  
  const key = await getHmacKey(secret);
  const signature = await webCrypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signatureInput)
  );
  
  const base64Signature = arrayBufferToBase64Url(signature);
  return `${signatureInput}.${base64Signature}`;
}

export async function verifyToken(token: string, secret: string = process.env.JWT_SECRET || 'dcrf_jwt_secret_key'): Promise<any> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [headerB64, payloadB64, signatureB64] = parts;
  const signatureInput = `${headerB64}.${payloadB64}`;
  
  try {
    const key = await getHmacKey(secret);
    const signature = base64UrlToArrayBuffer(signatureB64);
    
    const isValid = await webCrypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(signatureInput)
    );
    
    if (!isValid) return null;
    
    const payloadArray = base64UrlToArrayBuffer(payloadB64);
    const payloadJson = decoder.decode(payloadArray);
    return JSON.parse(payloadJson);
  } catch (e) {
    console.error('JWT verify failed:', e);
    return null;
  }
}
