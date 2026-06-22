import React from 'react';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import AboutPageClient, { PageData, CouncilMember, SectionData } from './AboutPageClient';

// Render the page fully server-side with direct database queries to eliminate client-side loading states.
export default async function AboutSubpage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;

  try {
    const rows = await query<any[]>(
      `SELECT slug, title, category, description, 
              video_url as videoUrl, image_url as imageUrl, 
              main_image_url as mainImageUrl, content 
       FROM cms_pages WHERE slug = ?`,
      [slug]
    );

    if (!rows || rows.length === 0) {
      notFound();
    }

    const pageData: PageData = rows[0];
    let councilMembers: CouncilMember[] = [];

    if (slug === 'governing-council' || slug === 'advisory-council') {
      councilMembers = await query<CouncilMember[]>(
        `SELECT 
          id,
          name,
          role,
          role_badge_color as roleBadgeColor,
          avatar_initials as avatarInitials,
          profile_image as profileImage,
          bio,
          linkedin_url as linkedinUrl,
          organization,
          display_order as displayOrder
        FROM councils 
        WHERE is_active = TRUE 
        ORDER BY display_order ASC`
      );
    }

    // Fetch sections and cards for this page
    let sections: SectionData[] = [];
    const sectionRows = await query<any[]>(
      `SELECT id, display_order as displayOrder, title, description,
              image_url as imageUrl, video_url as videoUrl, content,
              button_text as buttonText, button_url as buttonUrl
       FROM cms_page_sections WHERE page_slug = ? ORDER BY display_order ASC`,
      [slug]
    );

    if (sectionRows.length > 0) {
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

      sections = sectionRows.map((s: any) => ({
        ...s,
        cards: cardMap[s.id] || []
      }));
    }

    return <AboutPageClient slug={slug} pageData={pageData} councilMembers={councilMembers} sections={sections} />;
  } catch (error) {
    console.error(`Error loading about page server-side:`, error);
    notFound();
  }
}
