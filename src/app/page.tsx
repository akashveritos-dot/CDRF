import React from 'react';
import HomeClient from './HomeClient';
import { query } from '@/lib/db';
import {
  councilMembers as fallbackCouncilMembers
} from '@/data/dataStore';

export const dynamic = 'force-dynamic';

// Next.js Server Component - fetches data directly from the DB on page request
export default async function Page() {
  let initialNews: any[] = [];
  let initialReports: any[] = [];
  let initialCouncils: any[] = fallbackCouncilMembers;

  try {
    // Fetch news, reports, and councils concurrently from the database on the server
    const [newsRows, reportsRows, councilsRows] = await Promise.all([
      query<any[]>('SELECT * FROM news ORDER BY published_date DESC, id DESC LIMIT 3').catch(err => {
        console.warn('[SERVER APP] Failed to query news stories:', err.message);
        return [];
      }),
      query<any[]>('SELECT * FROM reports ORDER BY year DESC, id DESC LIMIT 3').catch(err => {
        console.warn('[SERVER APP] Failed to query reports:', err.message);
        return [];
      }),
      query<any[]>(
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
          display_order as displayOrder,
          is_active as isActive
        FROM councils 
        WHERE is_active = TRUE 
        ORDER BY display_order ASC`
      ).catch(err => {
        console.warn('[SERVER APP] Failed to query councils:', err.message);
        return fallbackCouncilMembers;
      })
    ]);

    if (Array.isArray(newsRows) && newsRows.length > 0) {
      initialNews = newsRows;
    }
    if (Array.isArray(reportsRows) && reportsRows.length > 0) {
      initialReports = reportsRows;
    }
    if (Array.isArray(councilsRows) && councilsRows.length > 0) {
      initialCouncils = councilsRows;
    }
  } catch (err: any) {
    console.error('[SERVER APP] Unexpected error fetching homepage SSR data:', err.message);
  }

  // Retrieve telemetry data using the context on the client side, pass initial content down
  return (
    <HomeClient
      initialNews={initialNews}
      initialReports={initialReports}
      initialCouncils={initialCouncils}
    />
  );
}
