import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // ── Block ALL direct access to /uploads/ ────────────────────────────────
  // All uploaded files must be served through secure API routes:
  //   - Images/videos: /api/files/[filename]
  //   - PDFs: /api/reports/serve/[id]?token=...
  if (path.startsWith('/uploads/')) {
    return new NextResponse(null, { status: 404 });
  }

  // ── Protect /admin routes (except /admin/login) ─────────────────────────
  if (path.startsWith('/admin') && path !== '/admin/login') {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'SUPERADMIN')) {
      const loginUrl = new URL('/admin/login', req.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // ── Protect /api/admin routes ───────────────────────────────────────────
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
  matcher: ['/admin/:path*', '/api/admin/:path*', '/uploads/:path*'],
};
