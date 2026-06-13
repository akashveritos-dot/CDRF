import { NextRequest, NextResponse } from 'next/server';
import { runScraper } from '@/lib/scraper';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET/POST /api/scrape - Run the web scraper
// Secured by either CRON secret or Admin Session Cookie
export async function GET(req: NextRequest) {
  return handleScrapeTrigger(req);
}

export async function POST(req: NextRequest) {
  return handleScrapeTrigger(req);
}

async function handleScrapeTrigger(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientSecret = url.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET || 'dcrf_cron_secret_trigger';

    let authorized = false;

    // 1. Check if cron secret matches
    if (clientSecret && clientSecret === cronSecret) {
      authorized = true;
    }

    // 2. If cron secret didn't match, check for admin session cookie (manual run)
    if (!authorized) {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      if (token) {
        const session = await verifyToken(token);
        if (session && (session.role === 'ADMIN' || session.role === 'SUPERADMIN')) {
          authorized = true;
        }
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid Cron Secret or Administrator privileges required.' },
        { status: 401 }
      );
    }

    // Run the scraper!
    const result = await runScraper();

    return NextResponse.json({
      success: true,
      message: 'Scraper task executed successfully',
      itemsScraped: result.itemsScraped,
      errors: result.errors
    });

  } catch (error: any) {
    console.error('Trigger scraper error:', error);
    return NextResponse.json(
      { error: 'Internal scraper error' },
      { status: 500 }
    );
  }
}
