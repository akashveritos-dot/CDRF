import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/admin/alerts/[id] - Fetch single ticker alert (Admin Secured)
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rows = await query<any[]>('SELECT * FROM ticker_alerts WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Ticker alert not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error('Fetch admin alert details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticker alert details' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/alerts/[id] - Update a ticker alert (Admin Secured)
export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
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

    // Verify alert exists
    const existing = await query<any[]>('SELECT id FROM ticker_alerts WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Ticker alert not found' }, { status: 404 });
    }

    await query(
      'UPDATE ticker_alerts SET text = ? WHERE id = ?',
      [text.trim(), id]
    );

    return NextResponse.json({
      success: true,
      message: 'Ticker alert updated successfully'
    });

  } catch (error: any) {
    console.error('Update admin alert error:', error);
    return NextResponse.json(
      { error: 'Failed to update ticker alert' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/alerts/[id] - Delete a ticker alert (SUPERADMIN ONLY)
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    // Only SUPERADMIN can delete alerts
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden. Only SUPERADMIN can delete ticker alerts.' }, { status: 403 });
    }

    // Verify alert exists
    const existing = await query<any[]>('SELECT id FROM ticker_alerts WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Ticker alert not found' }, { status: 404 });
    }

    await query('DELETE FROM ticker_alerts WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Ticker alert deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete admin alert error:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticker alert' },
      { status: 500 }
    );
  }
}
