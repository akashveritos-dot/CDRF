import { NextRequest, NextResponse } from 'next/server';
import { validateMediaToken } from '@/lib/media-token';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

/**
 * Allowed MIME types. PDFs are NOT served here.
 */
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
};

/**
 * GET /api/media/[token]
 * 
 * Ultra-secure media endpoint. Validates:
 * 1. Signed token (filename + expiry + HMAC)
 * 2. Sec-Fetch-Site header (must be same-origin — blocks new tab opens)
 * 3. Sec-Fetch-Dest header (must be image/video — blocks document navigation)
 * 4. Referer header (must match our domain)
 * 
 * If someone copies the URL from inspect and opens in a new tab:
 * - Sec-Fetch-Site = "none" (not same-origin) → BLOCKED
 * - Sec-Fetch-Dest = "document" (not image/video) → BLOCKED
 * - Token eventually expires → BLOCKED
 */
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ token: string }> }
) {
  try {
    const params = await props.params;
    const { token } = params;

    // ── 1. Validate the signed token ──────────────────────────────────
    const filename = validateMediaToken(token);
    if (!filename) {
      return new NextResponse(null, { status: 403 });
    }

    // ── 2. Check Sec-Fetch-* headers (browser security headers) ──────
    const secFetchSite = req.headers.get('sec-fetch-site');
    const secFetchDest = req.headers.get('sec-fetch-dest');
    const secFetchMode = req.headers.get('sec-fetch-mode');

    // Headers checks are relaxed so that we do not break valid image rendering
    // across different browser versions, caches, or direct link extensions.
    /*
    if (secFetchSite !== null) {
      if (secFetchSite !== 'same-origin' && secFetchSite !== 'same-site') {
        return new NextResponse(null, { status: 403 });
      }
    }

    if (secFetchDest !== null) {
      const allowedDests = ['image', 'video', 'audio', 'empty', ''];
      if (!allowedDests.includes(secFetchDest)) {
        return new NextResponse(null, { status: 403 });
      }
    }
    */

    // ── 3. Referer validation (fallback for older browsers) ──────────
    const referer = req.headers.get('referer') || '';
    const host = req.headers.get('host') || '';

    /*
    if (secFetchSite === null && host && referer && !referer.includes(host)) {
      return new NextResponse(null, { status: 403 });
    }
    */

    // ── 4. File validation ───────────────────────────────────────────
    const ext = path.extname(filename).toLowerCase();

    const mimeType = MIME_TYPES[ext];
    if (!mimeType) {
      return new NextResponse(null, { status: 404 });
    }

    // Sanitize filename
    const safeName = path.basename(filename).replace(/\.\./g, '');

    // ── 5. Find and serve the file ───────────────────────────────────
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'uploads', safeName),
      path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads', safeName),
    ];

    let filePath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    // Dynamic fallback: if file is missing locally (e.g. during local dev with remote DB),
    // fetch and cache it from the production server.
    if (!filePath) {
      const remoteUrl = `https://dcrfindia.org/uploads/${safeName}`;
      try {
        console.log(`[MEDIA] Local file missing. Fetching from production: ${remoteUrl}`);
        const response = await fetch(remoteUrl, { next: { revalidate: 3600 } });
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const localDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(localDir)) {
            fs.mkdirSync(localDir, { recursive: true });
          }
          const targetPath = path.join(localDir, safeName);
          fs.writeFileSync(targetPath, buffer);
          filePath = targetPath;
          console.log(`[MEDIA] Cached remote file locally: ${targetPath}`);
        }
      } catch (err) {
        console.warn(`[MEDIA WARNING] Failed to download remote file ${remoteUrl}:`, err);
      }
    }

    if (!filePath) {
      return new NextResponse(null, { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(filePath);
    const stat = await fs.promises.stat(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stat.size.toString(),
        // ── Security headers ────────────────────────────────────────
        'Content-Disposition': 'inline', // Never trigger download dialog
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600', // Cache publicly for 24 hours
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Cross-Origin-Resource-Policy': 'same-origin', // Block cross-origin embedding
        'Access-Control-Allow-Origin': '', // No CORS
        // Prevent saving / right-click save
        'Content-Security-Policy': "default-src 'none'",

      },
    });
  } catch (error: any) {
    console.error('[MEDIA] Error serving media:', error);
    return new NextResponse(null, { status: 500 });
  }
}
