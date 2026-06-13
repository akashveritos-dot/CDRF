import { NextRequest, NextResponse } from 'next/server';
import { runScraper } from '@/lib/scraper';
import { query } from '@/lib/db';

// POST /api/admin/scrape/run  — trigger scraper and return diff stats
export async function POST(req: NextRequest) {
  try {
    // Count news + reports before scrape
    const [newsBefore] = await query<any[]>('SELECT COUNT(*) as c FROM news');
    const [reportsBefore] = await query<any[]>('SELECT COUNT(*) as c FROM reports');
    const newsCountBefore = newsBefore?.c ?? 0;
    const reportsCountBefore = reportsBefore?.c ?? 0;

    const result = await runScraper();

    // Count news + reports after scrape
    const [newsAfter] = await query<any[]>('SELECT COUNT(*) as c FROM news');
    const [reportsAfter] = await query<any[]>('SELECT COUNT(*) as c FROM reports');
    const newNewsCount = (newsAfter?.c ?? 0) - newsCountBefore;
    const newReportsCount = (reportsAfter?.c ?? 0) - reportsCountBefore;

    return NextResponse.json({
      success: result.success,
      itemsScraped: result.itemsScraped,
      newNewsPublished: newNewsCount,
      newReportsPublished: newReportsCount,
      errors: result.errors,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Scraper run error:', error);
    return NextResponse.json({ error: 'Scraper failed', detail: 'Failed to complete scrape process. Please try again later.' }, { status: 500 });
  }
}

// GET /api/admin/scrape/run — poll latest scrape stats (non-destructive)
export async function GET(req: NextRequest) {
  try {
    const [newsRow] = await query<any[]>('SELECT COUNT(*) as c, MAX(id) as latest_id FROM news');
    const [reportsRow] = await query<any[]>('SELECT COUNT(*) as c, MAX(id) as latest_id FROM reports');
    return NextResponse.json({
      newsCount: newsRow?.c ?? 0,
      reportsCount: reportsRow?.c ?? 0,
      latestNewsId: newsRow?.latest_id ?? 0,
      latestReportsId: reportsRow?.latest_id ?? 0,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to get counts' }, { status: 500 });
  }
}
