import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// POST a new gallery item
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
    const { imageUrl, caption, content, displayOrder = 0 } = body;

    if (!imageUrl || !caption) {
      return NextResponse.json({ error: 'Image URL and Caption are required' }, { status: 400 });
    }

    await query(
      'INSERT INTO gallery_items (image_url, caption, content, display_order) VALUES (?, ?, ?, ?)',
      [imageUrl, caption, content || null, displayOrder]
    );

    return NextResponse.json({ success: true, message: 'Gallery item added successfully' });
  } catch (error: any) {
    console.error('Admin add gallery error:', error);
    return NextResponse.json({ error: 'Failed to add gallery item' }, { status: 500 });
  }
}

// DELETE a gallery item
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    await query('DELETE FROM gallery_items WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'Gallery item deleted successfully' });
  } catch (error: any) {
    console.error('Admin delete gallery error:', error);
    return NextResponse.json({ error: 'Failed to delete gallery item' }, { status: 500 });
  }
}
