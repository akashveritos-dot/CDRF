import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';

// GET /api/admin/councils/[id] - Fetch single council member details (Admin Secured)
export async function GET(
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

    const rows = await query<any[]>('SELECT * FROM councils WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Council member not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error('Fetch council details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch council member details' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/councils/[id] - Update a council member (Admin Secured)
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
    const {
      name,
      role,
      role_badge_color = 'default',
      avatar_initials,
      profile_image = '',
      bio,
      linkedin_url = '',
      organization = '',
      display_order = 0,
      is_active = true
    } = body;

    if (!name || !role || !avatar_initials || !bio) {
      return NextResponse.json(
        { error: 'Name, role, avatar initials, and bio are required' },
        { status: 400 }
      );
    }

    // Verify member exists
    const existing = await query<any[]>('SELECT id FROM councils WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Council member not found' }, { status: 404 });
    }

    await query(
      `UPDATE councils 
       SET name = ?, role = ?, role_badge_color = ?, avatar_initials = ?, 
           profile_image = ?, bio = ?, linkedin_url = ?, organization = ?, 
           display_order = ?, is_active = ? 
       WHERE id = ?`,
      [
        name,
        role,
        role_badge_color,
        avatar_initials,
        profile_image,
        bio,
        linkedin_url,
        organization,
        parseInt(display_order || '0', 10),
        is_active === true || is_active === 1 || is_active === 'true',
        id
      ]
    );

    await logAction(req, session, 'UPDATE', 'Councils', `Updated council member details for "${name}" (ID: ${id})`);

    return NextResponse.json({
      success: true,
      message: 'Council member updated successfully'
    });

  } catch (error: any) {
    console.error('Update council error:', error);
    return NextResponse.json(
      { error: 'Failed to update council member' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/councils/[id] - Delete a council member (SUPERADMIN ONLY)
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
    if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Only administrators can delete council members.' }, { status: 403 });
    }

    // Verify member exists
    const existing = await query<any[]>('SELECT id, name FROM councils WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Council member not found' }, { status: 404 });
    }

    const { name } = existing[0];

    await query('DELETE FROM councils WHERE id = ?', [id]);

    await logAction(req, session, 'DELETE', 'Councils', `Deleted council member: "${name}" (ID: ${id})`);

    return NextResponse.json({
      success: true,
      message: 'Council member deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete council error:', error);
    return NextResponse.json(
      { error: 'Failed to delete council member' },
      { status: 500 }
    );
  }
}
