import React from 'react';
import { query } from '@/lib/db';
import ReportsPageClient from './ReportsPageClient';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  let reports: any[] = [];
  try {
    const rawReports = await query<any[]>('SELECT * FROM reports ORDER BY year DESC, id DESC');
    if (Array.isArray(rawReports)) {
      reports = rawReports;
    }
  } catch (err) {
    console.error('Failed to load reports server-side:', err);
  }

  return <ReportsPageClient initialReports={reports} />;
}
