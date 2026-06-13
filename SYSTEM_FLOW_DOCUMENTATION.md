# DCRF Platform - Complete System Flow Documentation

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Data Sources & Backend Services](#data-sources--backend-services)
3. [Section-by-Section Flow Analysis](#section-by-section-flow-analysis)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Database Schema](#database-schema)
6. [Data Flow Diagrams](#data-flow-diagrams)

---

## System Architecture Overview

The DCRF (Disaster & Climate Resilience Federation) platform is a Next.js 16 web application with the following architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
│  Next.js 16 App Router + React 19 + TypeScript + Framer Motion │
└────────────────┬───────────────────────────┬────────────────────┘
                 │                           │
        ┌────────▼──────────┐       ┌───────▼────────┐
        │  Static Pages     │       │  API Routes    │
        │  (SSR/SSG)        │       │  (/api/...)    │
        └───────────────────┘       └───────┬────────┘
                                            │
                                    ┌───────▼────────┐
                                    │  Database      │
                                    │  (MySQL)       │
                                    └────────────────┘
```

### Technology Stack
- **Frontend**: Next.js 16.2.9, React 19.2.4, TypeScript, Framer Motion (animations)
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: MySQL (with mysql2 driver)
- **Data Visualization**: Recharts library
- **External APIs**: Open-Meteo Weather API
- **Data Scraping**: Custom RSS parser for news feeds

---

## Data Sources & Backend Services

### 1. **Primary Database (MySQL)**
**Location**: Configured via environment variables in `.env`
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`

**Tables**:
```sql
- ticker_alerts      (emergency ticker notifications)
- hero_stats        (homepage statistics)
- city_temps        (city temperature data)
- disaster_events   (disaster event counts by type)
- economic_losses   (economic loss data by year)
- loss_share        (disaster loss distribution)
- state_hazards     (India map state hazard data)
- monsoon_heatmap   (heatmap intensity data)
- news              (news articles)
- reports           (research reports/publications)
- scraped_content   (raw scraped data before publishing)
- memberships       (membership applications)
- users             (admin authentication)
```

### 2. **External Weather API**
**Service**: Open-Meteo API  
**Endpoint**: `https://api.open-meteo.com/v1/forecast`
**Usage**: Real-time temperature data for major Indian cities
**Cities Tracked**: Chennai, Delhi, Kolkata, Mumbai
**Fetch Location**: `/api/telemetry` route (server-side)

### 3. **RSS Feed Scraping**
**Scraper Implementation**: `/src/lib/scraper.ts`
**Target Feeds**:
- `disastersnews.com/feed/`
- `thecsruniverse.com/feed/`
- `pib.gov.in/RssMain.aspx` (Press Information Bureau)
- `reliefweb.int/country/ind/rss.xml`

**Scraping Features**:
- Custom XML parser (handles CDATA, media tags, enclosures)
- Image extraction (RSS enclosures → OG tags → fallback)
- Automatic categorization (keyword-based classifier)
- Location extraction (detects Indian states/cities)
- Duplicate prevention (INSERT IGNORE on URL)

**Trigger Methods**:
1. Cron job via `/api/scrape?secret=<CRON_SECRET>`
2. Manual admin trigger via authenticated session

---

## Section-by-Section Flow Analysis

### 1. HOMEPAGE (`/src/app/page.tsx`)

#### **A. Hero Section**
**Data Sources**:
- `heroStats` from API `/api/telemetry` (floods, heat, cyclones, warming)
- `cityTemps` from Open-Meteo API (via telemetry route)
- Fallback data from `/src/data/dataStore.ts`

**Data Flow**:
```
1. Component mounts → useEffect triggers
2. fetch('/api/telemetry')
3. API queries MySQL hero_stats & city_temps tables
4. API calls Open-Meteo (lat/lon for 4 cities)
5. Response updates state: setStats(), setTemps()
6. UI renders animated statistics & temperature bars
7. Poll every 8 seconds for live updates
```

**Visual Elements**:
- CountUp animation for statistics
- Temperature bars with percentage fill animation
- Climate monitor panel with live telemetry badge

---

#### **B. Stats Strip**
**Data Sources**:
- Dynamic counters from `/api/telemetry` → `homepageStats` object

**Calculations**:
```javascript
homepageStats = {
  activeIncidents: SUM(disaster_events.count),
  countriesAffected: 6 (static),
  reportsPublished: COUNT(reports),
  alertsIssued: COUNT(ticker_alerts)
}
```

**UI**: Animated number counters with CountUp component

---

#### **C. Interactive Data Dashboard**

**Sub-components**:

1. **India Map** (`/src/components/insights/IndiaMap/IndiaMap.tsx`)
   - **Data**: `state_hazards` table (from telemetry API)
   - **Schema**: 
     ```
     {
       id, name, hazardLevel (High/Medium/Low), 
       primaryDisaster, affectedCount, description, path (SVG)
     }
     ```
   - **Actions**: Click state → show tooltip with hazard details
   - **Visual**: Color-coded SVG map (red=high, yellow=medium, green=low)

2. **Climate Gauge** (`/src/components/insights/ClimateGauge/ClimateGauge.tsx`)
   - **Data**: `hero_stats.warming` field (temperature anomaly)
   - **Updates**: Real-time with micro-fluctuations every 4s
   - **Visual**: Animated dial gauge with gradient track

3. **Disaster Events Bar Chart**
   - **Data**: `disaster_events` table
   - **Schema**: `{ label, count, percentage, class_name }`
   - **Display**: Horizontal bars with trend badges (▲/▼)

4. **Economic Loss Chart** (`/src/components/insights/LossChart/LossChart.tsx`)
   - **Data**: `economic_losses` table (2019-2024)
   - **Library**: Recharts BarChart
   - **Schema**: `{ year, value, display, color (gradient) }`

5. **Donut Chart** (`/src/components/insights/DonutChart/DonutChart.tsx`)
   - **Data**: `loss_share` table
   - **Schema**: `{ name, value, color }`
   - **Visual**: Pie chart showing loss distribution by disaster type

6. **Monsoon Heatmap** (`/src/components/insights/Heatmap/Heatmap.tsx`)
   - **Data**: `monsoon_heatmap` table
   - **Schema**: 2D grid `[year][month] = intensity (0-10)`
   - **Visual**: Color-coded grid (blue=low → red=high)

---

#### **D. Latest News Feed**
**Data Sources**:
- API: `fetch('/api/news')` → returns last 3 news items
- Database: `news` table
- Fallback: `/src/data/dataStore.ts` → `newsStories`

**Data Schema**:
```javascript
{
  id, tag, source, headline, excerpt, published_date,
  author, external_link, thumbnail_emoji, image_url, 
  category, location
}
```

**User Actions**:
- Click "Read Original Article" → Opens external_link in new tab
- Click "View All Broadcasts" → Navigate to `/news` page

---

#### **E. Latest Reports Section**
**Data Sources**:
- API: `fetch('/api/reports')` → returns last 3 reports
- Database: `reports` table

**Data Schema**:
```javascript
{
  id, title, category, description, page_count, year,
  download_url, accent_color, icon, image_url, source,
  region, disaster_type, severity_level, affected_population
}
```

**User Actions**:
- Click "View Document" → Opens download_url (or shows toast)
- Click "Browse Publications Library" → Navigate to `/reports`

---

### 2. NEWS PAGE (`/src/app/news/page.tsx`)

**Data Flow**:
```
1. Page loads → useEffect fetch('/api/news')
2. API queries MySQL: SELECT * FROM news ORDER BY published_date DESC
3. Frontend receives array of news objects
4. User filters by category → client-side filter
5. Featured story (first item) shown in large card
6. Remaining stories shown in grid layout
```

**Features**:
- Category tabs: All, Breaking, Environment, Health Crisis, Climate, Disasters, Sustainability
- Category-based image fallbacks (Unsplash URLs)
- Relative time display ("2 days ago", "Just now")
- Partner attribution bar (links to source sites)

**User Actions**:
- Select category → Filter news stories
- Click news card → Opens external article link

---

### 3. REPORTS PAGE (`/src/app/reports/page.tsx`)

**Data Flow**:
```
1. Page loads → fetch('/api/reports')
2. API: SELECT * FROM reports ORDER BY year DESC, id DESC
3. Frontend receives reports array
4. User can:
   - Filter by category (All, Annual, Policy, CSR, Technical)
   - Search by keywords (title, description, region, hazard)
```

**Report Card Schema**:
```javascript
{
  Icon (BookOpen, Thermometer, Waves, etc.),
  Title, Description,
  Metadata: {
    Source, Region, Hazard, Severity,
    Year, Page Count
  },
  Download button → opens download_url
}
```

**Actions**:
- Download button → If URL exists, open in new tab; else show toast
- Search input → Client-side filter on multiple fields
- Category tabs → Filter by report.category

---

### 4. MEMBERSHIP PAGE (`/src/app/membership/page.tsx`)

**Sections**:

#### **A. Membership Tiers Display**
**Data Source**: `/src/data/dataStore.ts` → `membershipTiers` array

**Tier Structure**:
```javascript
{
  name: 'Basic' | 'Prime' | 'Premium' | 'Gold',
  price: 'Free' | '₹20,000' | '₹50,000' | '₹1,00,000',
  priceSubText: string,
  features: { [featureName]: boolean },
  isPopular?: boolean
}
```

**Features Matrix**: 7 features × 4 tiers shown as comparison table

**User Actions**:
- Click "Select [Tier]" → Scrolls to registration form
- Form pre-fills selected tier

---

#### **B. Membership Application Form**
**Endpoint**: `/api/membership/apply` (POST)

**Form Fields**:
```javascript
{
  name: string (required),
  email: string (required),
  organization: string (required),
  title: string,
  tier: 'Basic' | 'Prime' | 'Premium' | 'Gold',
  message: string (textarea)
}
```

**Data Flow**:
```
1. User fills form → Submit
2. POST /api/membership/apply
3. API inserts into memberships table
4. Response: { success: true, membershipId }
5. Frontend shows success message
6. Option to "Register Another"
```

**Database Storage**:
```sql
INSERT INTO memberships (name, email, organization, title, tier, message, status, created_at)
VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW())
```

---

### 5. EVENT PAGE (`/src/app/event/page.tsx`)

**Purpose**: DCRC 2026 Conclave information and registration

**Sections**:

#### **A. Event Banner**
- Date: November 26-27, 2026
- Location: India International Centre, New Delhi
- Live countdown timer (days, hours, minutes, seconds)

**Countdown Logic**:
```javascript
targetDate = new Date('2026-11-26T09:30:00+05:30')
setInterval(() => {
  calculate difference from now
  update: { days, hours, minutes, seconds }
}, 1000)
```

---

#### **B. Event Features Grid**
**Data Source**: `/src/data/dataStore.ts` → `eventFeatures`

```javascript
[
  { id, icon (emoji), title, description },
  // Conference, Awards, Tech Exhibition, Report Launch, etc.
]
```

---

#### **C. Agenda Schedule**
- **Day 1 Schedule**: 4 time-slots with sessions
- **Day 2 Schedule**: 4 time-slots with sessions
- Toggle tabs to switch between days

---

#### **D. Registration Form**
**Endpoint**: `/api/event/register` (assumed - not implemented in codebase)

**Form Fields**:
```javascript
{
  name, email, company, designation,
  role: 'In-Person Delegate' | 'Virtual Delegate' | 'Exhibitor' | 'Media'
}
```

**User Flow**:
```
1. Fill form → Submit
2. Show success message: "Interest Registered!"
3. Option to "Register Another"
```

*Note: Backend endpoint not found in codebase - likely needs implementation*

---

### 6. COUNCIL PAGE (`/src/app/council/page.tsx`)

**Data Source**: `/src/data/dataStore.ts` → `councilMembers` array

**Member Card Schema**:
```javascript
{
  id, name, role, roleBadgeColor,
  avatarInitials, bio, linkedinUrl, organization
}
```

**Display**:
- Grid of profile cards
- Convener card highlighted (gold border)
- LinkedIn profile links
- Advisory Council description section

---

### 7. ABOUT PAGE (`/src/app/about/page.tsx`)

**Sections**:

#### **A. Federation Overview**
- Foundation date: June 4, 2026
- Mission statement
- Vision statement
- Partner organizations (TCUIF, DiCAF)

**Data Source**: `/src/data/dataStore.ts` → `partners` array

---

#### **B. Timeline**
- Vertical timeline with milestones
- Each milestone: date, title, description
- Animation on scroll reveal

---

## API Endpoints Reference

### Public Endpoints

#### `GET /api/telemetry`
**Purpose**: Fetch all dashboard and map data  
**Response**:
```javascript
{
  tickerAlerts: Alert[],
  heroStats: Stat[],
  cityTemps: CityTemp[],
  disasterEvents: Event[],
  economicLosses: Loss[],
  lossShare: Share[],
  stateHazards: StateHazard[],
  heatmapData: number[][],
  homepageStats: {
    activeIncidents, countriesAffected,
    reportsPublished, alertsIssued
  }
}
```
**Special**: Fetches real-time weather from Open-Meteo  
**Caching**: Revalidates every 60 seconds

---

#### `GET /api/news?category=<category>&limit=<n>&after_id=<id>`
**Purpose**: Fetch news stories  
**Query Params**:
- `category`: Filter by category (optional)
- `limit`: Max items to return (optional)
- `after_id`: Pagination cursor (optional)

**Response**: Array of news objects  
**SQL**: `SELECT * FROM news WHERE category = ? ORDER BY published_date DESC LIMIT ?`

---

#### `GET /api/reports?category=<category>`
**Purpose**: Fetch research reports  
**Query Params**:
- `category`: Filter by category (optional)

**Response**: Array of report objects  
**SQL**: `SELECT * FROM reports ORDER BY year DESC, id DESC`

---

#### `POST /api/membership/apply`
**Purpose**: Submit membership application  
**Auth**: Public (no auth required)  
**Body**:
```javascript
{
  name, email, organization, title, tier, message
}
```
**Response**:
```javascript
{
  success: true,
  membershipId: number,
  message: "Application submitted successfully"
}
```

---

### Admin-Protected Endpoints

**Authentication**: Session-based via cookies  
**Cookie Name**: `auth_token`  
**Verification**: `/src/lib/auth.ts` → `verifyToken()`

---

#### `POST /api/telemetry`
**Purpose**: Update telemetry data (stats, alerts, state hazards)  
**Auth**: Admin only (role: ADMIN)  
**Body**:
```javascript
{
  type: 'alert' | 'stat' | 'temp' | 'state',
  data: { ... }
}
```

**Operations**:
- `alert`: Add/edit ticker alerts
- `stat`: Update hero statistics
- `temp`: Update city temperatures
- `state`: Update state hazard levels

---

#### `POST /api/news`
**Purpose**: Create a news story  
**Auth**: Admin only  
**Body**:
```javascript
{
  tag, source, headline, excerpt, full_content,
  published_date, author, external_link,
  thumbnail_emoji, image_url, category
}
```

---

#### `POST /api/reports`
**Purpose**: Create a report  
**Auth**: Admin only  
**Body**:
```javascript
{
  title, category, description, page_count,
  year, download_url, accent_color, icon,
  image_url
}
```

---

#### `GET/POST /api/scrape?secret=<CRON_SECRET>`
**Purpose**: Trigger RSS feed scraper  
**Auth**: Cron secret OR admin session  
**Process**:
```
1. Fetch RSS feeds from 4 sources
2. Parse XML items (title, link, description, date, image)
3. Classify category (keyword-based)
4. Extract location (state/city detection)
5. Resolve image (RSS → OG → fallback)
6. INSERT IGNORE into scraped_content table
7. Auto-publish as News or Report
8. Return: { success, itemsScraped, errors }
```

---

## Database Schema

### Core Tables

#### `ticker_alerts`
```sql
CREATE TABLE ticker_alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `hero_stats`
```sql
CREATE TABLE hero_stats (
  id VARCHAR(50) PRIMARY KEY,
  count DECIMAL(10,2) NOT NULL,
  suffix VARCHAR(10),
  label VARCHAR(255) NOT NULL,
  type VARCHAR(20) -- 'red', 'amber', 'teal', 'blue'
);
```

#### `city_temps`
```sql
CREATE TABLE city_temps (
  city VARCHAR(100) PRIMARY KEY,
  temp INT NOT NULL,
  percentage INT NOT NULL
);
```

#### `disaster_events`
```sql
CREATE TABLE disaster_events (
  label VARCHAR(100) PRIMARY KEY,
  count INT NOT NULL,
  percentage VARCHAR(10),
  class_name VARCHAR(50) -- CSS class for styling
);
```

#### `economic_losses`
```sql
CREATE TABLE economic_losses (
  year VARCHAR(4) PRIMARY KEY,
  value DECIMAL(10,2) NOT NULL,
  display VARCHAR(50),
  color VARCHAR(100) -- Gradient CSS
);
```

#### `loss_share`
```sql
CREATE TABLE loss_share (
  name VARCHAR(100) PRIMARY KEY,
  value INT NOT NULL,
  color VARCHAR(20) -- Hex color
);
```

---

#### `state_hazards` (India Map Data)
```sql
CREATE TABLE state_hazards (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  hazard_level ENUM('High', 'Medium', 'Low'),
  primary_disaster VARCHAR(100),
  affected_count TEXT,
  description TEXT,
  path TEXT -- SVG path data
);
```

---

#### `monsoon_heatmap`
```sql
CREATE TABLE monsoon_heatmap (
  year VARCHAR(4) NOT NULL,
  month VARCHAR(10) NOT NULL,
  intensity INT NOT NULL, -- 0-10 scale
  PRIMARY KEY (year, month)
);
```

---

#### `news`
```sql
CREATE TABLE news (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tag VARCHAR(50),
  source VARCHAR(255),
  headline VARCHAR(500) NOT NULL,
  excerpt TEXT NOT NULL,
  full_content LONGTEXT,
  published_date DATE NOT NULL,
  author VARCHAR(255),
  external_link VARCHAR(500) UNIQUE,
  thumbnail_emoji VARCHAR(10),
  image_url VARCHAR(500),
  category VARCHAR(50) NOT NULL,
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### `reports`
```sql
CREATE TABLE reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(500) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  page_count INT DEFAULT 0,
  year INT NOT NULL,
  download_url VARCHAR(500),
  accent_color VARCHAR(20),
  icon VARCHAR(10),
  image_url VARCHAR(500),
  source VARCHAR(255),
  region VARCHAR(100),
  disaster_type VARCHAR(100),
  severity_level VARCHAR(50),
  affected_population VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### `scraped_content` (Scraper Queue)
```sql
CREATE TABLE scraped_content (
  id INT PRIMARY KEY AUTO_INCREMENT,
  headline VARCHAR(500) NOT NULL,
  excerpt TEXT NOT NULL,
  source VARCHAR(255) NOT NULL,
  url VARCHAR(500) UNIQUE NOT NULL,
  category VARCHAR(50),
  status ENUM('Pending', 'Published', 'Rejected') DEFAULT 'Pending',
  image_url VARCHAR(500),
  location VARCHAR(100),
  published_date DATE,
  published_id INT,
  published_type ENUM('News', 'Report'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### `memberships`
```sql
CREATE TABLE memberships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  organization VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  tier VARCHAR(50) NOT NULL,
  message TEXT,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### `users` (Admin Authentication)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Hashed
  role ENUM('ADMIN', 'EDITOR') DEFAULT 'EDITOR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Data Flow Diagrams

### 1. Homepage Data Flow

```
┌───────────────────────────────────────────────────────────────────┐
│                     USER VISITS HOMEPAGE                           │
└─────────────────────────┬─────────────────────────────────────────┘
                          │
            ┌─────────────▼─────────────┐
            │   page.tsx loads          │
            │   (Client Component)      │
            └─────────────┬─────────────┘
                          │
         ┌────────────────┴────────────────┐
         │        useEffect triggers       │
         │   fetch('/api/telemetry')      │
         └────────────────┬────────────────┘
                          │
            ┌─────────────▼─────────────┐
            │  API Route Handler        │
            │  /api/telemetry/route.ts │
            └─────────────┬─────────────┘
                          │
         ┌────────────────┴────────────────────────────┐
         │                                             │
    ┌────▼────┐                              ┌────────▼──────────┐
    │  MySQL  │                              │  Open-Meteo API   │
    │  Query  │                              │  Weather Fetch    │
    └────┬────┘                              └────────┬──────────┘
         │                                            │
         │  - hero_stats                              │  - Chennai
         │  - city_temps                              │  - Delhi
         │  - disaster_events                         │  - Kolkata
         │  - economic_losses                         │  - Mumbai
         │  - loss_share                              │
         │  - state_hazards                           │
         │  - monsoon_heatmap                         │
         │  - COUNT aggregations                      │
         │                                            │
         └────────────────┬───────────────────────────┘
                          │
            ┌─────────────▼─────────────┐
            │   JSON Response           │
            │   {                       │
            │     heroStats: [...],     │
            │     cityTemps: [...],     │
            │     disasterEvents: [...],│
            │     economicLosses: [...],│
            │     lossShare: [...],     │
            │     stateHazards: [...],  │
            │     heatmapData: [...],   │
            │     homepageStats: {...}  │
            │   }                       │
            └─────────────┬─────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  React State Updates:           │
         │  - setStats()                   │
         │  - setTemps()                   │
         │  - setEvents()                  │
         │  - setLossesData()              │
         │  - setShareData()               │
         │  - setHeatmapData()             │
         │  - setHomeStats()               │
         └────────────────┬────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │   UI Re-renders with:           │
         │   - Animated statistics         │
         │   - Temperature bars            │
         │   - India map (interactive)     │
         │   - Climate gauge               │
         │   - Bar charts                  │
         │   - Loss chart (Recharts)       │
         │   - Donut chart                 │
         │   - Heatmap                     │
         └─────────────────────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │   Polling Timer                 │
         │   setInterval(loadTelemetry,    │
         │               8000)             │
         │   → Refreshes data every 8s     │
         └─────────────────────────────────┘
```

---

### 2. News Feed Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   USER VISITS NEWS PAGE                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
            ┌─────────────▼─────────────┐
            │   news/page.tsx loads     │
            │   fetch('/api/news')      │
            └─────────────┬─────────────┘
                          │
            ┌─────────────▼─────────────┐
            │  API: /api/news/route.ts  │
            │  GET handler              │
            └─────────────┬─────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  MySQL Query:                   │
         │  SELECT * FROM news             │
         │  WHERE category = ?             │
         │  ORDER BY published_date DESC   │
         │  LIMIT ?                        │
         └────────────────┬────────────────┘
                          │
            ┌─────────────▼─────────────┐
            │   Returns news array      │
            │   [{                      │
            │     headline, excerpt,    │
            │     category, image_url,  │
            │     external_link, ...    │
            │   }]                      │
            └─────────────┬─────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  Frontend State Update:         │
         │  setStories(data)               │
         └────────────────┬────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  User Interactions:             │
         │  1. Filter by category tab      │
         │     → Client-side filter        │
         │  2. Click news card             │
         │     → Open external_link        │
         └─────────────────────────────────┘
```

---

### 3. RSS Scraper Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                  CRON JOB OR ADMIN TRIGGERS                       │
│               GET /api/scrape?secret=<SECRET>                     │
└─────────────────────────┬────────────────────────────────────────┘
                          │
            ┌─────────────▼─────────────┐
            │  /api/scrape/route.ts     │
            │  Verify auth/secret       │
            └─────────────┬─────────────┘
                          │
            ┌─────────────▼─────────────┐
            │  runScraper() in          │
            │  /src/lib/scraper.ts      │
            └─────────────┬─────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  Loop through 4 RSS feeds:      │
         │  1. disastersnews.com           │
         │  2. thecsruniverse.com          │
         │  3. pib.gov.in                  │
         │  4. reliefweb.int               │
         └────────────────┬────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  For each feed:                 │
         │  1. Fetch XML (6s timeout)      │
         │  2. Parse RSS items:            │
         │     - Extract title, link,      │
         │       description, pubDate      │
         │     - Extract image from:       │
         │       • <enclosure> tag         │
         │       • <media:content>         │
         │       • <img> in description    │
         │  3. Classify category           │
         │     (keyword matching)          │
         │  4. Extract location            │
         │     (Indian state detection)    │
         └────────────────┬────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  For each parsed item:          │
         │  1. Fetch OG image from URL     │
         │     (3s timeout)                │
         │  2. Fallback to category image  │
         │     (Unsplash URLs)             │
         └────────────────┬────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  Database Operations:           │
         │  1. INSERT IGNORE INTO          │
         │     scraped_content             │
         │     (prevents duplicates)       │
         │  2. Auto-publish decision:      │
         │     IF reliefweb OR technical   │
         │       → INSERT INTO reports     │
         │     ELSE                        │
         │       → INSERT INTO news        │
         │  3. UPDATE scraped_content      │
         │     SET status='Published',     │
         │         published_id=?          │
         └────────────────┬────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  Return Result:                 │
         │  {                              │
         │    success: true,               │
         │    itemsScraped: number,        │
         │    errors: string[]             │
         │  }                              │
         └─────────────────────────────────┘
```

---

### 4. Membership Application Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                USER VISITS MEMBERSHIP PAGE                        │
└─────────────────────────┬────────────────────────────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  Display 4 membership tiers:    │
         │  - Basic (Free)                 │
         │  - Prime (₹20,000/yr)           │
         │  - Premium (₹50,000/yr)         │
         │  - Gold (₹1,00,000/yr)          │
         │                                 │
         │  Data from:                     │
         │  /src/data/dataStore.ts         │
         │  → membershipTiers array        │
         └────────────────┬────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  User clicks "Select [Tier]"    │
         │  → Scroll to form section       │
         │  → Pre-fill tier dropdown       │
         └────────────────┬────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  User fills form:               │
         │  - Name (required)              │
         │  - Email (required)             │
         │  - Organization (required)      │
         │  - Job Title                    │
         │  - Tier (dropdown)              │
         │  - Message (textarea)           │
         └────────────────┬────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  Form Submit:                   │
         │  POST /api/membership/apply     │
         │  Body: formData object          │
         └────────────────┬────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  API Handler:                   │
         │  /api/membership/apply/route.ts │
         │  (NOT IMPLEMENTED YET -         │
         │   needs to be created)          │
         │                                 │
         │  Expected logic:                │
         │  1. Validate inputs             │
         │  2. INSERT INTO memberships     │
         │     (name, email, org,          │
         │      title, tier, message,      │
         │      status='Pending')          │
         │  3. Return success response     │
         └────────────────┬────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  Frontend Response Handling:    │
         │  1. Show success message        │
         │  2. Display submitted tier      │
         │  3. Option: "Register Another"  │
         │     → Reset form                │
         └─────────────────────────────────┘
```

---

## External Data Integration

### Open-Meteo Weather API Integration

**Implementation**: `/src/app/api/telemetry/route.ts`

```javascript
// Fetch real-time temperatures for 4 cities
const weatherRes = await fetch(
  'https://api.open-meteo.com/v1/forecast?' +
  'latitude=13.0827,28.6139,22.5726,19.0760&' +
  'longitude=80.2707,77.2090,88.3639,72.8777&' +
  'current=temperature_2m',
  { next: { revalidate: 60 } } // Cache 60 seconds
);

// Cities: Chennai, Delhi, Kolkata, Mumbai
// Returns: temperature_2m (current temp in Celsius)
```

**Data Transformation**:
```javascript
cityTemps = [
  {
    city: 'Chennai',
    temp: Math.round(weatherData[0].current.temperature_2m),
    percentage: Math.round((temp / 50) * 100) // Visual bar width
  },
  // ... repeat for Delhi, Kolkata, Mumbai
];

// Sort by temperature descending
cityTemps.sort((a, b) => b.temp - a.temp);
```

---

## Component-Level Data Flow

### 1. IndiaMap Component

**Location**: `/src/components/insights/IndiaMap/IndiaMap.tsx`

**Data Flow**:
```
1. Fetch state hazards from parent (via props or direct API call)
2. SVG map with state paths (hardcoded in component)
3. Each state: { id, name, hazardLevel, primaryDisaster, path }
4. Color coding:
   - High → Red tones (#C0392B)
   - Medium → Yellow/Amber tones (#F39C12)
   - Low → Green tones (#27AE60)
5. User hovers state → Show tooltip with details
6. User clicks state → Expand detail panel
```

**State Management**:
```javascript
const [selectedState, setSelectedState] = useState(null);
const [hoveredState, setHoveredState] = useState(null);

// Render SVG paths with event handlers
<path
  d={state.path}
  className={getHazardClass(state.hazardLevel)}
  onMouseEnter={() => setHoveredState(state)}
  onClick={() => setSelectedState(state)}
/>
```

---

### 2. ClimateGauge Component

**Location**: `/src/components/insights/ClimateGauge/ClimateGauge.tsx`

**Data Flow**:
```
1. Fetch anomaly value from API telemetry
2. Base anomaly (e.g., +2.10°C)
3. Add micro-fluctuations every 4s (±0.02°C)
4. Calculate needle angle: (anomaly / 3.0) * 180 - 90
5. Animate needle with Framer Motion spring animation
```

**Implementation**:
```javascript
useEffect(() => {
  fetch('/api/telemetry').then(data => {
    const warmingStat = data.heroStats.find(s => s.id === 'warming');
    setBaseAnomaly(warmingStat.count); // e.g., 2.10
  });
}, []);

// Micro-fluctuations for "live" feel
useEffect(() => {
  setInterval(() => {
    const change = (Math.random() - 0.5) * 0.02;
    setAnomaly(baseAnomaly + change);
  }, 4000);
}, [baseAnomaly]);

// Needle rotation
const rotationAngle = (anomaly / 3.0) * 180 - 90;
// -90° (left) = 0°C, 0° (center) = 1.5°C, +90° (right) = 3°C
```

---

### 3. LossChart Component (Recharts)

**Location**: `/src/components/insights/LossChart/LossChart.tsx`

**Data Flow**:
```
1. Receive economicLosses array from parent
   [{ year, value, display, color }, ...]
2. Transform to Recharts format:
   [{ name: year, Losses: value }, ...]
3. Use ResizeObserver to track container width
4. Render BarChart with gradient fills per year
5. Custom tooltip shows formatted loss value
```

**Gradient Configuration**:
```javascript
<defs>
  <linearGradient id="grad-2019" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#5dade2" />
    <stop offset="100%" stopColor="#2980b9" />
  </linearGradient>
  {/* Repeat for each year with different colors */}
</defs>

<Bar dataKey="Losses">
  {chartData.map((entry, i) => (
    <Cell fill={`url(#grad-${entry.name})`} />
  ))}
</Bar>
```

---

### 4. DonutChart Component

**Location**: `/src/components/insights/DonutChart/DonutChart.tsx`

**Data Flow**:
```
1. Receive lossShare array: [{ name, value, color }, ...]
2. Calculate total: sum of all values
3. For each segment:
   - startAngle = previousEndAngle
   - sweepAngle = (value / total) * 360
   - endAngle = startAngle + sweepAngle
4. Draw SVG arcs using path commands
5. Legend shows name + percentage
```

---

### 5. Heatmap Component

**Location**: `/src/components/insights/Heatmap/Heatmap.tsx`

**Data Flow**:
```
1. Receive heatmapData: number[][] (6 years × 12 months)
2. Create grid of cells: 6 rows (years) × 12 columns (months)
3. Color scale:
   - Intensity 0-3 → Blue shades
   - Intensity 4-6 → Yellow/Orange
   - Intensity 7-10 → Red shades
4. Tooltip on hover: "June 2023: Intensity 9/10"
```

**Color Mapping**:
```javascript
const getColorForIntensity = (value: number) => {
  if (value <= 3) return `hsl(210, 70%, ${90 - value * 10}%)`;
  if (value <= 6) return `hsl(45, 80%, ${70 - value * 5}%)`;
  return `hsl(0, 80%, ${60 - (value - 7) * 5}%)`;
};
```

---

## Security & Authentication

### Admin Authentication Flow

**Implementation**: `/src/lib/auth.ts` (JWT-based)

```
┌──────────────────────────────────────────────────────────────────┐
│                    ADMIN LOGIN FLOW                               │
└─────────────────────────┬────────────────────────────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  POST /api/auth/login           │
         │  Body: { username, password }   │
         └────────────────┬────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  Verify Credentials:            │
         │  1. SELECT FROM users           │
         │     WHERE username = ?          │
         │  2. Compare hashed password     │
         │     (bcrypt or similar)         │
         └────────────────┬────────────────┘
                          │
                 ┌────────┴────────┐
            Valid│                │Invalid
                 │                │
      ┌──────────▼─────┐   ┌─────▼──────┐
      │  Generate JWT  │   │   Error    │
      │  Token with:   │   │   401      │
      │  - userId      │   └────────────┘
      │  - role (ADMIN)│
      │  - expiry      │
      └──────────┬─────┘
                 │
      ┌──────────▼─────────┐
      │  Set HTTP-only     │
      │  Cookie:           │
      │  auth_token=<JWT>  │
      │  Secure, SameSite  │
      └──────────┬─────────┘
                 │
      ┌──────────▼─────────┐
      │  Return success    │
      │  Redirect to       │
      │  /admin/dashboard  │
      └────────────────────┘
```

### Protected Route Authorization

```javascript
// In protected API routes
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const session = await verifyToken(token);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Proceed with protected operation...
}
```

---

## Performance Optimizations

### 1. Database Connection Pooling
**File**: `/src/lib/db.ts`

```javascript
const pool = mysql.createPool({
  host, user, password, database, port,
  connectionLimit: 2,  // Limit concurrent connections
  maxIdle: 1,          // Keep max 1 idle connection
  idleTimeout: 5000,   // Close idle after 5s
  enableKeepAlive: true
});
```

### 2. API Caching
- Telemetry API: 60-second cache (Next.js revalidate)
- Weather API: 60-second cache
- Reports/News: Public CDN cache headers

### 3. Client-Side Optimizations
- React `useEffect` with cleanup (prevents memory leaks)
- Framer Motion animations (GPU-accelerated)
- Lazy loading for large datasets
- Polling intervals (8-10 seconds for telemetry)

---

## Missing / To-Be-Implemented Features

### 1. Membership Application Backend
**Status**: ❌ Not Implemented  
**Required File**: `/src/app/api/membership/apply/route.ts`

**Implementation Needed**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, organization, title, tier, message } = body;
    
    // Validation
    if (!name || !email || !organization) {
      return NextResponse.json(
        { error: 'Name, email, and organization are required' },
        { status: 400 }
      );
    }
    
    // Insert into database
    const result = await query<any>(
      `INSERT INTO memberships (name, email, organization, title, tier, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW())`,
      [name, email, organization, title, tier, message]
    );
    
    return NextResponse.json({
      success: true,
      membershipId: result.insertId,
      message: 'Application submitted successfully'
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
```

---

### 2. Event Registration Backend
**Status**: ❌ Not Implemented  
**Required File**: `/src/app/api/event/register/route.ts`

**Database Table Needed**:
```sql
CREATE TABLE event_registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  designation VARCHAR(255),
  role ENUM('In-Person Delegate', 'Virtual Delegate', 'Exhibitor', 'Media') NOT NULL,
  status ENUM('Pending', 'Confirmed', 'Rejected') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 3. Admin Dashboard
**Status**: ⚠️ Partially Implemented  
**Location**: `/src/app/admin/`

**Existing Admin Pages**:
- `/admin/login` - Login page
- `/admin/news` - News management
- `/admin/reports` - Reports management
- `/admin/memberships` - Membership review
- `/admin/scrape` - Scraper trigger

**Missing Features**:
- Telemetry data editor (update stats, alerts, state hazards)
- User management (create/delete admin accounts)
- Analytics dashboard (visitor stats, popular content)

---

## Deployment Architecture

### Recommended Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                           │
│                    Next.js (Vercel / Self-Hosted)                │
│                    - Static pages (SSG)                          │
│                    - Server-rendered pages (SSR)                 │
│                    - API routes (serverless)                     │
└────────────────┬───────────────────────────┬────────────────────┘
                 │                           │
        ┌────────▼──────────┐       ┌───────▼────────┐
        │  MySQL Database   │       │  External APIs │
        │  (Cloud/VPS)      │       │  - Open-Meteo  │
        │  - Managed MySQL  │       │  - RSS Feeds   │
        │  - Connection     │       └────────────────┘
        │    pooling        │
        └───────────────────┘
```

### Environment Variables Required

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dcrs_db
DB_PORT=3306
DB_CONNECTION_LIMIT=2
DB_SSL=false

# Authentication
JWT_SECRET=your_jwt_secret_key_here
CRON_SECRET=your_cron_secret_for_scraper

# Optional: External DB Support (for managed hosting)
MYSQL_ADDON_HOST=
MYSQL_ADDON_USER=
MYSQL_ADDON_PASSWORD=
MYSQL_ADDON_DB=
MYSQL_ADDON_PORT=
```

---

## Troubleshooting & Common Issues

### Issue 1: Database Connection Errors
**Symptom**: "Failed to fetch telemetry data"

**Solutions**:
1. Check `.env` file exists and has correct credentials
2. Verify MySQL server is running
3. Check connection pool settings in `src/lib/db.ts`
4. Increase `connectionLimit` if multiple concurrent users

---

### Issue 2: Weather API Not Loading
**Symptom**: City temperatures show fallback data

**Solutions**:
1. Check Open-Meteo API status (rate limits)
2. Verify network allows outbound HTTPS requests
3. Check browser console for CORS errors
4. Fallback to DB-stored temperatures if API fails

---

### Issue 3: RSS Scraper Fails
**Symptom**: No new news items appear

**Solutions**:
1. Check feed URLs are accessible
2. Verify 6-second timeout is sufficient
3. Check MySQL `scraped_content` table for errors
4. Run manual scrape: `/api/scrape?secret=<SECRET>`
5. Check for duplicate URL prevention (UNIQUE constraint)

---

### Issue 4: Admin Login Not Working
**Symptom**: Credentials correct but login fails

**Solutions**:
1. Verify `users` table exists and has admin record
2. Check password is properly hashed (bcrypt)
3. Verify JWT_SECRET is set in environment
4. Check cookie settings (secure, httpOnly, sameSite)

---

## Data Refresh & Update Cycles

### 1. Real-Time Data (Polling)
**Components**: Homepage hero statistics, temperature data  
**Frequency**: Every 8 seconds  
**Mechanism**: `setInterval` in `useEffect`

```javascript
useEffect(() => {
  loadTelemetry(); // Initial load
  const pollInterval = setInterval(loadTelemetry, 8000);
  return () => clearInterval(pollInterval); // Cleanup
}, []);
```

---

### 2. Weather API Updates
**Source**: Open-Meteo API  
**Frequency**: 60-second cache (Next.js revalidate)  
**Cities**: Chennai, Delhi, Kolkata, Mumbai  

**Caching Strategy**:
```javascript
const weatherRes = await fetch(url, {
  next: { revalidate: 60 } // Cache for 60 seconds
});
```

---

### 3. RSS Feed Scraping
**Trigger Methods**:
1. **Scheduled Cron Job**: Every 15-30 minutes (external service like Vercel Cron)
2. **Manual Admin Trigger**: On-demand via admin panel

**Automation Setup** (Example: Vercel Cron):
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/scrape?secret=<CRON_SECRET>",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

---

### 4. Static Data Updates
**Source**: `/src/data/dataStore.ts`  
**Update Method**: Manual code changes + deployment  
**Contents**: 
- Council members
- Membership tiers & features
- Event features
- Partner organizations
- Static fallback data

---

## Frontend-Backend Communication Summary

### Data Flow Patterns

#### Pattern 1: Direct API Fetch (Most Common)
```
Component → fetch('/api/...') → API Route → MySQL → Response → setState
```

**Example**: News Page
```javascript
useEffect(() => {
  fetch('/api/news')
    .then(res => res.json())
    .then(data => setStories(data));
}, []);
```

---

#### Pattern 2: Fallback Data
```
Component → API (fails) → Use fallback from dataStore.ts → setState
```

**Example**: Telemetry with Fallback
```javascript
try {
  const data = await fetch('/api/telemetry');
  setStats(data.heroStats);
} catch (err) {
  setStats(fallbackHeroStats); // From dataStore.ts
}
```

---

#### Pattern 3: Hybrid (API + External)
```
API Route → MySQL Query + External API → Merge Results → Response
```

**Example**: Telemetry with Weather
```javascript
// In /api/telemetry
const dbTemps = await query('SELECT * FROM city_temps');
const weatherData = await fetch('https://api.open-meteo.com/...');
const merged = mergeTemperatures(dbTemps, weatherData);
return merged;
```

---

#### Pattern 4: Form Submission
```
Form → POST /api/... → Validate → MySQL INSERT → Response → UI Update
```

**Example**: Membership Application
```javascript
const handleSubmit = async (e) => {
  const res = await fetch('/api/membership/apply', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
  
  if (res.ok) {
    setIsSubmitted(true);
    showToast('Application submitted');
  }
};
```

---

### RSS Scraper - Category Classification

**Implementation**: `/src/lib/scraper.ts` → `classifyCategory()`

**Algorithm**: Keyword matching on title + excerpt

**Categories & Keywords**:
```javascript
{
  earthquake: ['earthquake', 'seismic', 'tremor', 'aftershock', 'richter'],
  flood: ['flood', 'inundat', 'submerge', 'river overflow', 'monsoon'],
  wildfire: ['wildfire', 'forest fire', 'bushfire'],
  cyclone: ['cyclone', 'hurricane', 'typhoon', 'storm surge'],
  landslide: ['landslide', 'mudslide', 'avalanche', 'cloudburst'],
  drought: ['drought', 'water crisis', 'water shortage', 'dry spell'],
  storm: ['storm', 'thunderstorm', 'lightning', 'gale'],
  climate: ['climate', 'global warming', 'heatwave', 'emission'],
  environment: ['pollution', 'plastic', 'green cover', 'waste'],
  sustainability: ['sustainability', 'esg', 'csr', 'foundation'],
  breaking: (default fallback)
}
```

---

### RSS Scraper - Location Extraction

**Implementation**: `/src/lib/scraper.ts` → `extractLocation()`

**Detected Locations**:
```javascript
[
  { name: 'Assam', keywords: ['assam', 'guwahati', 'brahmaputra'] },
  { name: 'Bihar', keywords: ['bihar', 'patna', 'ganges'] },
  { name: 'Delhi', keywords: ['delhi', 'ncr'] },
  { name: 'Kerala', keywords: ['kerala', 'wayanad', 'idukki'] },
  { name: 'Uttarakhand', keywords: ['uttarakhand', 'kedarnath'] },
  // ... all major states & cities
  { name: 'National', keywords: ['india', 'national'] } // Default
]
```

---

## Conclusion & Summary

### Key Takeaways

1. **Architecture**: Next.js full-stack application with MySQL database
2. **Real-time Data**: Polling telemetry API every 8 seconds for live updates
3. **External APIs**: Open-Meteo for weather, RSS feeds for news scraping
4. **Data Visualization**: Custom SVG components + Recharts library
5. **Authentication**: JWT-based admin authentication with HTTP-only cookies
6. **Auto-scraping**: RSS feeds parsed, categorized, and auto-published
7. **Responsive UI**: Framer Motion animations, mobile-optimized layouts

---

### Data Flow Summary Table

| Section | Primary Data Source | Refresh Mechanism | User Actions |
|---------|---------------------|-------------------|--------------|
| Homepage Stats | `/api/telemetry` + MySQL | 8-second polling | None |
| India Map | `state_hazards` table | On page load | Hover/click states |
| Climate Gauge | `hero_stats.warming` | 8s + micro-fluctuations | None |
| Economic Chart | `economic_losses` table | On page load | Tooltip hover |
| News Feed | `/api/news` + MySQL | On page load | Click to external |
| Reports | `/api/reports` + MySQL | On page load | Search/filter/download |
| Membership | Form submission | Real-time submission | Fill & submit form |
| Event | Static + countdown | Live countdown timer | Registration form |
| Council | Static data | On page load | LinkedIn links |

---

### Missing Implementations Checklist

- [ ] `/api/membership/apply/route.ts` - Membership application backend
- [ ] `/api/event/register/route.ts` - Event registration backend
- [ ] Admin telemetry editor - Update stats/alerts via UI
- [ ] User management - Create/delete admin accounts
- [ ] Analytics dashboard - Visitor statistics
- [ ] Email notifications - For form submissions
- [ ] PDF generation - For downloadable reports

---

**Document Version**: 1.0  
**Last Updated**: June 13, 2026  
**Author**: AI System Analysis  
**For**: DCRF Platform Development Team

