import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/reports/[id] - Fetch single report details
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    const reportsList = await query<any[]>('SELECT * FROM reports WHERE id = ? LIMIT 1', [id]);

    if (reportsList.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(reportsList[0]);
  } catch (error: any) {
    console.error('Fetch report details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report details' },
      { status: 500 }
    );
  }
}

// PUT /api/reports/[id] - Update a report (Admin Secured)
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
    const {
      title,
      category,
      description,
      page_count,
      year,
      download_url,
      accent_color,
      icon,
      image_url
    } = body;

    if (!title || !category || !description) {
      return NextResponse.json(
        { error: 'Title, category, and description are required' },
        { status: 400 }
      );
    }

    // Verify item exists
    const existing = await query<any[]>('SELECT id FROM reports WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    await query(
      `UPDATE reports 
       SET title = ?, category = ?, description = ?, page_count = ?, 
           year = ?, download_url = ?, accent_color = ?, icon = ?, image_url = ? 
       WHERE id = ?`,
      [
        title,
        category,
        description,
        parseInt(page_count || '0', 10),
        parseInt(year || new Date().getFullYear().toString(), 10),
        download_url || '#',
        accent_color || '#FDECEA',
        icon || '📙',
        image_url || '',
        id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Report updated successfully'
    });

  } catch (error: any) {
    console.error('Update report error:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - Delete a report (Admin Secured)
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
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify item exists
    const existing = await query<any[]>('SELECT id FROM reports WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    await query('DELETE FROM reports WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete report error:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
