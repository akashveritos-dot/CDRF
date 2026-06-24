import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/report-downloads
 * Admin-secured endpoint to list all report download records.
 * Supports optional ?reportId= filter.
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const reportId = url.searchParams.get('reportId');

    let sql = `
      SELECT 
        rd.id,
        rd.report_id,
        rd.name,
        rd.email,
        rd.downloaded_at,
        r.title AS report_title,
        r.category AS report_category
      FROM report_downloads rd
      LEFT JOIN reports r ON rd.report_id = r.id
    `;
    const params: any[] = [];

    if (reportId) {
      sql += ' WHERE rd.report_id = ?';
      params.push(reportId);
    }

    sql += ' ORDER BY rd.downloaded_at DESC';

    const downloads = await query<any[]>(sql, params);

    return NextResponse.json({
      downloads: Array.isArray(downloads) ? downloads : [],
      total: Array.isArray(downloads) ? downloads.length : 0,
    });
  } catch (error: any) {
    console.error('[ADMIN] Error fetching report downloads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch download records.' },
      { status: 500 }
    );
  }
}
