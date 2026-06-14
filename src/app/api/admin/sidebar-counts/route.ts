import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

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

    // Run count queries in parallel
    const [
      queriesCountRes,
      membershipsCountRes,
      registrationsCountRes,
      subscriptionsCountRes,
      scrapedCountRes
    ] = await Promise.all([
      query<any[]>('SELECT COUNT(*) as count FROM contact_messages'),
      query<any[]>('SELECT COUNT(*) as count FROM memberships WHERE status = \'Pending\''),
      query<any[]>('SELECT COUNT(*) as count FROM event_registrations WHERE status = \'Pending\''),
      query<any[]>('SELECT COUNT(*) as count FROM subscriptions'),
      query<any[]>('SELECT COUNT(*) as count FROM scraped_content WHERE status = \'Pending\'')
    ]);

    const counts = {
      queries: queriesCountRes[0]?.count || 0,
      memberships: membershipsCountRes[0]?.count || 0,
      registrations: registrationsCountRes[0]?.count || 0,
      subscriptions: subscriptionsCountRes[0]?.count || 0,
      scraper: scrapedCountRes[0]?.count || 0
    };

    return NextResponse.json(counts);
  } catch (error: any) {
    console.error('Sidebar counts API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve sidebar counts' },
      { status: 500 }
    );
  }
}
