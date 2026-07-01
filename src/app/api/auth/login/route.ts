import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword } from '@/lib/auth-node';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';
import logger from '@/lib/logger';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }).trim(),
  password: z.string().min(1, { message: 'Password is required.' })
});

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues[0]?.message || 'Invalid input validation.';
      logger.warn({ errors: validationResult.error.format() }, 'Invalid login payload');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { email, password } = validationResult.data;

    // Query the database for the user
    logger.info({ email }, 'Database login attempt');
    const users = await query<any[]>(
      'SELECT id, email, password_hash, name, role, is_active FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    logger.debug({ count: users.length }, 'Users queried from DB');

    if (users.length === 0) {
      logger.warn({ email }, 'Login failure: User not found');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const [user] = users;

    // Verify role is ADMIN or SUPERADMIN (no login/signup for regular users)
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      logger.warn({ email, role: user.role }, 'Access denied: Non-admin role login attempt');
      return NextResponse.json(
        { error: 'Access denied. Administrator privileges required.' },
        { status: 403 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      logger.warn({ email }, 'Access denied: Inactive user account');
      return NextResponse.json(
        { error: 'Account is inactive. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password hash
    const isPasswordValid = verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      logger.warn({ email }, 'Login failure: Incorrect password');
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

    logger.info({ email, userId: user.id, role: user.role }, 'User successfully authenticated');

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
    logger.error(error, 'Login operation failed');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
