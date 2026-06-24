import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { rewriteUploadUrls } from '@/lib/url-rewriter';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await props.params;
    const { slug } = params;
    const rows = await query<any[]>(
      `SELECT slug, title, category, description, 
              video_url as videoUrl, image_url as imageUrl, 
              main_image_url as mainImageUrl, content 
       FROM cms_pages WHERE slug = ?`,
      [slug]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const page = rows[0];

    // Fetch sections for this page
    const sections = await query<any[]>(
      `SELECT id, display_order as displayOrder, title, description,
              image_url as imageUrl, video_url as videoUrl, content,
              button_text as buttonText, button_url as buttonUrl
       FROM cms_page_sections WHERE page_slug = ? ORDER BY display_order ASC`,
      [slug]
    );

    // Fetch cards for all sections
    if (sections.length > 0) {
      const sectionIds = sections.map((s: any) => s.id);
      const placeholders = sectionIds.map(() => '?').join(',');
      const cards = await query<any[]>(
        `SELECT id, section_id as sectionId, display_order as displayOrder,
                title, description, image_url as imageUrl,
                link_text as linkText, link_url as linkUrl,
                extra_data as extraData
         FROM cms_page_cards WHERE section_id IN (${placeholders}) ORDER BY display_order ASC`,
        sectionIds
      );

      // Attach cards to sections
      const cardMap: Record<number, any[]> = {};
      for (const card of cards) {
        if (card.extraData && typeof card.extraData === 'string') {
          try { card.extraData = JSON.parse(card.extraData); } catch { card.extraData = {}; }
        }
        if (!cardMap[card.sectionId]) cardMap[card.sectionId] = [];
        cardMap[card.sectionId].push(card);
      }
      for (const section of sections) {
        section.cards = cardMap[section.id] || [];
      }
    }

    page.sections = sections;

    // Rewrite /uploads/ URLs to secure /api/files/ URLs in all page data
    return NextResponse.json(rewriteUploadUrls(page));
  } catch (error: any) {
    console.error('Error fetching dynamic page data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page data' },
      { status: 500 }
    );
  }
}
