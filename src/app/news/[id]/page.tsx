import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Globe, User, Calendar } from 'lucide-react';
import { query } from '@/lib/db';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

const categoryFallbacks: Record<string, string> = {
  earthquake: 'https://images.unsplash.com/photo-1594897030264-ab7d87efc473?auto=format&fit=crop&w=800&q=80',
  flood: 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?auto=format&fit=crop&w=800&q=80',
  wildfire: 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=800&q=80',
  cyclone: 'https://images.unsplash.com/photo-1527482797697-8795b05a133d?auto=format&fit=crop&w=800&q=80',
  storm: 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?auto=format&fit=crop&w=800&q=80',
  landslide: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  drought: 'https://images.unsplash.com/photo-1473116763269-b552f58d6f67?auto=format&fit=crop&w=800&q=80',
  climate: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
  environment: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80',
  sustainability: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
  disasters: 'https://images.unsplash.com/photo-1542393545-10f5b85e14fc?auto=format&fit=crop&w=800&q=80',
  breaking: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
};

const getFallbackImg = (story: any): string => {
  const key = (story.category || story.tag || 'breaking').toLowerCase();
  return categoryFallbacks[key] || categoryFallbacks.breaking;
};

const getTagClass = (tag: string) => {
  switch ((tag || '').toLowerCase()) {
    case 'breaking': return styles.tagBreaking;
    case 'environment': return styles.tagEnv;
    case 'health crisis': return styles.tagHealth;
    case 'climate': return styles.tagPolicy;
    case 'disasters': return styles.tagBreaking;
    default: return styles.tagEnv;
  }
};

function formatContent(content: string) {
  if (!content) return '';
  // If it has HTML tags, render it as-is
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return content;
  }
  // Otherwise, split by newline and wrap in paragraphs
  return content
    .split('\n')
    .filter(p => p.trim().length > 0)
    .map(p => `<p>${p}</p>`)
    .join('');
}

export default async function NewsDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    notFound();
  }

  let story: any = null;

  try {
    const rows = await query<any[]>('SELECT * FROM news WHERE id = ? LIMIT 1', [id]);
    if (rows && rows.length > 0) {
      const rawStory = rows[0];
      story = {
        ...rawStory,
        date: new Date(rawStory.published_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      };
    }
  } catch (error) {
    console.error('Error fetching article details:', error);
  }

  if (!story) {
    return (
      <div className={styles.notFoundContainer}>
        <h2 className={styles.notFoundTitle}>Article Not Found</h2>
        <p style={{ color: 'var(--text-muted)' }}>The article you are looking for does not exist or has been deleted.</p>
        <Link href="/news" className={styles.backBtn} style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} />
          Back to News
        </Link>
      </div>
    );
  }

  const formattedHtmlContent = formatContent(story.full_content || story.excerpt);

  let galleryImages: string[] = [];
  if (story.gallery_images) {
    try {
      const parsed = JSON.parse(story.gallery_images);
      if (Array.isArray(parsed)) {
        galleryImages = parsed;
      }
    } catch (e) {
      if (typeof story.gallery_images === 'string' && story.gallery_images.trim().length > 0) {
        galleryImages = story.gallery_images.split(',').map((s: string) => s.trim());
      }
    }
  }

  return (
    <div className={styles.page}>
      <Link href="/news" className={styles.backBtn}>
        <ArrowLeft size={16} />
        Back to News
      </Link>

      <article className={styles.header}>
        <div className={styles.meta}>
          <span className={`${styles.tag} ${getTagClass(story.tag)}`}>
            {story.tag}
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} />
            {story.date}
          </span>
          <span>•</span>
          <span className={styles.sourceLabel} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Globe size={12} />
            {story.source}
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} />
            {story.author || 'Editor, DCRF'}
          </span>
        </div>

        <h1 className={styles.title}>{story.headline}</h1>
        {story.excerpt && <p className={styles.excerpt}>{story.excerpt}</p>}
      </article>

      <div className={styles.imageContainer}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={story.image_url || getFallbackImg(story)}
          alt={story.headline}
          className={styles.image}
        />
      </div>

      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: formattedHtmlContent }}
      />

      {galleryImages && galleryImages.length > 0 && (
        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--border-color)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--text-default)', marginBottom: '20px' }}>
            Article Gallery
          </h3>
          <div className={styles.galleryGrid}>
            {galleryImages.map((imgUrl, index) => (
              <div key={index} className={styles.galleryItem}>
                <a href={imgUrl} target="_blank" rel="noopener noreferrer" className={styles.galleryLink}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={`Gallery showcase image ${index + 1}`}
                    className={styles.galleryImage}
                  />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {story.external_link && story.external_link !== '#' && story.external_link.trim() !== '' && (
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-start' }}>
          <a
            href={story.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.backBtn}
            style={{ marginBottom: 0 }}
          >
            Read Original Article on {story.source || 'External Source'} ↗
          </a>
        </div>
      )}
    </div>
  );
}
