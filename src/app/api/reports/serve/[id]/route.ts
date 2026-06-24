import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import path from 'path';
import fs from 'fs';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/serve/[id]?token=...
 * Securely serves a PDF file by report ID.
 * Requires a valid signed download token (issued after gate form submission).
 * Never exposes the actual file path to the client.
 */
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    // Validate download token
    if (!token) {
      return NextResponse.json(
        { error: 'Access denied. A download token is required.' },
        { status: 403 }
      );
    }

    const tokenPayload = await verifyToken(token);
    if (!tokenPayload || tokenPayload.reportId !== parseInt(id, 10) || tokenPayload.purpose !== 'report_download') {
      return NextResponse.json(
        { error: 'Invalid or expired download token.' },
        { status: 403 }
      );
    }

    // Check token expiry (15 minutes)
    if (tokenPayload.exp && Date.now() > tokenPayload.exp) {
      return NextResponse.json(
        { error: 'Download token has expired. Please request access again.' },
        { status: 403 }
      );
    }

    // Fetch report from database
    const reports = await query<any[]>('SELECT * FROM reports WHERE id = ? LIMIT 1', [id]);
    if (reports.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const report = reports[0];
    const downloadUrl = report.download_url;

    if (!downloadUrl || downloadUrl === '#') {
      return NextResponse.json(
        { error: 'No PDF file available for this report.' },
        { status: 404 }
      );
    }

    // Determine the file path on disk
    // download_url is stored as /uploads/filename.pdf
    const relativePath = downloadUrl.startsWith('/') ? downloadUrl : `/${downloadUrl}`;
    
    // Try multiple possible locations
    const possiblePaths = [
      path.join(process.cwd(), 'public', relativePath),
      path.join(process.cwd(), '.next', 'standalone', 'public', relativePath),
    ];

    let filePath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      console.error(`[SERVE] PDF file not found on disk for report ${id}. Tried:`, possiblePaths);
      return NextResponse.json(
        { error: 'PDF file could not be located on the server.' },
        { status: 404 }
      );
    }

    // Read and serve the file
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${report.title.replace(/[^a-zA-Z0-9\s\-_]/g, '')}.pdf"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    console.error('[SERVE] Error serving report PDF:', error);
    return NextResponse.json(
      { error: 'Failed to serve report file.' },
      { status: 500 }
    );
  }
}
