import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/audit';

// POST /api/admin/scrape/publish - Approve and publish scraped item, or reject/restore/delete/unpublish it
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
      scrapedId,
      action, // 'publish' | 'reject' | 'unpublish' | 'restore' | 'delete'
      publishType, // 'News' | 'Report' (if publish)
      headline,
      excerpt,
      category,
      imageUrl,
      author,
      source,
      externalLink,
      pageCount,
      year,
      downloadUrl,
      location,
      publishedDate,
      severityLevel,
      affectedPopulation
    } = body;

    if (!scrapedId || !action) {
      return NextResponse.json(
        { error: 'Scraped content ID and action are required' },
        { status: 400 }
      );
    }

    // Verify item exists
    const existing = await query<any[]>(
      'SELECT * FROM scraped_content WHERE id = ? LIMIT 1',
      [scrapedId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Scraped item not found' }, { status: 404 });
    }

    const item = existing[0];

    // Reject Action
    if (action === 'reject') {
      await query(
        "UPDATE scraped_content SET status = 'Rejected' WHERE id = ?",
        [scrapedId]
      );
      
      await logAction(
        req,
        session,
        'UPDATE',
        'Scraper Queue',
        `Rejected scraped item: "${item.headline}" (ID: ${scrapedId})`
      );

      return NextResponse.json({
        success: true,
        message: 'Scraped article rejected and removed from queue.'
      });
    }

    // Restore Action
    if (action === 'restore') {
      await query(
        "UPDATE scraped_content SET status = 'Pending' WHERE id = ?",
        [scrapedId]
      );

      await logAction(
        req,
        session,
        'RESTORE',
        'Scraper Queue',
        `Restored scraped item: "${item.headline}" to review queue (ID: ${scrapedId})`
      );

      return NextResponse.json({
        success: true,
        message: 'Scraped article restored to review queue.'
      });
    }

    // Delete Action
    if (action === 'delete') {
      await query(
        "DELETE FROM scraped_content WHERE id = ?",
        [scrapedId]
      );

      await logAction(
        req,
        session,
        'DELETE',
        'Scraper Queue',
        `Permanently deleted scraped item: "${item.headline}" (ID: ${scrapedId})`
      );

      return NextResponse.json({
        success: true,
        message: 'Scraped article permanently deleted.'
      });
    }

    // Unpublish Action
    if (action === 'unpublish') {
      const pubId = item.published_id;
      const pubType = item.published_type;

      if (pubId && pubType) {
        if (pubType === 'News') {
          await query('DELETE FROM news WHERE id = ?', [pubId]);
        } else if (pubType === 'Report') {
          await query('DELETE FROM reports WHERE id = ?', [pubId]);
        }
      }

      await query(
        "UPDATE scraped_content SET status = 'Pending', published_id = NULL, published_type = NULL WHERE id = ?",
        [scrapedId]
      );

      await logAction(
        req,
        session,
        'UNPUBLISH',
        'Scraper Queue',
        `Unpublished scraped item: "${item.headline}" (Deleted correspondig ${pubType} ID: ${pubId})`
      );

      return NextResponse.json({
        success: true,
        message: 'Scraped article unpublished and restored to pending queue.'
      });
    }

    // Publish Action
    if (action === 'publish') {
      if (!publishType) {
        return NextResponse.json(
          { error: 'Publish type (News or Report) is required to publish' },
          { status: 400 }
        );
      }

      if (publishType === 'News') {
        const headlineText = headline || item.headline;
        const excerptText = excerpt || item.excerpt;
        const locVal = location || item.location || 'National';
        const pubDateVal = publishedDate || (item.published_date ? new Date(item.published_date).toISOString().split('T')[0] : null) || new Date().toISOString().split('T')[0];
        
        // Insert into news table
        const newsResult = await query<any>(
          `INSERT INTO news (tag, source, headline, excerpt, published_date, author, external_link, thumbnail_emoji, image_url, category, location) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'Alert',
            source || item.source || 'Scraped Alert',
            headlineText,
            excerptText,
            pubDateVal,
            author || 'Editor, DCRF',
            externalLink || item.url || '',
            '📡',
            imageUrl || item.image_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
            (category || item.category || 'disasters').toLowerCase(),
            locVal
          ]
        );

        const newNewsId = newsResult.insertId;

        // Update scraped item status
        await query(
          "UPDATE scraped_content SET status = 'Published', published_id = ?, published_type = 'News' WHERE id = ?",
          [newNewsId, scrapedId]
        );

        await logAction(
          req,
          session,
          'PUBLISH',
          'Scraper Queue',
          `Published scraped item: "${headlineText}" as News (News ID: ${newNewsId})`
        );

        return NextResponse.json({
          success: true,
          message: 'Scraped article published as News story successfully',
          publishedId: newNewsId
        });
      } 
      else if (publishType === 'Report') {
        const titleText = headline || item.headline;
        const descText = excerpt || item.excerpt;
        const sourceText = source || item.source || 'DCRF Scraped Report';
        const regionVal = location || item.location || 'National';
        const disasterTypeVal = category || item.category || 'General';

        // Insert into reports table
        const reportResult = await query<any>(
          `INSERT INTO reports (title, category, description, page_count, year, download_url, accent_color, icon, image_url, source, region, disaster_type, severity_level, affected_population) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            titleText,
            category || 'Technical',
            descText,
            parseInt(pageCount || '10', 10),
            parseInt(year || new Date().getFullYear().toString(), 10),
            downloadUrl || item.url || '#',
            '#EDF2F8',
            '📡',
            imageUrl || item.image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
            sourceText,
            regionVal,
            disasterTypeVal,
            severityLevel || 'Medium',
            affectedPopulation || null
          ]
        );

        const newReportId = reportResult.insertId;

        // Update scraped item status
        await query(
          "UPDATE scraped_content SET status = 'Published', published_id = ?, published_type = 'Report' WHERE id = ?",
          [newReportId, scrapedId]
        );

        await logAction(
          req,
          session,
          'PUBLISH',
          'Scraper Queue',
          `Published scraped item: "${titleText}" as Report (Report ID: ${newReportId})`
        );

        return NextResponse.json({
          success: true,
          message: 'Scraped article published as Research Report successfully',
          publishedId: newReportId
        });
      }
    }

    return NextResponse.json({ error: 'Invalid publish action or payload' }, { status: 400 });

  } catch (error: any) {
    console.error('Publish scraped content error:', error);
    return NextResponse.json(
      { error: 'Failed to process publish action' },
      { status: 500 }
    );
  }
}
