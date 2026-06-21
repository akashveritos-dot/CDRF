'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import { ExternalLink } from 'lucide-react';

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
}

export default function NewsPageClient({ initialStories }: NewsPageClientProps) {
  const [activeTab, setActiveTab] = useState('All');
  const [stories] = useState<any[]>(initialStories);

  const renderReadButton = (story: any, label: string = 'Read story') => {
    const hasFullContent = story.full_content && story.full_content.trim().length > 0;
    const hasExternalLink = story.external_link && story.external_link.trim().length > 0 && story.external_link !== '#';

    if (hasFullContent || !hasExternalLink) {
      return (
        <Link href={`/news/${story.id}`} className={styles.readBtn}>
          {label}
        </Link>
      );
    }

    return (
      <a
        href={story.external_link}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.readBtn}
      >
        {label}
        <ExternalLink size={12} />
      </a>
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

  const sortedStories = React.useMemo(() => {
    return [...stories].sort((a, b) => {
      const dateA = new Date(a.published_date || a.date).getTime();
      const dateB = new Date(b.published_date || b.date).getTime();
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      return (b.id || 0) - (a.id || 0);
    });
  }, [stories]);

  const filteredStories = React.useMemo(() => {
    if (activeTab === 'All') return sortedStories;
    return sortedStories.filter(story => {
      const tag = story.tag?.toLowerCase();
      const cat = story.category?.toLowerCase();
      const active = activeTab.toLowerCase();
      if (tag === active || cat === active) return true;
      if (active === 'health crisis' && (cat === 'health' || tag === 'health')) return true;
      return false;
    });
  }, [sortedStories, activeTab]);

  const featuredStory = sortedStories[0] || null;
  const gridStories = featuredStory
    ? filteredStories.filter(story => story.id !== featuredStory.id || activeTab !== 'All')
    : filteredStories;

  return (
    <div className={styles.page}>
      <ScrollReveal direction="down">
        <div className={styles.header}>
          <h1 className={styles.title}>Climate & Disaster News</h1>
          <p className={styles.subtitle}>
            Latest reporting on emergency warnings, environmental updates, climate policies, and corporate sustainability.
          </p>
        </div>
      </ScrollReveal>

      {/* Category Tabs */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className={styles.filterTabs}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${activeTab === cat ? styles.activeFilter : ''}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Featured Big Story Card (Only on 'All' tab) */}
      {activeTab === 'All' && featuredStory && (
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
                  <span className={styles.cardDate}>{story.date || story.published_date}</span>
                  {story.source && (
                    <>
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>•</span>
                      <span style={{ color: 'var(--gold-primary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{story.source}</span>
                    </>
                  )}
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
