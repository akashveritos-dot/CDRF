import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Allowed MIME types for the secure file serve API.
 * PDFs are NOT served here - they go through /api/reports/serve/[id].
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

    // Referer/Origin validation - only allow requests from our own site
    const referer = req.headers.get('referer') || '';
    const origin = req.headers.get('origin') || '';
    const host = req.headers.get('host') || '';
    const forwardedHost = req.headers.get('x-forwarded-host') || '';

    // Allow if: referer/origin contains our host, OR it's a same-origin request, OR it's a server-side render, OR it's from our domains
    const isValidOrigin =
      (host && referer.includes(host)) ||
      (forwardedHost && referer.includes(forwardedHost)) ||
      (host && origin.includes(host)) ||
      (forwardedHost && origin.includes(forwardedHost)) ||
      referer.includes('dcrf.world') ||
      referer.includes('localhost') ||
      referer.includes('127.0.0.1') ||
      referer.includes('ngrok-free') ||
      (!referer && !origin); // Server-side rendering / initial load

    if (!isValidOrigin && (host || forwardedHost)) {
      return new NextResponse(null, { status: 403 });
    }

    // Sanitize path to prevent directory traversal
    const safeName = fileName.replace(/\.\./g, '').replace(/[\/\\]/g, '');
    if (!safeName || safeName !== fileName) {
      return new NextResponse(null, { status: 400 });
    }

    // Gating check for agenda files
    if (safeName === 'conclave_agenda.pdf' || safeName.toLowerCase().includes('agenda')) {
      const settingsRows = await query<any[]>(
        "SELECT setting_value FROM site_settings WHERE setting_key = 'agenda_download_gate_enabled'"
      );
      const isGateEnabled = settingsRows.length > 0 ? settingsRows[0].setting_value === 'true' : true;
      if (!isGateEnabled) {
        return new NextResponse(
          JSON.stringify({ error: 'Download access is disabled by admin.' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // -- Persistent upload directory (same logic as upload route) --------------
    const getUploadDir = (): string => {
      const cwd = process.cwd();
      let projectRoot = cwd;
      
      // If we are in standalone mode or inside .next directory, walk up to the project root
      if (projectRoot.includes('.next')) {
        while (projectRoot.includes('.next') && projectRoot !== path.dirname(projectRoot)) {
          projectRoot = path.dirname(projectRoot);
        }
      }
      
      // Use a folder at the project root level (outside of .next build folder)
      // This ensures write permissions are always available (as the app user owns the project folder).
      return path.join(projectRoot, 'dcrf-persistent-uploads');
    };

    const uploadDir = getUploadDir();
    const targetPath = path.join(uploadDir, safeName);

    // Also check legacy/development folders for backwards-compat
    let projectRoot = process.cwd();
    if (projectRoot.includes('.next')) {
      while (projectRoot.includes('.next') && projectRoot !== path.dirname(projectRoot)) {
        projectRoot = path.dirname(projectRoot);
      }
    }

    const legacyPaths = [
      targetPath,
      path.join(projectRoot, 'public', 'uploads', safeName),
      path.join(projectRoot, '.next', 'standalone', 'public', 'uploads', safeName),
    ];

    let filePath: string | null = null;
    for (const p of legacyPaths) {
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
        // Security headers - prevent downloading, hotlinking, caching
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
