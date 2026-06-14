import React from 'react';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import EventVideosClient, { PageData } from './EventVideosClient';

export default async function EventVideosPage() {
  try {
    const rows = await query<any[]>(
      "SELECT slug, title, category, description, content FROM cms_pages WHERE slug = 'event-videos'"
    );

    if (!rows || rows.length === 0) {
      notFound();
    }

    const pageData: PageData = rows[0];

    return <EventVideosClient pageData={pageData} />;
  } catch (error) {
    console.error("Failed to load event videos page server-side:", error);
    notFound();
  }
}
