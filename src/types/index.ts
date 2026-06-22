export interface NewsItem {
  id: string;
  tag: string;
  source: string;
  headline: string;
  excerpt: string;
  date: string;
  author: string;
  externalLink: string;
  thumbnailEmoji: string;
  category: 'breaking' | 'environment' | 'health' | 'climate' | 'disasters' | 'sustainability' | 'policy';
}

export interface ReportItem {
  id: string;
  title: string;
  category: 'Annual' | 'Policy' | 'CSR' | 'Technical';
  description: string;
  pageCount: number;
  year: number;
  downloadUrl: string;
  accentColor: string;
  icon: string;
}

export interface PodcastEpisode {
  id: string;
  episodeNumber: number;
  tag: string;
  title: string;
  description?: string;
  date: string;
  duration: string;
  speaker: string;
  speakerTitle?: string;
  audioUrl?: string;
  imageUrl?: string;
  isFeatured?: boolean;
}

export interface CouncilMember {
  id: string;
  name: string;
  role: string;
  roleBadgeColor?: 'gold' | 'default' | 'finance';
  avatarInitials: string;
  profileImage?: string;
  bio: string;
  linkedinUrl?: string;
  organization?: string;
}

export interface MembershipTier {
  name: string;
  price: string;
  priceSubText: string;
  isPopular?: boolean;
  features: { [key: string]: boolean };
}

export interface EventFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface PartnerCard {
  id: string;
  name: string;
  description: string;
  borderColor: string;
}

export interface TickerAlert {
  id: string;
  text: string;
}

export interface StatItem {
  id: string;
  count: number;
  suffix: string;
  label: string;
  type: 'red' | 'amber' | 'teal' | 'blue' | 'gold';
}
