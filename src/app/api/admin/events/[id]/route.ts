import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/admin/events/[id] - Fetch single conclave registration details (Admin Secured)
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

    const rows = await query<any[]>('SELECT * FROM event_registrations WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error('Fetch registration details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration details' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/events/[id] - Update registration status (Admin Secured)
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
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status parameter is required' },
        { status: 400 }
      );
    }

    // Verify registration exists
    const existing = await query<any[]>('SELECT id FROM event_registrations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    await query(
      'UPDATE event_registrations SET status = ? WHERE id = ?',
      [status, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Registration status updated successfully'
    });

  } catch (error: any) {
    console.error('Update registration error:', error);
    return NextResponse.json(
      { error: 'Failed to update registration status' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/events/[id] - Delete registration record (SUPERADMIN ONLY)
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
    // Only SUPERADMIN can delete records
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden. Only SUPERADMIN can delete registrations.' }, { status: 403 });
    }

    // Verify registration exists
    const existing = await query<any[]>('SELECT id FROM event_registrations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    await query('DELETE FROM event_registrations WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Registration deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete registration error:', error);
    return NextResponse.json(
      { error: 'Failed to delete registration record' },
      { status: 500 }
    );
  }
}
