import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/admin/scrape - Fetch all scraped articles in the queue
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'Pending'; // Default to Pending
    
    let sql = 'SELECT * FROM scraped_content';
    const params: any[] = [];
    
    if (status && status !== 'All') {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY scrape_date DESC';

    const items = await query<any[]>(sql, params);
    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Fetch scraped queue error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve scraped queue' },
      { status: 500 }
    );
  }
}
