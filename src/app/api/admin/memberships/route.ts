import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/admin/memberships - Retrieve registrations (Admin Middleware protected)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tier = url.searchParams.get('tier');
    const status = url.searchParams.get('status');
    const payStatus = url.searchParams.get('pay_status');
    const searchQuery = url.searchParams.get('search');

    let sql = 'SELECT * FROM memberships WHERE 1=1';
    const params: any[] = [];

    if (tier && tier !== 'All') {
      sql += ' AND tier = ?';
      params.push(tier);
    }

    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (payStatus && payStatus !== 'All') {
      sql += ' AND pay_status = ?';
      params.push(payStatus);
    }

    if (searchQuery) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR organization LIKE ? OR title LIKE ?)';
      const wildcard = `%${searchQuery}%`;
      params.push(wildcard, wildcard, wildcard, wildcard);
    }

    sql += ' ORDER BY created_at DESC';

    const registrations = await query<any[]>(sql, params);
    return NextResponse.json(registrations);
  } catch (error: any) {
    console.error('Fetch admin memberships error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve membership applications' },
      { status: 500 }
    );
  }
}
