import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/admin/audit-logs - Fetch read-only audit log list (Secured)
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
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const section = url.searchParams.get('section');
    const search = url.searchParams.get('search');

    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (section && section !== 'All') {
      sql += ' AND section = ?';
      params.push(section);
    }

    if (search) {
      sql += ' AND (user_email LIKE ? OR user_name LIKE ? OR details LIKE ? OR ip_address LIKE ? OR location LIKE ?)';
      const wildcard = `%${search}%`;
      params.push(wildcard, wildcard, wildcard, wildcard, wildcard);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const logs = await query<any[]>(sql, params);
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Fetch audit logs error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve audit logs' },
      { status: 500 }
    );
  }
}
