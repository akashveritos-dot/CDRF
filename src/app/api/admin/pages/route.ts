import { NextRequest, NextResponse } from 'next/server';
import { query, transactionalDelete } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';

// GET all CMS pages with sections and cards
export async function GET() {
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

    const pages = await query<any[]>(
      `SELECT id, slug, title, category, description, eyebrow, 
              video_url as videoUrl, image_url as imageUrl, 
              main_image_url as mainImageUrl,
              content, updated_at as updatedAt 
       FROM cms_pages ORDER BY display_order ASC, category, title`
    );

    // Fetch all sections for all pages in one query
    const allSections = await query<any[]>(
      `SELECT id, page_slug as pageSlug, display_order as displayOrder,
              title, description, image_url as imageUrl, video_url as videoUrl,
              content, button_text as buttonText, button_url as buttonUrl
       FROM cms_page_sections ORDER BY display_order ASC`
    );

    // Fetch all cards for all sections in one query
    const allCards = await query<any[]>(
      `SELECT id, section_id as sectionId, display_order as displayOrder,
              title, description, image_url as imageUrl,
              link_text as linkText, link_url as linkUrl,
              extra_data as extraData
       FROM cms_page_cards ORDER BY display_order ASC`
    );

    // Build card map by section_id
    const cardMap: Record<number, any[]> = {};
    for (const card of allCards) {
      // Parse extra_data JSON
      if (card.extraData && typeof card.extraData === 'string') {
        try { card.extraData = JSON.parse(card.extraData); } catch { card.extraData = {}; }
      }
      if (!cardMap[card.sectionId]) cardMap[card.sectionId] = [];
      cardMap[card.sectionId].push(card);
    }

    // Build section map by page_slug
    const sectionMap: Record<string, any[]> = {};
    for (const section of allSections) {
      section.cards = cardMap[section.id] || [];
      if (!sectionMap[section.pageSlug]) sectionMap[section.pageSlug] = [];
      sectionMap[section.pageSlug].push(section);
    }

    // Attach sections to pages
    for (const page of pages) {
      page.sections = sectionMap[page.slug] || [];
    }

    return NextResponse.json(pages);
  } catch (error: any) {
    console.error('Admin fetch pages error:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}

// Helper to generate a slug from text
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// POST to update or create a page with sections and cards
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
    const { slug, title, category, description, eyebrow, videoUrl, imageUrl, mainImageUrl, content, sections } = body;

    if (!slug || !title || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await query<any[]>('SELECT id FROM cms_pages WHERE slug = ?', [slug]);
    const isUpdate = existing.length > 0;

    // Upsert the page
    await query(`
      INSERT INTO cms_pages (slug, title, category, description, eyebrow, video_url, image_url, main_image_url, content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        category = VALUES(category),
        description = VALUES(description),
        eyebrow = VALUES(eyebrow),
        video_url = VALUES(video_url),
        image_url = VALUES(image_url),
        main_image_url = VALUES(main_image_url),
        content = VALUES(content)
    `, [slug, title, category, description || null, eyebrow || null, videoUrl || null, imageUrl || null, mainImageUrl || null, content || null]);

    // Sync sections if provided
    if (sections && Array.isArray(sections)) {
      // Get existing section IDs for this page
      const existingSections = await query<any[]>(
        'SELECT id FROM cms_page_sections WHERE page_slug = ?', [slug]
      );
      const existingSectionIds = new Set(existingSections.map((s: any) => s.id));
      const incomingSectionIds = new Set(sections.filter((s: any) => s.id).map((s: any) => s.id));

      // Delete sections that were removed (cascade delete their cards too)
      for (const existingId of existingSectionIds) {
        if (!incomingSectionIds.has(existingId)) {
          await query('DELETE FROM cms_page_cards WHERE section_id = ?', [existingId]);
          await query('DELETE FROM cms_page_sections WHERE id = ?', [existingId]);
        }
      }

      // Upsert each section
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionSlug = section.title ? toSlug(section.title) : `section-${i + 1}`;
        
        // Auto-generate button URL if not provided but button text exists
        let buttonUrl = section.buttonUrl || null;
        if (section.buttonText && !buttonUrl) {
          buttonUrl = `/${category}/${slug}#${sectionSlug}`;
        }

        let sectionId: number;

        if (section.id && existingSectionIds.has(section.id)) {
          // Update existing section
          await query(`
            UPDATE cms_page_sections SET
              display_order = ?, title = ?, description = ?, image_url = ?,
              video_url = ?, content = ?, button_text = ?, button_url = ?
            WHERE id = ?
          `, [
            i, section.title || null, section.description || null, section.imageUrl || null,
            section.videoUrl || null, section.content || null, section.buttonText || null,
            buttonUrl, section.id
          ]);
          sectionId = section.id;
        } else {
          // Insert new section
          const result = await query<any>(`
            INSERT INTO cms_page_sections (page_slug, display_order, title, description, image_url, video_url, content, button_text, button_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            slug, i, section.title || null, section.description || null, section.imageUrl || null,
            section.videoUrl || null, section.content || null, section.buttonText || null,
            buttonUrl
          ]);
          sectionId = result.insertId;
        }

        // Sync cards for this section
        const cards = section.cards || [];
        
        // Get existing cards for this section
        const existingCards = await query<any[]>(
          'SELECT id FROM cms_page_cards WHERE section_id = ?', [sectionId]
        );
        const existingCardIds = new Set(existingCards.map((c: any) => c.id));
        const incomingCardIds = new Set(cards.filter((c: any) => c.id).map((c: any) => c.id));

        // Delete removed cards
        for (const existingCardId of existingCardIds) {
          if (!incomingCardIds.has(existingCardId)) {
            await transactionalDelete('cms_page_cards', 'id', existingCardId, session);
          }
        }

        // Upsert each card
        for (let j = 0; j < cards.length; j++) {
          const card = cards[j];
          
          // Auto-generate link URL if link text exists but no URL
          let linkUrl = card.linkUrl || null;
          if (card.linkText && !linkUrl) {
            const cardSlug = card.title ? toSlug(card.title) : `card-${j + 1}`;
            linkUrl = `/${category}/${slug}#${cardSlug}`;
          }

          if (card.id && existingCardIds.has(card.id)) {
            await query(`
              UPDATE cms_page_cards SET
                display_order = ?, title = ?, description = ?, image_url = ?,
                link_text = ?, link_url = ?, extra_data = ?
              WHERE id = ?
            `, [j, card.title || null, card.description || null, card.imageUrl || null,
                card.linkText || null, linkUrl, card.extraData ? JSON.stringify(card.extraData) : '{}', card.id]);
          } else {
            await query(`
              INSERT INTO cms_page_cards (section_id, display_order, title, description, image_url, link_text, link_url, extra_data)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [sectionId, j, card.title || null, card.description || null, card.imageUrl || null,
                card.linkText || null, linkUrl, card.extraData ? JSON.stringify(card.extraData) : '{}']);
          }
        }
      }
    }

    await logAction(
      req,
      session,
      isUpdate ? 'UPDATE' : 'ADD',
      'CMS Pages',
      `${isUpdate ? 'Updated' : 'Created'} CMS page: "${title}" (Slug: ${slug})`
    );

    return NextResponse.json({ success: true, message: 'Page content updated successfully' });
  } catch (error: any) {
    console.error('Admin save page error:', error);
    return NextResponse.json({ error: 'Failed to save page' }, { status: 500 });
  }
}

// DELETE a page
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Only administrators can delete pages' }, { status: 403 });
    }

    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Delete cards for all sections of this page
    const sections = await query<any[]>('SELECT id FROM cms_page_sections WHERE page_slug = ?', [slug]);
    for (const section of sections) {
      const cards = await query<any[]>('SELECT id FROM cms_page_cards WHERE section_id = ?', [section.id]);
      for (const card of cards) {
        await transactionalDelete('cms_page_cards', 'id', card.id, session);
      }
      await transactionalDelete('cms_page_sections', 'id', section.id, session);
    }
    // Delete the page
    await transactionalDelete('cms_pages', 'slug', slug, session);

    await logAction(req, session, 'DELETE', 'CMS Pages', `Deleted CMS page: "${slug}"`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete page error:', error);
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}
