import React from 'react';
import { query } from '@/lib/db';
import ContactClient from './ContactClient';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  // Fetch contact data from DB sections
  let contactData = {
    officeName: 'DCRF Secretariat Office',
    address: 'Core 4B, 2nd Floor, India Habitat Centre (IHC), Lodhi Road, New Delhi — 110003',
    lat: '28.5935',
    lon: '77.2222',
    alt: '216m',
    contacts: [
      { title: 'General Queries', value: 'info@dcrf.org', type: 'email' },
      { title: 'Secretariat', value: 'secretariat@dcrf.org', type: 'email' },
      { title: 'Phone', value: '+91 11 4355 6700', type: 'phone' },
      { title: 'Operations', value: '+91 11 4355 6709', type: 'phone' },
    ]
  };

  try {
    const sections = await query<any[]>(
      `SELECT id, title, description FROM cms_page_sections WHERE page_slug = 'contact' ORDER BY display_order ASC`
    );

    if (sections.length > 0) {
      const sectionIds = sections.map(s => s.id);
      const placeholders = sectionIds.map(() => '?').join(',');
      const cards = await query<any[]>(
        `SELECT id, section_id as sectionId, title, description, extra_data as extraData
         FROM cms_page_cards WHERE section_id IN (${placeholders}) ORDER BY display_order ASC`,
        sectionIds
      );

      // Parse extraData
      for (const card of cards) {
        if (card.extraData && typeof card.extraData === 'string') {
          try { card.extraData = JSON.parse(card.extraData); } catch { card.extraData = {}; }
        }
      }

      // Find address section
      const addressSection = sections.find(s => s.title === 'Office Address');
      if (addressSection) {
        const addressCards = cards.filter(c => c.sectionId === addressSection.id);
        if (addressCards.length > 0) {
          const addr = addressCards[0];
          contactData.officeName = addr.title || contactData.officeName;
          contactData.address = addr.description || contactData.address;
          contactData.lat = addr.extraData?.lat || contactData.lat;
          contactData.lon = addr.extraData?.lon || contactData.lon;
          contactData.alt = addr.extraData?.alt || contactData.alt;
        }
      }

      // Find contact info section
      const contactSection = sections.find(s => s.title === 'Contact Info');
      if (contactSection) {
        const contactCards = cards.filter(c => c.sectionId === contactSection.id);
        if (contactCards.length > 0) {
          contactData.contacts = contactCards.map(c => ({
            title: c.title,
            value: c.description,
            type: c.extraData?.type || 'email'
          }));
        }
      }
    }
  } catch (err) {
    console.error('Error loading contact data:', err);
    // fallback to defaults above
  }

  return <ContactClient contactData={contactData} />;
}
