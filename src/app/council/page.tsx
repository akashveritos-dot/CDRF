import React from 'react';
import { query } from '@/lib/db';
import CouncilPageClient from './CouncilPageClient';

export const dynamic = 'force-dynamic';

export default async function CouncilPage() {
  let members: any[] = [];
  try {
    members = await query<any[]>(
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
    );
  } catch (err) {
    console.error('Failed to load council members server-side:', err);
  }

  return <CouncilPageClient initialMembers={members} />;
}
