import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword } from '@/lib/auth-node';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Query the database for the user
    console.log('[DEBUG AUTH] Database login attempt:', { email });
    const users = await query<any[]>(
      'SELECT id, email, password_hash, name, role, is_active FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    console.log('[DEBUG AUTH] Users found:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const [user] = users;

    // Verify role is ADMIN or SUPERADMIN (no login/signup for regular users)
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      console.log('[DEBUG AUTH] Access denied for non-admin role:', user.role);
      return NextResponse.json(
        { error: 'Access denied. Administrator privileges required.' },
        { status: 403 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      console.log('[DEBUG AUTH] Access denied for inactive user:', user.email);
      return NextResponse.json(
        { error: 'Account is inactive. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password hash
    const isPasswordValid = verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Set secure cookie using modern Next.js async cookies API
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
