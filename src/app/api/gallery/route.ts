import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query<any[]>(
      'SELECT id, image_url as imageUrl, caption, content, created_at as createdAt FROM gallery_items ORDER BY display_order ASC, id DESC'
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Fetch gallery items error:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery items' }, { status: 500 });
  }
}
