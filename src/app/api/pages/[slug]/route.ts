import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await props.params;
    const { slug } = params;
    const rows = await query<any[]>(
      'SELECT slug, title, category, description, video_url as videoUrl, image_url as imageUrl, content FROM cms_pages WHERE slug = ?',
      [slug]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error('Error fetching dynamic page data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page data' },
      { status: 500 }
    );
  }
}
