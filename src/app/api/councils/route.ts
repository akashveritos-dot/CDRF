import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/councils - Fetch all active council members (Public) or all members for Admin
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showAllRequested = searchParams.get('all') === 'true';
    let showAll = false;

    if (showAllRequested) {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      if (token) {
        const session = await verifyToken(token);
        if (session && (session.role === 'ADMIN' || session.role === 'SUPERADMIN')) {
          showAll = true;
        }
      }
    }

    const rows = await query<any[]>(
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
      ${showAll ? '' : 'WHERE is_active = TRUE'} 
      ORDER BY display_order ASC`
    );
    
    return new NextResponse(JSON.stringify(rows), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
    
  } catch (error: any) {
    console.error('Database error fetching councils:', error);
    return NextResponse.json(
      { error: 'Failed to fetch council members' },
      { status: 500 }
    );
  }
}

// POST /api/councils - Add a new council member (Admin Secured)
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
    const {
      id,
      name,
      role,
      roleBadgeColor = 'default',
      avatarInitials,
      profileImage = '',
      bio,
      linkedinUrl = '',
      organization = '',
      displayOrder = 0
    } = body;
    
    // Validate required fields
    if (!id || !name || !role || !avatarInitials || !bio) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if ID already exists
    const existing = await query<any[]>('SELECT id FROM councils WHERE id = ?', [id]);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Council member with ID "${id}" already exists.` },
        { status: 400 }
      );
    }
    
    // Insert new council member
    await query(
      `INSERT INTO councils 
        (id, name, role, role_badge_color, avatar_initials, profile_image, bio, linkedin_url, organization, display_order) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, role, roleBadgeColor, avatarInitials, profileImage, bio, linkedinUrl, organization, displayOrder]
    );
    
    return NextResponse.json({ success: true, message: 'Council member added successfully' });
    
  } catch (error: any) {
    console.error('Database error adding council member:', error);
    return NextResponse.json(
      { error: 'Failed to add council member' },
      { status: 500 }
    );
  }
}
