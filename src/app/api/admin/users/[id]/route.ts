import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';

// PUT - Update user (SUPERADMIN only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Access denied. SUPERADMIN only.' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await req.json();
    const { email, name, role, is_active } = body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (email !== undefined) {
      // Check if email is already taken by another user
      const existing = await query<any[]>(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
      updates.push('email = ?');
      values.push(email);
    }

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }

    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    values.push(userId);

    const existingUserRes = await query<any[]>('SELECT email, name FROM users WHERE id = ?', [userId]);
    if (existingUserRes.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const oldUser = existingUserRes[0];

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const changes = Object.keys(body).filter(k => body[k] !== undefined).map(k => `${k}: ${body[k]}`).join(', ');

    await logAction(
      req,
      session,
      'UPDATE',
      'Users',
      `Updated user: ${oldUser.name} (${oldUser.email}) - changes: [${changes}]`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete user (SUPERADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Access denied. SUPERADMIN only.' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Prevent deleting yourself
    if (session.userId === userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    const existingUserRes = await query<any[]>('SELECT email, name FROM users WHERE id = ?', [userId]);
    if (existingUserRes.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const oldUser = existingUserRes[0];

    // Delete user
    await query('DELETE FROM users WHERE id = ?', [userId]);

    await logAction(
      req,
      session,
      'DELETE',
      'Users',
      `Deleted user: ${oldUser.name} (${oldUser.email})`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
