import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';

// GET /api/reports - Fetch all research reports
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    
    let sql = 'SELECT * FROM reports ORDER BY year DESC, id DESC';
    let params: any[] = [];
    
    if (category && category.toLowerCase() !== 'all') {
      sql = 'SELECT * FROM reports WHERE category = ? ORDER BY year DESC, id DESC';
      params = [category];
    }

    const reportsList = await query<any[]>(sql, params);
    return new NextResponse(JSON.stringify(reportsList), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    });
  } catch (error: any) {
    console.error('Fetch reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a report (Admin Secured)
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
      title,
      category,
      description,
      page_count,
      year,
      download_url,
      accent_color,
      icon,
      image_url
    } = body;

    if (!title || !category || !description) {
      return NextResponse.json(
        { error: 'Title, category, and description are required' },
        { status: 400 }
      );
    }

    const result = await query<any>(
      `INSERT INTO reports (title, category, description, page_count, year, download_url, accent_color, icon, image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        category,
        description,
        parseInt(page_count || '0', 10),
        parseInt(year || new Date().getFullYear().toString(), 10),
        download_url || '#',
        accent_color || '#FDECEA',
        icon || '📙',
        image_url || ''
      ]
    );

    await logAction(
      req,
      session,
      'ADD',
      'Reports',
      `Created research report: "${title}" (ID: ${result.insertId})`
    );

    return NextResponse.json({
      success: true,
      reportId: result.insertId,
      message: 'Report created successfully'
    });

  } catch (error: any) {
    console.error('Create report error:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
