import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET all CMS pages
export async function GET() {
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

    const rows = await query<any[]>(
      'SELECT id, slug, title, category, description, video_url as videoUrl, image_url as imageUrl, content, updated_at as updatedAt FROM cms_pages ORDER BY category, title'
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Admin fetch pages error:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}

// POST to update or create a page
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
    const { slug, title, category, description, videoUrl, imageUrl, content } = body;

    if (!slug || !title || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await query(`
      INSERT INTO cms_pages (slug, title, category, description, video_url, image_url, content)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        category = VALUES(category),
        description = VALUES(description),
        video_url = VALUES(video_url),
        image_url = VALUES(image_url),
        content = VALUES(content)
    `, [slug, title, category, description || null, videoUrl || null, imageUrl || null, content || null]);

    return NextResponse.json({ success: true, message: 'Page content updated successfully' });
  } catch (error: any) {
    console.error('Admin save page error:', error);
    return NextResponse.json({ error: 'Failed to save page' }, { status: 500 });
  }
}
