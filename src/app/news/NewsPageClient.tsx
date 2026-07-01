'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHero from '@/components/ui/PageHero/PageHero';

const categories = ['All', 'Breaking', 'Environment', 'Health Crisis', 'Climate', 'Disasters', 'Sustainability'];

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

interface NewsPageClientProps {
  initialStories: any[];
  currentPage: number;
  totalPages: number;
  currentCategory: string;
}

export default function NewsPageClient({
  initialStories,
  currentPage,
  totalPages,
  currentCategory
}: NewsPageClientProps) {
  const router = useRouter();
  const stories = initialStories;

  const renderReadButton = (story: any, label: string = 'Read story') => {
    return (
      <Link href={`/news/${story.id}`} className={styles.readBtn}>
        {label}
      </Link>
    );
  };

  const getTagClass = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'breaking': return styles.tagBreaking;
      case 'environment': return styles.tagEnv;
      case 'health crisis': return styles.tagHealth;
      case 'climate': return styles.tagPolicy;
      case 'disasters': return styles.tagBreaking;
      default: return styles.tagEnv;
    }
  };

  const getTagAccentColorClass = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'breaking': return styles.accentRed;
      case 'environment': return styles.accentTeal;
      case 'health crisis': return styles.accentOrange;
      case 'climate': return styles.accentPurple;
      case 'disasters': return styles.accentRed;
      default: return styles.accentTeal;
    }
  };

  const showFeatured = currentCategory === 'All' && currentPage === 1;
  const featuredStory = showFeatured ? stories[0] || null : null;
  const gridStories = featuredStory ? stories.slice(1) : stories;

  return (
    <div className={styles.page}>
      <ScrollReveal direction="down">
        <PageHero
          theme="news"
          eyebrow="Live Coverage · DCRF Media Desk"
          line1="CLIMATE &amp;"
          line2="DISASTERS"
          subtitle="Latest reporting on emergency warnings, environmental updates, climate policies, and corporate sustainability."
        />
      </ScrollReveal>

      {/* Category Tabs */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className={styles.filterTabs}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${currentCategory === cat ? styles.activeFilter : ''}`}
              onClick={() => router.push(`/news?page=1&category=${encodeURIComponent(cat)}`)}
            >
              {cat}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Featured Big Story Card (Only on 'All' tab, first page) */}
      {showFeatured && featuredStory && (
        <ScrollReveal direction="up" delay={0.2}>
          <div className={styles.featured}>
            <div className={`${styles.featImgContainer} ${getTagAccentColorClass(featuredStory.tag)}`}>
              <img
                src={featuredStory.image_url || getFallbackImg(featuredStory)}
                alt={featuredStory.headline}
                className={styles.featImg}
                onError={(e) => { (e.target as HTMLImageElement).src = getFallbackImg(featuredStory); }}
              />
            </div>
            <div className={styles.featBody}>
              <div className={styles.meta}>
                <span className={`${styles.tag} ${getTagClass(featuredStory.tag)}`}>
                  {featuredStory.tag}
                </span>
                <span>•</span>
                <span>{featuredStory.date || featuredStory.published_date}</span>
                <span>•</span>
                <span className={styles.sourceLabel}>{featuredStory.source}</span>
              </div>
              <h2 className={styles.featTitle}>{featuredStory.headline}</h2>
              <p className={styles.excerpt}>{featuredStory.excerpt}</p>
              {renderReadButton(featuredStory, 'Read full story')}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Stories Grid */}
      <div className={styles.grid}>
        {gridStories.map((story, idx) => (
          <ScrollReveal
            key={story.id}
            direction="up"
            delay={0.05 * (idx % 3)}
          >
            <div className={styles.card}>
              <img
                src={story.image_url || getFallbackImg(story)}
                alt={story.headline}
                className={styles.cardImg}
                onError={(e) => { (e.target as HTMLImageElement).src = getFallbackImg(story); }}
              />
              <div className={styles.cardBody}>
                <div className={styles.cardHeaderRow}>
                  <span className={`${styles.tag} ${getTagClass(story.tag)}`}>
                    {story.tag}
                  </span>
                  <div className={styles.cardMetaRight}>
                    <span className={styles.cardDate}>{story.date || story.published_date}</span>
                    {story.source && (
                      <>
                        <span className={styles.cardMetaDot}>•</span>
                        <span className={styles.cardSource}>{story.source}</span>
                      </>
                    )}
                  </div>
                </div>
                <h3 className={styles.cardTitle}>{story.headline}</h3>
                <p className={styles.cardExcerpt}>{story.excerpt}</p>
                <div style={{ marginTop: 'auto', width: '100%' }}>
                  {renderReadButton(story, 'Read story')}
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Centered Pagination controls */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={`${styles.pageBtn} ${currentPage === 1 ? styles.disabledBtn : ''}`}
            disabled={currentPage === 1}
            onClick={() => router.push(`/news?page=${currentPage - 1}&category=${encodeURIComponent(currentCategory)}`)}
          >
            <ChevronLeft size={16} style={{ marginRight: '4px' }} />
            Prev
          </button>

          {(() => {
            const pages = [];
            const blockIndex = Math.floor((currentPage - 1) / 3);
            const startPage = blockIndex * 3 + 1;
            const endPage = Math.min(totalPages, startPage + 2);

            for (let i = startPage; i <= endPage; i++) {
              pages.push(i);
            }

            return (
              <>
                {pages.map((p) => (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${currentPage === p ? styles.activePageBtn : ''}`}
                    onClick={() => router.push(`/news?page=${p}&category=${encodeURIComponent(currentCategory)}`)}
                  >
                    {p}
                  </button>
                ))}
                {totalPages > endPage && <span className={styles.dots}>...</span>}
              </>
            );
          })()}

          <button
            className={`${styles.pageBtn} ${currentPage === totalPages ? styles.disabledBtn : ''}`}
            disabled={currentPage === totalPages}
            onClick={() => router.push(`/news?page=${currentPage + 1}&category=${encodeURIComponent(currentCategory)}`)}
          >
            Next
            <ChevronRight size={16} style={{ marginLeft: '4px' }} />
          </button>
        </div>
      )}

      {/* Partners Attribution Bar */}
      <ScrollReveal direction="up">
        <div className={styles.attributionBar}>
          <span className={styles.attributionLabel}>
            News stories are syndicated in partnership with leading environmental portals:
          </span>
          <div className={styles.badgeList}>
            <a href="https://disastersnews.com" target="_blank" rel="noopener noreferrer" className={styles.badgeLink}>
              disastersnews.com ↗
            </a>
            <a href="https://thecsruniverse.com" target="_blank" rel="noopener noreferrer" className={styles.badgeLink}>
              thecsruniverse.com ↗
            </a>
            <a href="https://dicaf.org" target="_blank" rel="noopener noreferrer" className={styles.badgeLink}>
              dicaf.org ↗
            </a>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
