import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { rewriteUploadUrls } from '@/lib/url-rewriter';

export async function GET() {
  try {
    const rows = await query<any[]>(
      'SELECT id, image_url as imageUrl, caption, content, designation, person_name as personName, created_at as createdAt FROM gallery_items ORDER BY display_order ASC, id DESC'
    );
    // Rewrite /uploads/ URLs to secure /api/files/ URLs
    const secureRows = rewriteUploadUrls(rows);
    return NextResponse.json(secureRows);
  } catch (error: any) {
    console.error('Fetch gallery items error:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery items' }, { status: 500 });
  }
}
