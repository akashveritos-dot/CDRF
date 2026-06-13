import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/admin/events - List conclave registrations (Admin Secured)
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
    const status = url.searchParams.get('status');
    const role = url.searchParams.get('role'); // Attendance Mode
    const searchQuery = url.searchParams.get('search');

    let sql = 'SELECT * FROM event_registrations WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (role && role !== 'All') {
      sql += ' AND role = ?';
      params.push(role);
    }

    if (searchQuery) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ? OR designation LIKE ?)';
      const wildcard = `%${searchQuery}%`;
      params.push(wildcard, wildcard, wildcard, wildcard);
    }

    sql += ' ORDER BY created_at DESC';

    const registrations = await query<any[]>(sql, params);
    return NextResponse.json(registrations);

  } catch (error: any) {
    console.error('Fetch admin events error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conclave registrations' },
      { status: 500 }
    );
  }
}
