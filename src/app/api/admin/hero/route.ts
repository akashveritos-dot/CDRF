import { NextRequest, NextResponse } from 'next/server';
import { query, transactionalDelete } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';

// GET Hero Settings & Strip Stats
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const heroSettingsRows = await query<any[]>('SELECT * FROM hero_settings ORDER BY id DESC LIMIT 1');
    const settings = heroSettingsRows[0] || {
      eyebrow: 'Founded 2026 • New Delhi, India',
      title: 'Building *Resilience*\nThrough Knowledge,\nConvergence & Action',
      subtitle: 'India’s premier multi-stakeholder federation unifying corporates, NGOs, academia, and government bodies...',
      image_url: '/hero_background.jpg',
      video_url: null,
      button_text: 'Join the Resilience Movement',
      button_url: '/membership#join'
    };

    const stats = await query<any[]>('SELECT * FROM hero_strip_stats ORDER BY display_order ASC');

    return NextResponse.json({ settings, stats });
  } catch (error: any) {
    console.error('Admin GET hero error:', error);
    return NextResponse.json({ error: 'Failed to fetch hero settings' }, { status: 500 });
  }
}

// POST Save Hero Settings or Stat Card
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'updateSettings') {
      const { eyebrow, title, subtitle, imageUrl, videoUrl, buttonText, buttonUrl } = body;
      
      if (!title || !subtitle) {
        return NextResponse.json({ error: 'Title and Subtitle are required' }, { status: 400 });
      }

      // Check if row exists
      const existing = await query<any[]>('SELECT id FROM hero_settings LIMIT 1');
      if (existing.length > 0) {
        await query(
          `UPDATE hero_settings 
           SET eyebrow = ?, title = ?, subtitle = ?, image_url = ?, video_url = ?, button_text = ?, button_url = ? 
           WHERE id = ?`,
          [eyebrow || '', title, subtitle, imageUrl || null, videoUrl || null, buttonText || null, buttonUrl || null, existing[0].id]
        );
      } else {
        await query(
          `INSERT INTO hero_settings (eyebrow, title, subtitle, image_url, video_url, button_text, button_url) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [eyebrow || '', title, subtitle, imageUrl || null, videoUrl || null, buttonText || null, buttonUrl || null]
        );
      }

      await logAction(req, session, 'UPDATE', 'HeroSettings', 'Updated Hero Section settings');
      return NextResponse.json({ success: true, message: 'Hero settings updated successfully' });

    } else if (action === 'saveStat') {
      const { id, label, count, suffix, displayOrder = 0 } = body;

      if (!label || count === undefined) {
        return NextResponse.json({ error: 'Label and count are required' }, { status: 400 });
      }

      if (id) {
        // Update existing stat card
        await query(
          'UPDATE hero_strip_stats SET label = ?, count = ?, suffix = ?, display_order = ? WHERE id = ?',
          [label, count, suffix || '', displayOrder, id]
        );
        await logAction(req, session, 'UPDATE', 'HeroStats', `Updated hero stat: "${label}"`);
      } else {
        // Create new stat card
        await query(
          'INSERT INTO hero_strip_stats (label, count, suffix, display_order) VALUES (?, ?, ?, ?)',
          [label, count, suffix || '', displayOrder]
        );
        await logAction(req, session, 'ADD', 'HeroStats', `Created hero stat: "${label}"`);
      }

      return NextResponse.json({ success: true, message: 'Hero statistics saved successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin POST hero error:', error);
    return NextResponse.json({ error: 'Failed to update hero settings' }, { status: 500 });
  }
}

// DELETE a Hero Stat Card (SUPERADMIN ONLY)
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Only administrators can delete hero statistics' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const existing = await query<any[]>('SELECT label FROM hero_strip_stats WHERE id = ?', [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Stat card not found' }, { status: 404 });
    }
    const label = existing[0].label;

    await transactionalDelete('hero_strip_stats', 'id', id, session);
    await logAction(req, session, 'DELETE', 'HeroStats', `Deleted hero stat: "${label}" (ID: ${id})`);

    return NextResponse.json({ success: true, message: 'Hero statistics deleted successfully' });
  } catch (error: any) {
    console.error('Admin DELETE hero stat error:', error);
    return NextResponse.json({ error: 'Failed to delete hero statistics' }, { status: 500 });
  }
}
