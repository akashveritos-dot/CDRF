import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';

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
    const { actionType, data } = body;

    if (actionType === 'section') {
      const { page_slug, title, description, content, button_text, button_url } = data;
      if (!page_slug || !title) {
        return NextResponse.json({ error: 'Page slug and section title are required' }, { status: 400 });
      }

      // Check if page exists
      const pageRows = await query<any[]>('SELECT slug FROM cms_pages WHERE slug = ?', [page_slug]);
      if (pageRows.length === 0) {
        return NextResponse.json({ error: `Page with slug "${page_slug}" does not exist` }, { status: 400 });
      }

      // Find max display_order for this page
      const maxOrderRow = await query<any[]>(
        'SELECT MAX(display_order) as maxOrder FROM cms_page_sections WHERE page_slug = ?',
        [page_slug]
      );
      const displayOrder = (maxOrderRow[0]?.maxOrder !== null ? maxOrderRow[0]?.maxOrder : -1) + 1;

      // Insert section
      const insertResult = await query<any>(
        `INSERT INTO cms_page_sections (page_slug, display_order, title, description, content, button_text, button_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [page_slug, displayOrder, title, description || null, content || null, button_text || null, button_url || null]
      );

      await logAction(
        req,
        session,
        'ADD',
        'CMS Page Sections',
        `Created section "${title}" under page "${page_slug}" via AI Chatbot`
      );

      return NextResponse.json({
        success: true,
        message: `Section "${title}" successfully created under page "${page_slug}".`,
        insertId: insertResult.insertId
      });
    } 
    
    if (actionType === 'card') {
      const { page_slug, section_title, title, description, image_url, link_text, link_url } = data;
      if (!page_slug || !section_title || !title) {
        return NextResponse.json({ error: 'Page slug, section title, and card title are required' }, { status: 400 });
      }

      // Find the section ID
      const sectionRows = await query<any[]>(
        'SELECT id FROM cms_page_sections WHERE page_slug = ? AND title = ? LIMIT 1',
        [page_slug, section_title]
      );

      if (sectionRows.length === 0) {
        return NextResponse.json({ error: `Section "${section_title}" not found on page "${page_slug}"` }, { status: 400 });
      }

      const sectionId = sectionRows[0].id;

      // Find max display_order for this section
      const maxOrderRow = await query<any[]>(
        'SELECT MAX(display_order) as maxOrder FROM cms_page_cards WHERE section_id = ?',
        [sectionId]
      );
      const displayOrder = (maxOrderRow[0]?.maxOrder !== null ? maxOrderRow[0]?.maxOrder : -1) + 1;

      // Insert card
      const insertResult = await query<any>(
        `INSERT INTO cms_page_cards (section_id, display_order, title, description, image_url, link_text, link_url, extra_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [sectionId, displayOrder, title, description || null, image_url || null, link_text || null, link_url || null, '{}']
      );

      await logAction(
        req,
        session,
        'ADD',
        'CMS Page Cards',
        `Created card "${title}" in section "${section_title}" (page: "${page_slug}") via AI Chatbot`
      );

      return NextResponse.json({
        success: true,
        message: `Card "${title}" successfully created in section "${section_title}".`,
        insertId: insertResult.insertId
      });
    }

    return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
  } catch (error: any) {
    console.error('AI Action execution error:', error);
    return NextResponse.json({ error: 'Failed to execute action' }, { status: 500 });
  }
}
