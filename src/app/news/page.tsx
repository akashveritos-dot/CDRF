'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import { newsStories } from '@/data/dataStore';
import ScrollReveal from '@/components/ui/ScrollReveal/ScrollReveal';
import { ArrowRight, Globe, ExternalLink, AlertCircle, Leaf, Activity, Sun, Flame, RefreshCw } from 'lucide-react';

const categories = ['All', 'Breaking', 'Environment', 'Health Crisis', 'Climate', 'Disasters', 'Sustainability'];

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
      return <AlertCircle size={36} />;
    case 'environment':
      return <Leaf size={36} />;
    case 'health crisis':
      return <Activity size={36} />;
    case 'climate':
      return <Sun size={36} />;
    case 'disasters':
      return <Flame size={36} />;
    case 'sustainability':
      return <RefreshCw size={36} />;
    default:
      return <Leaf size={36} />;
  }
};

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState('All');

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
    ? newsStories
    : newsStories.filter(story => story.tag.toLowerCase() === activeTab.toLowerCase());

  // First item is featured in visual layout
  const featuredStory = newsStories[0];
  const gridStories = filteredStories.filter(story => story.id !== featuredStory.id || activeTab !== 'All');

  return (
    <div className={styles.page}>
      <ScrollReveal direction="down">
        <div className={styles.header}>
          <h1 className={styles.title}>Climate & Disaster News</h1>
          <p className={styles.subtitle}>
            Latest editorial reporting on environmental updates, climate policies, and corporate sustainability from disastersnews.com and thecsruniverse.com.
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
      {activeTab === 'All' && (
        <ScrollReveal direction="up" delay={0.2}>
          <div className={styles.featured}>
            <div className={`${styles.featImgContainer} ${getTagAccentColorClass(featuredStory.tag)}`}>
              {getCategoryIconFeatured(featuredStory.tag)}
            </div>
            <div className={styles.featBody}>
              <div className={styles.meta}>
                <span className={`${styles.tag} ${getTagClass(featuredStory.tag)}`}>
                  {featuredStory.tag}
                </span>
                <span>•</span>
                <span>{featuredStory.date}</span>
                <span>•</span>
                <span className={styles.sourceLabel}>{featuredStory.source}</span>
              </div>
              <h2 className={styles.featTitle}>{featuredStory.headline}</h2>
              <p className={styles.excerpt}>{featuredStory.excerpt}</p>
              <a
                href={featuredStory.externalLink}
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
              <div className={styles.cardBody}>
                <div className={styles.cardHeaderRow}>
                  <div className={`${styles.iconWrapper} ${getTagAccentColorClass(story.tag)}`}>
                    {getCategoryIcon(story.tag)}
                  </div>
                  <span className={`${styles.tag} ${getTagClass(story.tag)}`}>
                    {story.tag}
                  </span>
                  <span className={styles.cardDate}>{story.date}</span>
                </div>
                <h3 className={styles.cardTitle}>{story.headline}</h3>
                <p className={styles.cardExcerpt}>{story.excerpt}</p>
                <a
                  href={story.externalLink}
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
