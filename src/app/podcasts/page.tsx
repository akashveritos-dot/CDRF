import React from 'react';
import { query } from '@/lib/db';
import PodcastsClient from './PodcastsClient';
import { podcastEpisodes as fallbackEpisodes } from '@/data/dataStore';

export const dynamic = 'force-dynamic';

export default async function PodcastsPage() {
  let episodes = fallbackEpisodes;
  let videoInterviews: any[] = [
    { gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0e7a6b 100%)', duration: '18:24', tag: 'Interview Series', title: 'Mobilising Institutional CSR for Disaster Tech', date: 'May 12, 2026', guest: 'Mr. Ashish Jha', guestTitle: 'Secretary General, DCRF', embedUrl: 'https://www.youtube.com/embed/Q8wzIcrqNnE' },
    { gradient: 'linear-gradient(135deg, #0f172a 0%, #2d1b4e 50%, #991b1b 100%)', duration: '24:15', tag: 'Conclave Preview', title: 'DCRC 2026: Convergence & Policy Objectives', date: 'Apr 28, 2026', guest: 'Dr. Brijender Mishra', guestTitle: 'Convener, DCRF', embedUrl: 'https://www.youtube.com/embed/U7Jsk748t3w' }
  ];

  try {
    const sections = await query<any[]>(
      `SELECT id, title, description FROM cms_page_sections WHERE page_slug = 'podcasts' ORDER BY display_order ASC`
    );

    if (sections.length > 0) {
      const sectionIds = sections.map(s => s.id);
      const placeholders = sectionIds.map(() => '?').join(',');
      const cards = await query<any[]>(
        `SELECT id, section_id as sectionId, title, description, image_url as imageUrl, extra_data as extraData, display_order as displayOrder
         FROM cms_page_cards WHERE section_id IN (${placeholders}) ORDER BY display_order ASC`,
        sectionIds
      );

      for (const card of cards) {
        if (card.extraData && typeof card.extraData === 'string') {
          try { card.extraData = JSON.parse(card.extraData); } catch { card.extraData = {}; }
        }
        if (!card.extraData) card.extraData = {};
      }

      // Episodes section
      const episodesSection = sections.find(s => s.title === 'Episodes');
      if (episodesSection) {
        const epsCards = cards.filter(c => c.sectionId === episodesSection.id);
        if (epsCards.length > 0) {
          episodes = epsCards.map(c => ({
            id: `pod-${c.extraData?.episodeNumber || c.id}`,
            episodeNumber: c.extraData?.episodeNumber || c.id,
            tag: c.extraData?.tag || 'Policy',
            title: c.title,
            description: c.description || '',
            date: c.extraData?.date || '',
            duration: c.extraData?.duration || '',
            speaker: c.extraData?.speaker || '',
            speakerTitle: c.extraData?.speakerTitle || '',
            audioUrl: c.extraData?.audioUrl || '#',
            imageUrl: c.imageUrl || c.extraData?.imageUrl || '',
            isFeatured: c.extraData?.isFeatured || false,
          }));
        }
      }

      // Video Interviews section
      const videosSection = sections.find(s => s.title === 'Video Interviews');
      if (videosSection) {
        const vidCards = cards.filter(c => c.sectionId === videosSection.id);
        if (vidCards.length > 0) {
          videoInterviews = vidCards.map(c => ({
            gradient: c.extraData?.gradient || 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0e7a6b 100%)',
            duration: c.extraData?.duration || '',
            tag: c.description || 'Interview',
            title: c.title,
            date: c.extraData?.date || '',
            guest: c.extraData?.guest || '',
            guestTitle: c.extraData?.guestTitle || '',
            embedUrl: c.extraData?.embedUrl || '',
          }));
        }
      }
    }
  } catch (err) {
    console.error('Error loading podcast data:', err);
  }

  return <PodcastsClient initialEpisodes={episodes} initialVideos={videoInterviews} />;
}
