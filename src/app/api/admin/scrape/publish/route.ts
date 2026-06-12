import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/admin/scrape/publish - Approve and publish scraped item, or reject it
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      scrapedId,
      action, // 'publish' | 'reject'
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

    // Verify item exists and is Pending
    const existing = await query<any[]>(
      'SELECT * FROM scraped_content WHERE id = ? LIMIT 1',
      [scrapedId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Scraped item not found' }, { status: 404 });
    }

    const item = existing[0];

    if (action === 'reject') {
      await query(
        "UPDATE scraped_content SET status = 'Rejected' WHERE id = ?",
        [scrapedId]
      );
      return NextResponse.json({
        success: true,
        message: 'Scraped article rejected and removed from queue.'
      });
    }

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
