import React from 'react';
import { query } from '@/lib/db';
import EventVideosClient from './EventVideosClient';

export const dynamic = 'force-dynamic';

export default async function EventVideosPage() {
  // Defaults (fallback if DB has no data)
  let speakers: any[] = [];
  let upcomingSchedule: any[] = [];
  let webinarVideos: any[] = [];

  try {
    // Fetch sections for event-videos page
    const sections = await query<any[]>(
      `SELECT id, title, description FROM cms_page_sections WHERE page_slug = 'event-videos' ORDER BY display_order ASC`
    );

    if (sections.length > 0) {
      const sectionIds = sections.map(s => s.id);
      const placeholders = sectionIds.map(() => '?').join(',');
      const cards = await query<any[]>(
        `SELECT id, section_id as sectionId, title, description, image_url as imageUrl, link_text as linkText, link_url as linkUrl, extra_data as extraData, display_order as displayOrder
         FROM cms_page_cards WHERE section_id IN (${placeholders}) ORDER BY display_order ASC`,
        sectionIds
      );

      // Parse extraData
      for (const card of cards) {
        if (card.extraData && typeof card.extraData === 'string') {
          try { card.extraData = JSON.parse(card.extraData); } catch { card.extraData = {}; }
        }
        if (!card.extraData) card.extraData = {};
      }

      for (const section of sections) {
        const sectionCards = cards.filter(c => c.sectionId === section.id);

        if (section.title === 'Expert Panel') {
          speakers = sectionCards.map(c => ({
            name: c.title,
            title: c.extraData?.role || c.description,
            org: c.extraData?.org || '',
            initials: c.extraData?.initials || c.title?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
            color: c.extraData?.color || '#b91c1c',
            imageUrl: c.imageUrl || '',
          }));
        } else if (section.title === 'Next Sessions') {
          upcomingSchedule = sectionCards.map(c => ({
            month: c.extraData?.month || '',
            day: c.extraData?.day || '',
            title: c.title,
            speaker: c.extraData?.speaker || c.description,
            duration: c.extraData?.duration || '',
            topic: c.extraData?.topic || '',
          }));
        } else if (section.title === 'Past Sessions') {
          webinarVideos = sectionCards.map((c, i) => ({
            id: `vid-${c.id || i}`,
            title: c.title,
            description: c.description,
            category: c.extraData?.category || '',
            categoryColor: c.extraData?.categoryColor || '#b91c1c',
            embedUrl: c.extraData?.embedUrl || '',
            posterUrl: c.imageUrl || c.extraData?.posterUrl || '',
            duration: c.extraData?.duration || '',
            date: c.extraData?.date || '',
            topic: c.extraData?.topic || '',
          }));
        }
      }
    }
  } catch (err) {
    console.error('Error loading event videos data:', err);
  }

  // Extract unique topics from the videos for filter pills
  const topics = ['All', ...Array.from(new Set(webinarVideos.map((v: any) => v.topic).filter(Boolean)))];

  return (
    <EventVideosClient
      speakers={speakers}
      upcomingSchedule={upcomingSchedule}
      webinarVideos={webinarVideos}
      topics={topics}
    />
  );
}
