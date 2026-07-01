import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from './auth';
import { SessionPayload } from './permissions';
import logger from './logger';

type GuardedHandler = (
  req: NextRequest,
  session: SessionPayload,
  context: any
) => Promise<NextResponse> | Promise<Response>;

export function withAdminAuth(handler: GuardedHandler, requiredRole: 'ADMIN' | 'SUPERADMIN' = 'ADMIN') {
  return async (req: NextRequest, context: any) => {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;

      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const session = await verifyToken(token) as SessionPayload;
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (requiredRole === 'SUPERADMIN' && session.role !== 'SUPERADMIN') {
        logger.warn({ user: session.email, path: req.nextUrl.pathname }, 'Access denied: SUPERADMIN role required');
        return NextResponse.json({ error: 'Forbidden. SUPERADMIN role required.' }, { status: 403 });
      }

      if (session.role !== 'ADMIN' && session.role !== 'SUPERADMIN') {
        logger.warn({ user: session.email, role: session.role, path: req.nextUrl.pathname }, 'Access denied: Admin role required');
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      return await handler(req, session, context);
    } catch (err: any) {
      logger.error(err, 'Guarded Route execution failure');
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
