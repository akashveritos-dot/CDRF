import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/news - Fetch all news stories
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    
    let sql = 'SELECT * FROM news ORDER BY published_date DESC, id DESC';
    let params: any[] = [];
    
    if (category && category.toLowerCase() !== 'all') {
      sql = 'SELECT * FROM news WHERE category = ? ORDER BY published_date DESC, id DESC';
      params = [category.toLowerCase()];
    }

    const stories = await query<any[]>(sql, params);
    
    // Format stories for frontend compatibility (e.g. format SQL date objects to string)
    const formatted = stories.map(story => ({
      ...story,
      date: new Date(story.published_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }));

    return new NextResponse(JSON.stringify(formatted), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
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
    if (!session || session.role !== 'ADMIN') {
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
      category
    } = body;

    if (!headline || !excerpt || !category) {
      return NextResponse.json(
        { error: 'Headline, excerpt, and category are required' },
        { status: 400 }
      );
    }

    const dateVal = published_date || new Date().toISOString().split('T')[0];

    const result = await query<any>(
      `INSERT INTO news (tag, source, headline, excerpt, full_content, published_date, author, external_link, thumbnail_emoji, image_url, category) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tag || 'Breaking',
        source || 'dcrf.org',
        headline,
        excerpt,
        full_content || '',
        dateVal,
        author || 'Editor, DCRF',
        external_link || '',
        thumbnail_emoji || '📰',
        image_url || '',
        category.toLowerCase()
      ]
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
