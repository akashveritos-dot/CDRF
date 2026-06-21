import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/admin/memberships - Retrieve registrations (Admin Middleware protected)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tier = url.searchParams.get('tier');
    const status = url.searchParams.get('status');
    const payStatus = url.searchParams.get('pay_status');
    const membershipStatus = url.searchParams.get('membership_status');
    const searchQuery = url.searchParams.get('search');
    const statsOnly = url.searchParams.get('stats') === '1';

    // Return stats summary
    if (statsOnly) {
      const [total, active, expiringSoon, expired] = await Promise.all([
        query<any[]>('SELECT COUNT(*) as count FROM memberships WHERE is_current = 1 AND pay_status = \'Paid\''),
        query<any[]>('SELECT COUNT(*) as count FROM memberships WHERE is_current = 1 AND membership_status = \'Active\' AND (expires_at IS NULL OR expires_at > NOW())'),
        query<any[]>('SELECT COUNT(*) as count FROM memberships WHERE is_current = 1 AND membership_status = \'Active\' AND expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)'),
        query<any[]>('SELECT COUNT(*) as count FROM memberships WHERE is_current = 1 AND (membership_status = \'Expired\' OR (expires_at IS NOT NULL AND expires_at < NOW()))'),
      ]);
      return NextResponse.json({
        total: total[0]?.count || 0,
        active: active[0]?.count || 0,
        expiringSoon: expiringSoon[0]?.count || 0,
        expired: expired[0]?.count || 0,
      });
    }

    let sql = 'SELECT *, CASE WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN \'Expired\' ELSE membership_status END AS effective_status FROM memberships WHERE 1=1';
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

    if (membershipStatus && membershipStatus !== 'All') {
      if (membershipStatus === 'Expired') {
        sql += ' AND (membership_status = \'Expired\' OR (expires_at IS NOT NULL AND expires_at < NOW()))';
      } else {
        sql += ' AND membership_status = ? AND (expires_at IS NULL OR expires_at >= NOW())';
        params.push(membershipStatus);
      }
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
