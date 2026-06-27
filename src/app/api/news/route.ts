import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';
import { rewriteUploadUrls } from '@/lib/url-rewriter';

// GET /api/news - Fetch news stories
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '0', 10);
    const afterId = parseInt(url.searchParams.get('after_id') || '0', 10);
    
    let sql = 'SELECT * FROM news';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (category && category.toLowerCase() !== 'all') {
      conditions.push('category = ?');
      params.push(category.toLowerCase());
    }
    if (afterId > 0) {
      conditions.push('id > ?');
      params.push(afterId);
    }
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY is_manual DESC, display_order ASC, published_date DESC, id DESC';
    if (limit > 0) {
      sql += ' LIMIT ?';
      params.push(limit);
    }

    const stories = await query<any[]>(sql, params);
    
    // Format stories for frontend compatibility
    const formatted = stories.map(story => ({
      ...story,
      date: new Date(story.published_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }));

    // Rewrite /uploads/ URLs to secure /api/files/ URLs
    const secureFormatted = rewriteUploadUrls(formatted);

    return new NextResponse(JSON.stringify(secureFormatted), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: any) {
    console.error('Fetch news error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

// POST /api/news - Create a news story (Admin Secured)
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
    const {
      tag,
      source,
      headline,
      excerpt,
      full_content,
      published_date, // 'YYYY-MM-DD'
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

    const dateVal = published_date || new Date().toISOString().split('T')[0];
    const galleryImagesJson = gallery_images ? JSON.stringify(gallery_images) : '[]';

    const result = await query<any>(
      `INSERT INTO news (tag, source, headline, excerpt, full_content, published_date, author, external_link, thumbnail_emoji, image_url, category, gallery_images, is_manual) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        tag || 'Breaking',
        source || 'cdrf.vercel.app',
        headline,
        excerpt,
        full_content || '',
        dateVal,
        author || 'Editor, DCRF',
        external_link || '',
        thumbnail_emoji || '📰',
        image_url || '',
        category.toLowerCase(),
        galleryImagesJson
      ]
    );

    await logAction(
      req,
      session,
      'ADD',
      'News',
      `Created news story: "${headline}" (ID: ${result.insertId})`
    );

    return NextResponse.json({
      success: true,
      newsId: result.insertId,
      message: 'News story created successfully'
    });

  } catch (error: any) {
    console.error('Create news error:', error);
    return NextResponse.json(
      { error: 'Failed to create news story' },
      { status: 500 }
    );
  }
}
