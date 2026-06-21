import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';

const ALLOWED_TABLES = ['news', 'reports', 'gallery_items', 'councils', 'cms_pages'];

export async function PUT(req: NextRequest) {
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
    const { table, orderedIds } = body;

    if (!table || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'Table name and orderedIds array are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { error: `Reordering table "${table}" is not permitted` },
        { status: 400 }
      );
    }

    // Set display_order = index + 1 for each ID.
    // This shifts reordered items to 1, 2, 3... while leaving new/un-ordered default items at 0 (top priority)
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      await query(`UPDATE ${table} SET display_order = ? WHERE id = ?`, [i + 1, id]);
    }

    await logAction(
      req,
      session,
      'UPDATE',
      table.toUpperCase(),
      `Reordered ${orderedIds.length} items in table "${table}"`
    );

    return NextResponse.json({
      success: true,
      message: `Successfully reordered ${orderedIds.length} items in table "${table}".`
    });

  } catch (error: any) {
    console.error('Reorder API Error:', error);
    return NextResponse.json(
      { error: 'Failed to complete reordering process' },
      { status: 500 }
    );
  }
}
