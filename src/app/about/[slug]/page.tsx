import React from 'react';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import AboutPageClient, { PageData, CouncilMember } from './AboutPageClient';

// Render the page fully server-side with direct database queries to eliminate client-side loading states.
export default async function AboutSubpage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;

  try {
    const rows = await query<any[]>(
      'SELECT slug, title, category, description, video_url as videoUrl, image_url as imageUrl, content FROM cms_pages WHERE slug = ?',
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

    return <AboutPageClient slug={slug} pageData={pageData} councilMembers={councilMembers} />;
  } catch (error) {
    console.error(`Error loading about page server-side:`, error);
    notFound();
  }
}
