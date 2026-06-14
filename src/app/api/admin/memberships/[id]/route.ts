import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';

// PUT /api/admin/memberships/[id] - Update registration status and payment logs
export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
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
    const { status, pay_status, payment_details } = body;

    if (!status || !pay_status) {
      return NextResponse.json(
        { error: 'Status and payment status are required' },
        { status: 400 }
      );
    }

    // Verify application exists
    const existing = await query<any[]>('SELECT id, name, email FROM memberships WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Membership application not found' }, { status: 404 });
    }

    await query(
      `UPDATE memberships 
       SET status = ?, pay_status = ?, payment_details = ? 
       WHERE id = ?`,
      [status, pay_status, payment_details || '', id]
    );

    const [member] = existing;
    await logAction(
      req,
      session,
      'UPDATE',
      'Memberships',
      `Updated membership application for ${member.name} (${member.email}) - Status: ${status}, Payment: ${pay_status}`
    );

    return NextResponse.json({
      success: true,
      message: 'Membership application updated successfully'
    });

  } catch (error: any) {
    console.error('Update membership error:', error);
    return NextResponse.json(
      { error: 'Failed to update membership application' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/memberships/[id] - Delete application record
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify application exists
    const existing = await query<any[]>('SELECT id, name, email FROM memberships WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Membership application not found' }, { status: 404 });
    }

    const [member] = existing;

    await query('DELETE FROM memberships WHERE id = ?', [id]);

    await logAction(
      req,
      session,
      'DELETE',
      'Memberships',
      `Deleted membership application for ${member.name} (${member.email})`
    );

    return NextResponse.json({
      success: true,
      message: 'Membership application deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete membership error:', error);
    return NextResponse.json(
      { error: 'Failed to delete membership record' },
      { status: 500 }
    );
  }
}
