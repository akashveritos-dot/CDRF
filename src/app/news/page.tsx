import React from 'react';
import { query } from '@/lib/db';
import NewsPageClient from './NewsPageClient';

export default async function NewsPage() {
  let stories: any[] = [];
  try {
    const rawStories = await query<any[]>('SELECT * FROM news ORDER BY published_date DESC, id DESC');
    if (Array.isArray(rawStories)) {
      stories = rawStories.map(story => ({
        ...story,
        date: new Date(story.published_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }));
    }
  } catch (err) {
    console.error('Failed to load news stories server-side:', err);
  }

  return <NewsPageClient initialStories={stories} />;
}
