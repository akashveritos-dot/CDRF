'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { newsStories as fallbackNews } from '@/data/dataStore';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import { ArrowRight, Globe, ExternalLink, AlertCircle, Leaf, Activity, Sun, Flame, RefreshCw } from 'lucide-react';

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

const getCategoryIcon = (tag: string) => {
  switch (tag.toLowerCase()) {
    case 'breaking':
      return <AlertCircle size={15} />;
    case 'environment':
      return <Leaf size={15} />;
    case 'health crisis':
      return <Activity size={15} />;
    case 'climate':
      return <Sun size={15} />;
    case 'disasters':
      return <Flame size={15} />;
    case 'sustainability':
      return <RefreshCw size={15} />;
    default:
      return <Leaf size={15} />;
  }
};

const getCategoryIconFeatured = (tag: string) => {
  switch (tag.toLowerCase()) {
    case 'breaking':
      return <AlertCircle size={36} style={{ zIndex: 2, position: 'relative' }} />;
    case 'environment':
      return <Leaf size={36} style={{ zIndex: 2, position: 'relative' }} />;
    case 'health crisis':
      return <Activity size={36} style={{ zIndex: 2, position: 'relative' }} />;
    case 'climate':
      return <Sun size={36} style={{ zIndex: 2, position: 'relative' }} />;
    case 'disasters':
      return <Flame size={36} style={{ zIndex: 2, position: 'relative' }} />;
    case 'sustainability':
      return <RefreshCw size={36} style={{ zIndex: 2, position: 'relative' }} />;
    default:
      return <Leaf size={36} style={{ zIndex: 2, position: 'relative' }} />;
  }
};

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setStories(data);
          }
        }
      } catch (err) {
        console.warn('Failed to load dynamic news.', err);
      } finally {
        setLoading(false);
      }
    }
    loadNews();
  }, []);

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

  const filteredStories = activeTab === 'All'
    ? stories
    : stories.filter(story => story.tag.toLowerCase() === activeTab.toLowerCase() || story.category?.toLowerCase() === activeTab.toLowerCase());

  // First item is featured in visual layout (if available)
  const featuredStory = stories[0] || null;
  const gridStories = featuredStory
    ? filteredStories.filter(story => story.id !== featuredStory.id || activeTab !== 'All')
    : filteredStories;

  if (loading) {
    return (
      <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <span className="pulse-dot sonar-emitter" style={{ width: '12px', height: '12px' }}>
            <span className="sonar-pulse" />
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px' }}>Retrieving live disaster intelligence...</span>
        </div>
      </div>
    );
  }

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
              {/* Always show image — fall back via onError */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
              <a
                href={featuredStory.externalLink || featuredStory.external_link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.readBtn}
              >
                Read full story
                <ExternalLink size={12} />
              </a>
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
              {/* Always show image — onError falls back to category Unsplash */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
                <a
                  href={story.externalLink || story.external_link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.readBtn}
                  style={{ marginTop: 'auto' }}
                >
                  Read story
                  <ExternalLink size={12} />
                </a>
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
