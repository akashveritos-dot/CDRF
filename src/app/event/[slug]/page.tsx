import React from 'react';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import EventPageClient, { PageData } from './EventPageClient';

export const dynamic = 'force-dynamic';

// Render the page fully server-side with direct database queries to eliminate client-side loading states.
export default async function EventSubpage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;

  try {
    const rows = await query<any[]>(
      'SELECT slug, title, category, description, eyebrow, video_url as videoUrl, image_url as imageUrl, content FROM cms_pages WHERE slug = ?',
      [slug]
    );

    if (!rows || rows.length === 0) {
      notFound();
    }

    const pageData: any = rows[0];

    // Fetch sections and cards for this page
    const sectionRows = await query<any[]>(
      `SELECT id, display_order as displayOrder, title, description,
              image_url as imageUrl, video_url as videoUrl, content,
              button_text as buttonText, button_url as buttonUrl
       FROM cms_page_sections WHERE page_slug = ? ORDER BY display_order ASC`,
      [slug]
    );

    if (sectionRows.length > 0) {
      // Self-healing check: ensure 'Description' card exists in 'Conclave Details' section for 'dcrc-26'
      if (slug === 'dcrc-26') {
        const conclaveDetailsSec = sectionRows.find((s: any) => s.title === 'Conclave Details');
        if (conclaveDetailsSec) {
          try {
            const descCards = await query<any[]>(
              `SELECT id FROM cms_page_cards WHERE section_id = ? AND LOWER(title) = 'description'`,
              [conclaveDetailsSec.id]
            );
            if (!descCards || descCards.length === 0) {
              await query(
                `INSERT INTO cms_page_cards (section_id, display_order, title, description, image_url, link_text, link_url, extra_data)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  conclaveDetailsSec.id,
                  3, // display_order after Date (0), Venue (1), Location (2)
                  'Description',
                  "Disaster & Climate Resilience Conclave 2026 is India's premier multi-stakeholder alliance driving convergence across climate science, media coordinates, and corporate social investments.",
                  '',
                  '',
                  '',
                  '{}'
                ]
              );
              console.log('[SELF-HEALING] Seeded missing Description card in Conclave Details section.');
            }
          } catch (err) {
            console.error('[SELF-HEALING ERROR] Failed to seed Conclave Details Description:', err);
          }
        }
      }

      const sectionIds = sectionRows.map((s: any) => s.id);
      const placeholders = sectionIds.map(() => '?').join(',');
      const cardRows = await query<any[]>(
        `SELECT id, section_id as sectionId, display_order as displayOrder,
                title, description, image_url as imageUrl,
                link_text as linkText, link_url as linkUrl,
                extra_data as extraData
         FROM cms_page_cards WHERE section_id IN (${placeholders}) ORDER BY display_order ASC`,
        sectionIds
      );

      const cardMap: Record<number, any[]> = {};
      for (const card of cardRows) {
        if (card.extraData && typeof card.extraData === 'string') {
          try { card.extraData = JSON.parse(card.extraData); } catch { card.extraData = {}; }
        }
        if (!cardMap[card.sectionId]) cardMap[card.sectionId] = [];
        cardMap[card.sectionId].push(card);
      }

      pageData.sections = sectionRows.map((s: any) => ({
        ...s,
        cards: cardMap[s.id] || []
      }));
    } else {
      pageData.sections = [];
    }

    return <EventPageClient slug={slug} pageData={pageData} />;
  } catch (error) {
    console.error(`Error loading event page server-side:`, error);
    notFound();
  }
}
