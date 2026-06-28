import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

/**
 * Allowed MIME types for the secure file serve API.
 * PDFs are NOT served here — they go through /api/reports/serve/[id].
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
 * GET /api/files/[...path]
 * 
 * Securely serves uploaded images, videos and public documents like agendas.
 * - Validates Referer/Origin to ensure request comes from the website
 * - Adds no-download, no-cache headers
 * - Never exposes the actual filesystem path
 */
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  try {
    const params = await props.params;
    const fileParts = params.path;

    if (!fileParts || fileParts.length === 0) {
      return new NextResponse(null, { status: 404 });
    }

    // Reconstruct the filename (handle nested paths safely)
    const fileName = fileParts[fileParts.length - 1];
    const ext = path.extname(fileName).toLowerCase();

    // Validate file extension
    const mimeType = MIME_TYPES[ext];
    if (!mimeType) {
      return new NextResponse(null, { status: 404 });
    }

    // Referer/Origin validation — only allow requests from our own site
    const referer = req.headers.get('referer') || '';
    const origin = req.headers.get('origin') || '';
    const host = req.headers.get('host') || '';

    // Allow if: referer contains our host, OR it's a same-origin request, OR it's a server-side render
    const isValidOrigin =
      referer.includes(host) ||
      origin.includes(host) ||
      (!referer && !origin); // Server-side rendering / initial load

    if (!isValidOrigin && host) {
      return new NextResponse(null, { status: 403 });
    }

    // Sanitize path to prevent directory traversal
    const safeName = fileName.replace(/\.\./g, '').replace(/[\/\\]/g, '');
    if (!safeName || safeName !== fileName) {
      return new NextResponse(null, { status: 400 });
    }

    // Look for the file on disk
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

    if (!filePath) {
      return new NextResponse(null, { status: 404 });
    }

    // Read and serve the file
    const fileBuffer = fs.readFileSync(filePath);
    const stat = fs.statSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stat.size.toString(),
        // Security headers — prevent downloading, hotlinking, caching
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        // Prevent right-click save & hotlinking
        'Access-Control-Allow-Origin': '',
        'Cross-Origin-Resource-Policy': 'same-origin',
      },
    });
  } catch (error: any) {
    console.error('[FILES] Error serving file:', error);
    return new NextResponse(null, { status: 500 });
  }
}
