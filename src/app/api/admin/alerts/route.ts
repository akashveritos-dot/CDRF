import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';

// GET /api/admin/alerts - Fetch all ticker alerts (Admin Secured)
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

    const alerts = await query<any[]>('SELECT * FROM ticker_alerts ORDER BY id DESC');
    return NextResponse.json(alerts);
  } catch (error: any) {
    console.error('Fetch admin alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticker alerts' },
      { status: 500 }
    );
  }
}

// POST /api/admin/alerts - Add new ticker alert (Admin Secured)
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Alert text is required' },
        { status: 400 }
      );
    }

    const result = await query<any>(
      'INSERT INTO ticker_alerts (text) VALUES (?)',
      [text.trim()]
    );

    await logAction(
      req,
      session,
      'ADD',
      'Alert Ticker',
      `Created ticker alert: "${text.trim()}" (ID: ${result.insertId})`
    );

    return NextResponse.json({
      success: true,
      alertId: result.insertId,
      message: 'Ticker alert added successfully'
    });

  } catch (error: any) {
    console.error('Create admin alert error:', error);
    return NextResponse.json(
      { error: 'Failed to create ticker alert' },
      { status: 500 }
    );
  }
}
