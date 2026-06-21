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
      'SELECT slug, title, category, description, video_url as videoUrl, image_url as imageUrl, content FROM cms_pages WHERE slug = ?',
      [slug]
    );

    if (!rows || rows.length === 0) {
      notFound();
    }

    const pageData: PageData = rows[0];

    return <EventPageClient slug={slug} pageData={pageData} />;
  } catch (error) {
    console.error(`Error loading event page server-side:`, error);
    notFound();
  }
}
