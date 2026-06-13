import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dcrf_db'
};

export async function GET() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    
    // Query to fetch all active council members
    const [rows] = await connection.execute(
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
        display_order as displayOrder
      FROM councils 
      WHERE is_active = TRUE 
      ORDER BY display_order ASC`
    );
    
    await connection.end();
    
    return NextResponse.json(rows);
    
  } catch (error) {
    console.error('Database error fetching councils:', error);
    
    // Close connection if it exists
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
    
    // Return error response
    return NextResponse.json(
      { error: 'Failed to fetch council members' },
      { status: 500 }
    );
  }
}

// POST endpoint to add a new council member
export async function POST(request: Request) {
  let connection;
  
  try {
    const body = await request.json();
    const {
      id,
      name,
      role,
      roleBadgeColor = 'default',
      avatarInitials,
      profileImage,
      bio,
      linkedinUrl,
      organization,
      displayOrder = 0
    } = body;
    
    // Validate required fields
    if (!id || !name || !role || !avatarInitials || !bio) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    connection = await mysql.createConnection(dbConfig);
    
    // Insert new council member
    await connection.execute(
      `INSERT INTO councils 
        (id, name, role, role_badge_color, avatar_initials, profile_image, bio, linkedin_url, organization, display_order) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, role, roleBadgeColor, avatarInitials, profileImage, bio, linkedinUrl, organization, displayOrder]
    );
    
    await connection.end();
    
    return NextResponse.json({ success: true, message: 'Council member added successfully' });
    
  } catch (error) {
    console.error('Database error adding council member:', error);
    
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to add council member' },
      { status: 500 }
    );
  }
}
