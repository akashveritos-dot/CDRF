import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Protect /admin routes (except /admin/login and static/public assets)
  if (path.startsWith('/admin') && path !== '/admin/login') {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      // Redirect to admin login if token is missing
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'SUPERADMIN')) {
      // Redirect to admin login if token is invalid or user is not an admin
      const loginUrl = new URL('/admin/login', req.url);
      // Delete invalid cookie
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // Protect /api/admin routes
  if (path.startsWith('/api/admin')) {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'SUPERADMIN')) {
      return new NextResponse(
        JSON.stringify({ error: 'Administrator access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return NextResponse.next();
}

// Configure routes to run the proxy against
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
