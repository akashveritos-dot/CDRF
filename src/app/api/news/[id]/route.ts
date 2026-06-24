import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';
import { rewriteUploadUrls } from '@/lib/url-rewriter';

// GET /api/news/[id] - Fetch single news story
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    const stories = await query<any[]>('SELECT * FROM news WHERE id = ? LIMIT 1', [id]);

    if (stories.length === 0) {
      return NextResponse.json({ error: 'News story not found' }, { status: 404 });
    }

    const [story] = stories;
    const formatted = {
      ...story,
      date: new Date(story.published_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    };

    // Rewrite /uploads/ URLs to secure /api/files/ URLs
    return NextResponse.json(rewriteUploadUrls(formatted));
  } catch (error: any) {
    console.error('Fetch news details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news details' },
      { status: 500 }
    );
  }
}

// PUT /api/news/[id] - Update a news story (Admin Secured)
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
      tag,
      source,
      headline,
      excerpt,
      full_content,
      published_date,
      author,
      external_link,
      thumbnail_emoji,
      image_url,
      category,
      gallery_images
    } = body;

    if (!headline || !excerpt || !category) {
      return NextResponse.json(
        { error: 'Headline, excerpt, and category are required' },
        { status: 400 }
      );
    }

    // Verify item exists
    const existing = await query<any[]>('SELECT id FROM news WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'News story not found' }, { status: 404 });
    }

    const dateVal = published_date ? published_date.split('T')[0] : new Date().toISOString().split('T')[0];
    const galleryImagesJson = gallery_images ? JSON.stringify(gallery_images) : '[]';

    await query(
      `UPDATE news 
       SET tag = ?, source = ?, headline = ?, excerpt = ?, full_content = ?, 
           published_date = ?, author = ?, external_link = ?, thumbnail_emoji = ?, 
           image_url = ?, category = ?, gallery_images = ? 
       WHERE id = ?`,
      [
        tag,
        source,
        headline,
        excerpt,
        full_content || '',
        dateVal,
        author,
        external_link || '',
        thumbnail_emoji,
        image_url || '',
        category.toLowerCase(),
        galleryImagesJson,
        id
      ]
    );

    await logAction(
      req,
      session,
      'UPDATE',
      'News',
      `Updated news story: "${headline}" (ID: ${id})`
    );

    return NextResponse.json({
      success: true,
      message: 'News story updated successfully'
    });

  } catch (error: any) {
    console.error('Update news error:', error);
    return NextResponse.json(
      { error: 'Failed to update news story' },
      { status: 500 }
    );
  }
}

// DELETE /api/news/[id] - Delete a news story (SUPERADMIN ONLY)
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
    // Only SUPERADMIN can delete
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden. Only SUPERADMIN can delete content.' }, { status: 403 });
    }

    // Verify item exists
    const existing = await query<any[]>('SELECT id, headline FROM news WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'News story not found' }, { status: 404 });
    }

    const [story] = existing;
    const headline = story.headline || `ID ${id}`;

    await query('DELETE FROM news WHERE id = ?', [id]);

    await logAction(
      req,
      session,
      'DELETE',
      'News',
      `Deleted news story: "${headline}" (ID: ${id})`
    );

    return NextResponse.json({
      success: true,
      message: 'News story deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete news error:', error);
    return NextResponse.json(
      { error: 'Failed to delete news story' },
      { status: 500 }
    );
  }
}
