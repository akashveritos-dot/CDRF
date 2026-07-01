import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const method = req.method;

  // ── 1. IP Rate Limiting ───────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
             req.headers.get('x-real-ip') ||
             '127.0.0.1';

  // Apply stricter limits to public form submissions and login APIs
  if (
    path === '/api/auth/login' ||
    path === '/api/contacts' ||
    path === '/api/subscriptions' ||
    path.startsWith('/api/membership')
  ) {
    const { isLimited } = rateLimit(ip, 10, 60000); // 10 requests per minute
    if (isLimited) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again after one minute.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } else if (path.startsWith('/api/')) {
    // General API rate limit: 120 requests per minute
    const { isLimited } = rateLimit(ip, 120, 60000);
    if (isLimited) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate limit exceeded. Please slow down.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // ── 2. CSRF Protection for mutative HTTP requests (POST, PUT, DELETE, PATCH) ──
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const secFetchSite = req.headers.get('sec-fetch-site');

    // Check Sec-Fetch-Site if supported by browser (modern standard protection)
    if (secFetchSite && secFetchSite === 'cross-site') {
      return new NextResponse(
        JSON.stringify({ error: 'CSRF Protection: Cross-site request blocked.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify Origin matches host
    if (origin) {
      const originUrl = new URL(origin);
      const hostHeader = req.headers.get('host');
      const forwardedHost = req.headers.get('x-forwarded-host');
      
      const allowedHosts = [
        req.nextUrl.host,
        hostHeader,
        forwardedHost
      ].filter(Boolean);

      if (!allowedHosts.includes(originUrl.host)) {
        return new NextResponse(
          JSON.stringify({ error: `CSRF Protection: Origin mismatch blocked. Origin: ${originUrl.host}, Allowed: ${allowedHosts.join(', ')}` }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (referer) {
      // Fallback to Referer header check
      const refererUrl = new URL(referer);
      const hostHeader = req.headers.get('host');
      const forwardedHost = req.headers.get('x-forwarded-host');

      const allowedHosts = [
        req.nextUrl.host,
        hostHeader,
        forwardedHost
      ].filter(Boolean);

      if (!allowedHosts.includes(refererUrl.host)) {
        return new NextResponse(
          JSON.stringify({ error: 'CSRF Protection: Referer mismatch blocked.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Reject requests that omit both Origin and Referer for mutative AJAX operations in prod
      // Exclude internal PM2/node scheduler hits to /api/scrape
      if (process.env.NODE_ENV === 'production' && !path.startsWith('/api/scrape')) {
        return new NextResponse(
          JSON.stringify({ error: 'CSRF Protection: Missing verification headers.' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  // ── 3. Allow /uploads/ to pass through for Next.js rewrites to work ────────

  // ── 4. Protect /admin routes (except /admin/login) ─────────────────────────
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

  // ── 5. Protect /api/admin routes ───────────────────────────────────────────
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
  matcher: ['/admin/:path*', '/api/:path*', '/uploads/:path*'],
};
