import {
  NewsItem,
  ReportItem,
  PodcastEpisode,
  CouncilMember,
  MembershipTier,
  EventFeature,
  PartnerCard,
  TickerAlert,
  StatItem
} from '@/types';

export const tickerAlerts: TickerAlert[] = [
  { id: '1', text: 'Cyclone Alert: Bay of Bengal — Category 2 system tracking towards Odisha coast' },
  { id: '2', text: 'NDMA: 3.2 million affected by monsoon floods across Assam and Bihar' },
  { id: '3', text: 'India records 47°C in Rajasthan — DCRF heatwave advisory issued' },
  { id: '4', text: 'Uttarakhand landslide: 6 districts on high alert, 200+ roads blocked' },
  { id: '5', text: 'Delhi AQI crosses 350 — DCRF air quality panel to convene this week' },
  { id: '6', text: 'IMD issues red alert for heavy rainfall in Maharashtra and Gujarat coast' },
  { id: '7', text: 'DCRC ’26 registrations open — 26–27 November 2026, New Delhi' }
];

export const heroStats: StatItem[] = [
  { id: 'floods', count: 3214, suffix: 'K+', label: 'People affected by floods', type: 'red' },
  { id: 'heat', count: 47, suffix: '°C', label: 'Peak heat recorded', type: 'amber' },
  { id: 'cyclones', count: 18, suffix: '', label: 'Major cyclones (5 yrs)', type: 'teal' },
  { id: 'warming', count: 2.1, suffix: '°C', label: 'India warming above baseline', type: 'blue' }
];

export const cityTemps = [
  { city: 'Mumbai', temp: 31, percentage: 62 },
  { city: 'Delhi', temp: 29, percentage: 58 },
  { city: 'Kolkata', temp: 29, percentage: 58 },
  { city: 'Chennai', temp: 28, percentage: 56 }
];

export const stripStats: StatItem[] = [
  { id: 'annual-events', count: 700, suffix: '+', label: 'Disaster events in India annually', type: 'gold' },
  { id: 'displaced', count: 8, suffix: 'M+', label: 'People displaced by climate events each year', type: 'gold' },
  { id: 'econ-losses', count: 38, suffix: 'B$', label: 'Economic losses from disasters (2024)', type: 'gold' },
  { id: 'threshold', count: 1.5, suffix: '°C', label: 'Paris Agreement warming threshold', type: 'gold' }
];

export const disasterEvents = [
  { label: 'Floods', count: 267, percentage: '82%', class: 'bf-floods' },
  { label: 'Heatwaves', count: 178, percentage: '55%', class: 'bf-heat' },
  { label: 'Cyclones', count: 18, percentage: '28%', class: 'bf-cyclone' },
  { label: 'Landslides', count: 124, percentage: '38%', class: 'bf-land' },
  { label: 'Droughts', count: 96, percentage: '31%', class: 'bf-drought' },
  { label: 'Earthquakes', count: 42, percentage: '18%', class: 'bf-quake' }
];

export const economicLosses = [
  { year: '2019', value: 1.2, display: '₹1.2L Cr', height: 42, color: 'linear-gradient(180deg,#5dade2,#2980b9)' },
  { year: '2020', value: 1.8, display: '₹1.8L Cr', height: 58, color: 'linear-gradient(180deg,#a569bd,#6C3483)' },
  { year: '2021', value: 1.5, display: '₹1.5L Cr', height: 50, color: 'linear-gradient(180deg,#5dade2,#2980b9)' },
  { year: '2022', value: 2.2, display: '₹2.2L Cr', height: 72, color: 'linear-gradient(180deg,#e67e22,#D35400)' },
  { year: '2023', value: 2.6, display: '₹2.6L Cr', height: 85, color: 'linear-gradient(180deg,#e74c3c,#C0392B)' },
  { year: '2024', value: 3.1, display: '₹3.1L Cr', height: 100, color: 'linear-gradient(180deg,#922b21,#641e16)' }
];

export const lossShare = [
  { name: 'Floods', value: 40, color: '#2980b9' },
  { name: 'Heatwaves', value: 22, color: '#C0392B' },
  { name: 'Droughts', value: 16, color: '#E67E22' },
  { name: 'Cyclones', value: 10, color: '#6C3483' },
  { name: 'Others', value: 12, color: '#94A3B8' }
];

// Heatmap data array mapping years 2019-2024 to 12 months of intensity (values out of 10)
export const heatmapData: number[][] = [
  [1, 1, 1, 1, 2, 8, 10, 9, 7, 3, 1, 1], // 2019
  [1, 1, 1, 2, 3, 9, 10, 10, 8, 4, 1, 1], // 2020
  [1, 1, 1, 1, 2, 7, 10, 10, 8, 3, 1, 1], // 2021
  [1, 1, 1, 2, 4, 8, 10, 9, 7, 4, 2, 1], // 2022
  [1, 1, 1, 1, 3, 9, 10, 10, 9, 3, 1, 1], // 2023
  [1, 1, 1, 2, 3, 8, 10, 10, 8, 4, 2, 1]  // 2024
];

export const heatmapYears = ['2019', '2020', '2021', '2022', '2023', '2024'];
export const heatmapMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const newsStories: NewsItem[] = [
  {
    id: 'story-1',
    tag: 'Breaking',
    source: 'disastersnews.com',
    headline: '5.6 Magnitude Earthquake Strikes Bhutan — Tremors Felt Across Northeast India',
    excerpt: 'A 5.6 magnitude earthquake struck Bhutan, with tremors felt across northeast Indian states including Assam, Sikkim and West Bengal. Local agencies have been placed on alert for aftershocks and potential landslides in vulnerable hill districts.',
    date: 'Jun 8, 2026',
    author: 'Editor Desk, disastersnews.com',
    externalLink: 'https://disastersnews.com/13442-2/',
    thumbnailEmoji: '🌋',
    category: 'breaking'
  },
  {
    id: 'story-2',
    tag: 'Environment',
    source: 'disastersnews.com',
    headline: 'Kolkata to Install Cloth Bag Vending Machines, Fine Single-Use Plastic Users',
    excerpt: 'Kolkata Municipal Corporation announces a city-wide push to install cloth bag vending machines at key transit points while implementing fines for single-use plastic, as part of its climate action agenda.',
    date: 'Jun 7, 2026',
    author: 'disastersnews.com',
    externalLink: 'https://disastersnews.com/13436-2/',
    thumbnailEmoji: '🌱',
    category: 'environment'
  },
  {
    id: 'story-3',
    tag: 'Health Crisis',
    source: 'disastersnews.com',
    headline: 'Plastic Pollution Crisis Deepens as Microplastics Found in Human Brains, Blood and Placentas',
    excerpt: 'Scientists confirm microplastics have been detected in human brain tissue, bloodstream and placentas, raising urgent alarms about the long-term health consequences of unchecked plastic pollution.',
    date: 'Jun 7, 2026',
    author: 'disastersnews.com',
    externalLink: 'https://disastersnews.com/13432-2/',
    thumbnailEmoji: '🧠',
    category: 'health'
  },
  {
    id: 'story-4',
    tag: 'Climate',
    source: 'disastersnews.com',
    headline: 'Delhi Loses Nearly Half Its Green Cover as Heat Stress Spreads Across City: CSE Report',
    excerpt: 'A new Centre for Science and Environment report finds Delhi has lost nearly 50% of its green cover over two decades, directly exacerbating urban heat island effects and increasing heatwave mortality risk.',
    date: 'Jun 3, 2026',
    author: 'disastersnews.com',
    externalLink: 'https://disastersnews.com/delhi-loses-nearly-half-its-green-cover-as-heat-stress-spreads-across-city-cse-report/',
    thumbnailEmoji: '☀️',
    category: 'climate'
  },
  {
    id: 'story-5',
    tag: 'Disasters',
    source: 'disastersnews.com',
    headline: "Asia's $170 Billion Disaster Bill Sparks Urgent Call to Shift From Recovery to Resilient Infrastructure",
    excerpt: 'A new Asian Development Bank report finds that Asia incurred $170 billion in disaster-related losses in the last reporting year, calling for a fundamental shift from post-event recovery spending to pre-event resilience infrastructure investment.',
    date: 'Feb 13, 2026',
    author: 'disastersnews.com',
    externalLink: 'https://disastersnews.com/11236-2/',
    thumbnailEmoji: '🌏',
    category: 'disasters'
  },
  {
    id: 'story-6',
    tag: 'Sustainability',
    source: 'thecsruniverse.com',
    headline: 'CASCA ’26: Sustainability is No Longer a Choice — It is a Collective Responsibility',
    excerpt: 'At the Climate Action & Sustainability Conference and Awards 2026 at India International Centre, Ashish Jha, Founder TheCSRUniverse, called for building credible ecosystems to recognise and scale impactful sustainability initiatives at a national level.',
    date: 'Apr 23, 2026',
    author: 'thecsruniverse.com',
    externalLink: 'https://thecsruniverse.com',
    thumbnailEmoji: '☀️',
    category: 'sustainability'
  }
];

export const reports: ReportItem[] = [
  {
    id: 'report-1',
    title: 'India Disaster Risk Index 2025 — Annual Report',
    category: 'Annual',
    description: "Comprehensive ranking of India's 36 states and UTs by composite disaster risk, adaptive capacity and socio-economic vulnerability. Covers 12 hazard types with district-level data.",
    pageCount: 148,
    year: 2025,
    downloadUrl: '#',
    accentColor: '#FDECEA',
    icon: '📙'
  },
  {
    id: 'report-2',
    title: 'Heat Action Protocols for Indian Cities — Policy Brief',
    category: 'Policy',
    description: 'Evidence-based guidance for municipal governments on deploying Heat Action Plans, cooling infrastructure and early warning triggers in cities above 1 million population.',
    pageCount: 32,
    year: 2025,
    downloadUrl: '#',
    accentColor: '#E0F5F1',
    icon: '🌡️'
  },
  {
    id: 'report-3',
    title: 'Flood Resilience Finance: Mobilising CSR & ESG Capital',
    category: 'CSR',
    description: 'Analysis of CSR disclosure data and ESG fund flows into flood resilience, with a 10-point framework for corporates to channel investments into pre-disaster preparedness.',
    pageCount: 56,
    year: 2025,
    downloadUrl: '#',
    accentColor: '#EBF5FB',
    icon: '🌊'
  },
  {
    id: 'report-4',
    title: 'Cyclone Preparedness Framework for East Coast Communities',
    category: 'Technical',
    description: 'Technical guidance integrating traditional knowledge with modern early warning systems for Odisha, Andhra Pradesh and West Bengal coastal districts.',
    pageCount: 72,
    year: 2024,
    downloadUrl: '#',
    accentColor: '#FDF3E3',
    icon: '🌀'
  },
  {
    id: 'report-5',
    title: 'Himalayan Glacier Retreat & Downstream Disaster Risk',
    category: 'Technical',
    description: 'Geospatial assessment of accelerating glacier retreat across the Hindu Kush–Himalaya region and implications for flash floods and water security through 2050.',
    pageCount: 94,
    year: 2024,
    downloadUrl: '#',
    accentColor: '#F5EEF8',
    icon: '🏔️'
  },
  {
    id: 'report-6',
    title: 'Disaster-Tech in India: Geospatial & AI Applications Review',
    category: 'Technical',
    description: 'Survey of 80+ disaster-tech startups deploying satellite imagery, AI-based prediction, drone mapping and IoT sensors for disaster risk reduction across India.',
    pageCount: 66,
    year: 2024,
    downloadUrl: '#',
    accentColor: '#EDF2F8',
    icon: '📡'
  }
];

export const podcastEpisodes: PodcastEpisode[] = [
  {
    id: 'pod-15',
    episodeNumber: 15,
    tag: 'Early Warning',
    title: 'Himalayan Glacial Sensors & Flood Telemetry Calibrations',
    description: 'A visual guide and discussion on sensor deployment protocols and satellite warning triggers in flash-flood zones.',
    date: 'Jun 10, 2026',
    duration: '0:10',
    speaker: 'Dr. Kavita Sharma',
    speakerTitle: 'IIT Delhi',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'pod-14',
    episodeNumber: 14,
    tag: 'Climate Finance',
    title: "Can India's CSR Ecosystem Fund Climate Adaptation at Scale?",
    description: 'Dr. Brijender Mishra speaks with climate finance experts on redirecting corporate giving from post-disaster relief to long-term resilience infrastructure.',
    date: 'Jun 3, 2026',
    duration: '42 min',
    speaker: 'Dr. Brijender Mishra',
    speakerTitle: 'Associate Director, KPMG India',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    videoUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1554475901-4538ddfb1a55?auto=format&fit=crop&w=400&q=80',
    isFeatured: true
  },
  {
    id: 'pod-13',
    episodeNumber: 13,
    tag: 'Heatwaves',
    title: 'Urban Heat Islands: How Indian Cities Are Baking Themselves',
    date: 'May 20, 2026',
    duration: '38 min',
    speaker: 'Prof. Anuradha Sharma',
    speakerTitle: 'IIT Delhi',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    videoUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1525490822463-b459eb6c2948?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'pod-12',
    episodeNumber: 12,
    tag: 'Floods',
    title: 'The Brahmaputra Crisis: Floods, Erosion and Climate Migration',
    date: 'May 6, 2026',
    duration: '51 min',
    speaker: 'Dr. Arup Sarma',
    speakerTitle: 'IIT Guwahati',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    videoUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'pod-11',
    episodeNumber: 11,
    tag: 'Early Warning',
    title: 'AI & Satellite Technology in Disaster Early Warning Systems',
    date: 'Apr 22, 2026',
    duration: '44 min',
    speaker: 'Ms. Priya Menon',
    speakerTitle: 'ISRO',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    videoUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'pod-10',
    episodeNumber: 10,
    tag: 'Policy',
    title: 'Sendai Framework at 10: India’s Progress & Gaps',
    date: 'Apr 8, 2026',
    duration: '56 min',
    speaker: 'Former Secretary',
    speakerTitle: 'NDMA',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    videoUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'pod-9',
    episodeNumber: 9,
    tag: 'Glaciers',
    title: 'Glacial Lake Outburst Floods: The Himalayan Time Bomb',
    date: 'Mar 25, 2026',
    duration: '47 min',
    speaker: 'Dr. Syed Iqbal Hasnain',
    speakerTitle: 'Climate Scientist',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    videoUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80'
  }
];

export const membershipFeatures = [
  'News & analytical information sharing',
  'Capacity building programmes',
  'Stakeholder engagements',
  'Event participation (DCRC)',
  'National Delegation participation',
  'International Delegation participation',
  'Advisory Committee membership'
];

export const membershipTiers: MembershipTier[] = [
  {
    name: 'Basic',
    price: 'Free',
    priceSubText: 'Individual & Student Access',
    features: {
      'News & analytical information sharing': true,
      'Capacity building programmes': true,
      'Stakeholder engagements': false,
      'Event participation (DCRC)': false,
      'National Delegation participation': false,
      'International Delegation participation': false,
      'Advisory Committee membership': false
    }
  },
  {
    name: 'Prime',
    price: '₹20,000',
    priceSubText: 'Per Annum — NGO & Academia',
    features: {
      'News & analytical information sharing': true,
      'Capacity building programmes': true,
      'Stakeholder engagements': false,
      'Event participation (DCRC)': true,
      'National Delegation participation': false,
      'International Delegation participation': false,
      'Advisory Committee membership': false
    }
  },
  {
    name: 'Premium',
    price: '₹50,000',
    priceSubText: 'Per Annum — SME & Consultancies',
    features: {
      'News & analytical information sharing': true,
      'Capacity building programmes': true,
      'Stakeholder engagements': true,
      'Event participation (DCRC)': true,
      'National Delegation participation': true,
      'International Delegation participation': true,
      'Advisory Committee membership': false
    }
  },
  {
    name: 'Gold',
    price: '₹1,00,000',
    priceSubText: 'Per Annum — Corporates & Leaders',
    isPopular: true,
    features: {
      'News & analytical information sharing': true,
      'Capacity building programmes': true,
      'Stakeholder engagements': true,
      'Event participation (DCRC)': true,
      'National Delegation participation': true,
      'International Delegation participation': true,
      'Advisory Committee membership': true
    }
  }
];

export const councilMembers: CouncilMember[] = [
  {
    id: 'bm',
    name: 'Dr. Brijendra Kumar Mishra',
    role: 'Convener, DCRF',
    roleBadgeColor: 'gold',
    avatarInitials: 'BM',
    profileImage: '/councils/brijendra-kumar-mishra.jpg',
    bio: 'Specialist in Climate Change, Disaster Risk Management & Geospatial Technology. Former Consultant at NDMA, Senior Manager at MapmyIndia, and Researcher at DRDO & ICMR. Currently Associate Director — Climate & DRM at KPMG India. PhD with 15+ years spanning GIS, risk-vulnerability analysis and disaster resilience.',
    linkedinUrl: 'https://in.linkedin.com/in/dr-brijendra-kumar-mishra'
  },
  {
    id: 'aj',
    name: 'Mr. Ashish Jha',
    role: 'Secretary General, DCRF',
    avatarInitials: 'AJ',
    profileImage: '/councils/ashish-jha.jpg',
    bio: 'Founder of TheCSRUniverse and Chief Advisor — Strategy & Growth. 19+ years in media, communications and social impact. Has built India’s leading CSR and sustainability media platform, and co-created flagship events CASCA and SICA. Formerly at Press Trust of India, Exchange4media and Careers360.',
    linkedinUrl: 'https://www.linkedin.com/in/ashish-jha-2020'
  },
  {
    id: 'rr',
    name: 'Mr. Rajiv Ranjan',
    role: 'Deputy Secretary General, DCRF',
    avatarInitials: 'RR',
    bio: 'Senior member of the DiCAF Governing Council and Steering Committee representative for DiCAF in the DCRF collaboration. Brings expertise in disaster management, organisational governance and stakeholder coordination across government and civil society networks.',
    organization: 'DiCAF • Steering Committee'
  },
  {
    id: 'gk',
    name: 'Mr. Govind Kumar',
    role: 'Deputy Secretary General, DCRF',
    avatarInitials: 'GK',
    profileImage: '/councils/govind-kumar.jpg',
    bio: 'Deputy Secretary General of DCRF and primary operational point of contact for TCUIF in the federation. Drives day-to-day coordination of the DCRF Secretariat, member engagement and cross-partner communications. Deeply engaged in DCRF’s knowledge, events and outreach agenda.',
    linkedinUrl: 'https://www.linkedin.com/in/govind1729/'
  },
  {
    id: 'dk',
    name: 'Dr. Deepak Kumar Raj',
    role: 'Asst. Secretary General, DCRF',
    avatarInitials: 'DK',
    bio: 'Assistant Secretary General heading day-to-day operations of the DCRF Secretariat alongside Mr. Govind Kumar. Leads monitoring and evaluation of federation activities, working group coordination, and capacity-building programme management across the disaster and climate resilience ecosystem.',
    organization: 'DCRF Secretariat'
  },
  {
    id: 'rk',
    name: 'Ms. Ruchika Kumar',
    role: 'Finance Controller & Treasurer',
    roleBadgeColor: 'finance',
    avatarInitials: 'RK',
    profileImage: '/councils/ruchika-kumar.jpg',
    bio: 'Finance Controller and Treasurer of DCRF, and Steering Committee Member representing TCUIF. Oversees financial governance, revenue reconciliation and budgetary planning across all three pillars. Brings financial management expertise from the social impact and sustainability sector.',
    linkedinUrl: 'https://www.linkedin.com/in/ruchika-kumar-tcu'
  }
];

export const eventFeatures: EventFeature[] = [
  {
    id: 'feat-1',
    icon: '🏛️',
    title: 'Conference & Plenary',
    description: 'Full-day plenary sessions, curated panel discussions and masterclasses with India’s leading voices on disasters and climate.'
  },
  {
    id: 'feat-2',
    icon: '🏆',
    title: 'Recognition Awards',
    description: 'Awards for Best Corporate Disaster Response, Best NGO Initiative, Climate Resilient Community, Disaster-Tech Innovator and Lifetime Achievement.'
  },
  {
    id: 'feat-3',
    icon: '🔬',
    title: 'Disaster-Tech Exhibition',
    description: 'Showcase of disaster-tech, geospatial tools, resilient infrastructure innovations and climate finance instruments.'
  },
  {
    id: 'feat-4',
    icon: '📊',
    title: 'Annual Report Launch',
    description: 'Release of the inaugural Annual Report on Disaster and Climate Action in India — DCRF’s flagship research publication.'
  },
  {
    id: 'feat-5',
    icon: '🌐',
    title: 'Hybrid Format',
    description: 'In-person and virtual participation enabling national-level attendance beyond the venue city.'
  },
  {
    id: 'feat-6',
    icon: '🤝',
    title: 'Networking Zones',
    description: 'Curated interactions between corporates, NGOs, government bodies and funders to catalyse CSR investments.'
  }
];

export const partners: PartnerCard[] = [
  {
    id: 'partner-1',
    name: 'TCU Impact Foundation (TCUIF)',
    description: 'A research and social impact advisory platform covering Sustainability, CSR, ESG and SDGs. Operates flagship platforms CASCA and SICA. Registered under Section 8, Companies Act 2013. CIN: U85500UP2024NPL198637.',
    borderColor: 'var(--navy-primary)'
  },
  {
    id: 'partner-2',
    name: 'DiCAF — Disaster & Climate Action Federation',
    description: 'A recognised Think Tank in Disaster Resilience and Climate Action, with expertise in Risk Assessment, Climate Finance, Geospatial Technology, R&D and Standards. Owner of disastersnews.com. CIN: U88900DL2024NPL425948.',
    borderColor: 'var(--gold-primary)'
  }
];

export const honoraryMembersList = [
  'TERI', 'CEEW', 'WRI', 'Leading IITs', 'Reliance', 'Tata', 'Goonj', 'Wadhwani Foundation', 'Azim Premji Foundation', 'Shiv Nadar Foundation'
];
