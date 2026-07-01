import React from 'react';
import { query } from '@/lib/db';
import NewsPageClient from './NewsPageClient';

export const dynamic = 'force-dynamic';

interface SearchParams {
  page?: string;
  category?: string;
}

export default async function NewsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10));
  const category = resolvedParams.category || 'All';
  const limit = 20;
  const offset = (page - 1) * limit;

  let stories: any[] = [];
  let totalCount = 0;

  try {
    let whereClause = '';
    let queryParams: any[] = [];

    if (category !== 'All') {
      if (category.toLowerCase() === 'health crisis') {
        whereClause = ' WHERE tag = ? OR category = ? OR tag = ? OR category = ?';
        queryParams = ['Health Crisis', 'Health Crisis', 'Health', 'Health'];
      } else {
        whereClause = ' WHERE tag = ? OR category = ?';
        queryParams = [category, category];
      }
    }

    // 1. Fetch total count of matched records for pagination calculation
    const countQuery = `SELECT COUNT(*) as count FROM news${whereClause}`;
    const countRows = await query<any[]>(countQuery, queryParams);
    totalCount = countRows[0]?.count || 0;

    // 2. Fetch limit/offset records from database
    const fetchQuery = `SELECT * FROM news${whereClause} ORDER BY published_date DESC, id DESC LIMIT ${limit} OFFSET ${offset}`;
    const rawStories = await query<any[]>(fetchQuery, queryParams);

    if (Array.isArray(rawStories)) {
      stories = rawStories.map(story => {
        const plainStory = JSON.parse(JSON.stringify(story));
        return {
          ...plainStory,
          date: plainStory.published_date
            ? new Date(plainStory.published_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : ''
        };
      });
    }
  } catch (err) {
    console.error('Failed to load news stories server-side:', err);
  }

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <NewsPageClient
      initialStories={stories}
      currentPage={page}
      totalPages={totalPages}
      currentCategory={category}
    />
  );
}
