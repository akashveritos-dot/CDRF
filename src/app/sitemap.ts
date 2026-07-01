import { query } from '@/lib/db';
import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://dcrf.world';

  // 1. Core static routes
  const staticPaths = [
    '',
    '/about',
    '/event',
    '/event/speakers',
    '/gallery',
    '/insights/event-videos',
    '/insights/map',
    '/membership',
    '/news',
    '/podcasts',
    '/privacy',
    '/reports',
    '/terms',
    '/contact',
    '/soon'
  ];

  const staticRoutes = staticPaths.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  let dynamicRoutes: MetadataRoute.Sitemap = [];

  // 2. Dynamic pages from cms_pages
  try {
    const cmsPages = await query<any[]>('SELECT slug, category, updated_at FROM cms_pages');
    if (Array.isArray(cmsPages)) {
      const cmsRoutes = cmsPages
        .filter((page) => page && page.slug && (page.category === 'about' || page.category === 'events'))
        .map((page) => {
          const path = page.category === 'about' ? `/about/${page.slug}` : `/event/${page.slug}`;
          return {
            url: `${baseUrl}${path}`,
            lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
          };
        });
      dynamicRoutes = [...dynamicRoutes, ...cmsRoutes];
    }
  } catch (err) {
    console.error('[SITEMAP GENERATOR] failed to load cms_pages:', err);
  }

  // 3. Dynamic news articles
  try {
    const newsArticles = await query<any[]>('SELECT id, published_date FROM news');
    if (Array.isArray(newsArticles)) {
      const newsRoutes = newsArticles
        .filter((article) => article && article.id)
        .map((article) => ({
          url: `${baseUrl}/news/${article.id}`,
          lastModified: article.published_date ? new Date(article.published_date) : new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }));
      dynamicRoutes = [...dynamicRoutes, ...newsRoutes];
    }
  } catch (err) {
    console.error('[SITEMAP GENERATOR] failed to load news:', err);
  }

  // 4. Dynamic reports
  try {
    const reports = await query<any[]>('SELECT id, created_at FROM reports');
    if (Array.isArray(reports)) {
      const reportsRoutes = reports
        .filter((report) => report && report.id)
        .map((report) => ({
          url: `${baseUrl}/reports/view/${report.id}`,
          lastModified: report.created_at ? new Date(report.created_at) : new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }));
      dynamicRoutes = [...dynamicRoutes, ...reportsRoutes];
    }
  } catch (err) {
    console.error('[SITEMAP GENERATOR] failed to load reports:', err);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
