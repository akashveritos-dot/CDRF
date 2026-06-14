import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  // simple check for private IP ranges
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  if (ip.startsWith('172.')) {
    const parts = ip.split('.');
    if (parts.length >= 2) {
      const second = parseInt(parts[1], 10);
      if (second >= 16 && second <= 31) return true;
    }
  }
  return false;
}

export async function logAction(
  req: NextRequest,
  session: { email: string; name: string; role: string },
  actionType: 'ADD' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH' | 'RESTORE' | 'OTHER',
  section: string,
  details: string
) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
             req.headers.get('x-real-ip') || 
             (req as any).ip || 
             '127.0.0.1';

  let location = 'Unknown';
  if (isPrivateIp(ip)) {
    location = 'Localhost / Dev Environment';
  } else {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const city = geoData.city || '';
        const region = geoData.region || '';
        const country = geoData.country_name || '';
        location = [city, region, country].filter(Boolean).join(', ') || 'Unknown';
      }
    } catch (e) {
      console.warn('Audit geolocation failed:', e);
      location = 'Unknown Location';
    }
  }

  try {
    await query(
      `INSERT INTO audit_logs (user_email, user_name, user_role, action_type, section, details, ip_address, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.email,
        session.name,
        session.role,
        actionType,
        section,
        details,
        ip,
        location
      ]
    );
  } catch (err) {
    console.error('Failed to write audit log to database:', err);
  }
}
