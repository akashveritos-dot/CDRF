# Bugfix Requirements Document

## Introduction

The CDRF Next.js application exhibits severe mobile performance degradation, achieving a Performance Score of only 48/100 (target: 90+). This bugfix addresses five critical Core Web Vitals metrics that significantly impact user experience on mobile devices:

- **CLS (Cumulative Layout Shift)**: 0.657 (target: <0.1) - HIGHEST PRIORITY
- **LCP (Largest Contentful Paint)**: 4.1s (target: <2.5s)
- **Speed Index**: 9.7s (target: <3.4s)
- **TBT (Total Blocking Time)**: 290ms (target: <200ms)
- **FCP (First Contentful Paint)**: 1.5s (target: <1.8s) - Currently acceptable

Root causes identified through codebase analysis:
1. **CLS issues**: Images without explicit width/height dimensions, render-blocking Google Fonts import, ScrollReveal/Framer Motion animations causing layout shifts
2. **LCP issues**: Unoptimized PNG images (climate_radar_dashboard.png at 0.75MB, council images up to 0.45MB), lack of priority loading on hero images, external Unsplash images without optimization
3. **Speed Index issues**: Heavy client-side JavaScript execution (Framer Motion everywhere), all sections loaded immediately without lazy loading, excessive animations on initial render
4. **TBT issues**: Excessive ScrollReveal animations (used on every section), blocking JavaScript from Framer Motion, synchronous animation initialization
5. **Font Loading**: Render-blocking Google Fonts import in globals.css without font-display strategy

## Bug Analysis

### Current Behavior (Defect)

#### 1. CLS (Cumulative Layout Shift) Issues - 0.657 Current

1.1 WHEN the page loads THEN images in the hero section, news feed cards, council member cards, and report cards load without explicit width/height attributes causing layout shifts as images render

1.2 WHEN fonts load from Google Fonts CDN THEN the @import statement in globals.css blocks rendering and causes text to reflow when fonts become available (FOIT/FOUT behavior)

1.3 WHEN ScrollReveal components animate into view THEN Framer Motion applies transform animations that shift surrounding content (30px Y-axis movement on every section)

1.4 WHEN council member profile images fail to load THEN the error handler triggers a state change causing the avatar to re-render from image to initials, shifting the card layout

1.5 WHEN the hero panel with live telemetry loads THEN the temperature bars and city data animate without reserved space, causing content below to shift

#### 2. LCP (Largest Contentful Paint) Issues - 4.1s Current

2.1 WHEN the hero section renders THEN the climate_radar_dashboard.png (0.75MB PNG) loads without priority directive causing delayed LCP

2.2 WHEN external Unsplash images load in DisasterBackground component THEN they are fetched as full-resolution URLs (w=1200) without Next.js Image optimization

2.3 WHEN council member images load THEN ruchika-kumar.jpg (0.45MB) and other large JPEG files load without srcset or responsive sizing

2.4 WHEN news feed cards render THEN external image URLs from story.image_url load synchronously without priority hints or lazy loading

2.5 WHEN the page mounts THEN multiple heavy components (DisasterBackground, DynamicSkyBackground, DisasterEffects) initialize simultaneously competing for network resources

#### 3. Speed Index Issues - 9.7s Current

3.1 WHEN the homepage loads THEN all sections (hero, stats, insights, news, reports, pillars, council) render immediately without lazy loading or code splitting

3.2 WHEN ScrollReveal wraps every section THEN Framer Motion initializes viewport observers and animation controllers for all sections regardless of viewport visibility

3.3 WHEN chart components (IndiaMap, ClimateGauge, LossChart, DonutChart, Heatmap) mount THEN they all execute synchronously blocking the main thread

3.4 WHEN WordTypingEffect animates the hero title THEN it updates state every 45-75ms with character-by-character rendering causing excessive re-renders

3.5 WHEN DisasterBackground component initializes THEN it starts multiple setInterval timers (clock: 1s, weather: 10min, seismic: 3.5s, celestial: 1min) and creates 30 rain elements and 15 dust particles with individual animations

#### 4. TBT (Total Blocking Time) Issues - 290ms Current

4.1 WHEN Framer Motion initializes THEN it processes animation configurations for 20+ ScrollReveal instances blocking the main thread

4.2 WHEN CountUp components animate THEN they use requestAnimationFrame in tight loops for dashboard stats, hero panel stats, and stats strip (12+ simultaneous animations)

4.3 WHEN motion.div elements with whileInView animate THEN Framer Motion's intersection observer callbacks execute synchronously for temperature bars and event bars

4.4 WHEN the page hydrates THEN React initializes all client components simultaneously including heavy animation libraries

4.5 WHEN DisasterBackground fetches weather data THEN it makes synchronous API calls to Open-Meteo and processes SunCalc calculations on the main thread

#### 5. Font Loading Issues

5.1 WHEN globals.css loads THEN the @import url for Google Fonts (Playfair Display and Inter) blocks CSS parsing and delays render

5.2 WHEN fonts are fetched THEN they lack font-display: swap strategy causing text to remain invisible until fonts load (FOIT)

### Expected Behavior (Correct)

#### 1. CLS (Cumulative Layout Shift) - Target <0.1

2.1 WHEN images load THEN the system SHALL specify explicit width and height attributes on all img elements and Next.js Image components to reserve layout space

2.2 WHEN fonts load THEN the system SHALL use next/font with automatic font optimization and preloading to eliminate render blocking and FOIT/FOUT

2.3 WHEN ScrollReveal animations trigger THEN the system SHALL use CSS transforms with will-change hints and reduce animation distance to prevent layout shifts

2.4 WHEN council images fail to load THEN the system SHALL render avatar initials by default with image as progressive enhancement, preventing re-render layout shifts

2.5 WHEN hero panel telemetry renders THEN the system SHALL reserve fixed heights for animated elements to prevent content reflow

#### 2. LCP (Largest Contentful Paint) - Target <2.5s

2.6 WHEN hero images load THEN the system SHALL use Next.js Image component with priority prop for above-the-fold images

2.7 WHEN large images are served THEN the system SHALL convert PNGs to optimized WebP/AVIF formats and reduce file sizes by 60-80%

2.8 WHEN external images are needed THEN the system SHALL proxy them through Next.js Image API with automatic optimization

2.9 WHEN background images load THEN the system SHALL preload critical images using <link rel="preload" as="image">

2.10 WHEN council images render THEN the system SHALL generate responsive srcset with multiple sizes for different viewports

#### 3. Speed Index - Target <3.4s

2.11 WHEN non-critical sections load THEN the system SHALL implement lazy loading with React.lazy and dynamic imports for below-the-fold content

2.12 WHEN animations initialize THEN the system SHALL reduce ScrollReveal usage by 70% and only animate key sections

2.13 WHEN chart components render THEN the system SHALL lazy load visualization libraries and defer rendering until viewport intersection

2.14 WHEN hero title animates THEN the system SHALL replace character-by-character WordTypingEffect with CSS animation or simpler state updates

2.15 WHEN background effects initialize THEN the system SHALL reduce particle counts by 60% and optimize animation loops with passive event listeners

#### 4. TBT (Total Blocking Time) - Target <200ms

2.16 WHEN animations execute THEN the system SHALL debounce and throttle animation callbacks to reduce main thread blocking

2.17 WHEN CountUp animations run THEN the system SHALL batch state updates and limit concurrent animations to 3-4 simultaneous instances

2.18 WHEN Framer Motion components mount THEN the system SHALL code-split motion components and use lightweight CSS alternatives where possible

2.19 WHEN page hydration occurs THEN the system SHALL defer non-critical client component initialization using requestIdleCallback

2.20 WHEN API calls are made THEN the system SHALL move weather fetching to server-side or use Web Workers for CPU-intensive calculations

#### 5. Font Loading Optimization

2.21 WHEN fonts are loaded THEN the system SHALL use next/font/google to automatically optimize and inline font CSS with font-display: swap

2.22 WHEN font files are served THEN the system SHALL preload font files and subset fonts to only required character ranges

### Unchanged Behavior (Regression Prevention)

#### 1. Visual Fidelity

3.1 WHEN performance optimizations are applied THEN the system SHALL CONTINUE TO display all existing visual animations and transitions

3.2 WHEN images are optimized THEN the system SHALL CONTINUE TO maintain visual quality without perceptible degradation

3.3 WHEN fonts are optimized THEN the system SHALL CONTINUE TO render text in Playfair Display and Inter fonts

#### 2. Functional Behavior

3.4 WHEN lazy loading is implemented THEN the system SHALL CONTINUE TO load all content when users scroll to respective sections

3.5 WHEN ScrollReveal is reduced THEN the system SHALL CONTINUE TO animate hero, insights dashboard, and CTA sections

3.6 WHEN CountUp animations are optimized THEN the system SHALL CONTINUE TO display animated number counters with correct end values

3.7 WHEN background effects are reduced THEN the system SHALL CONTINUE TO show live weather telemetry and disaster-themed visuals

#### 3. Data Accuracy

3.8 WHEN weather data is fetched THEN the system SHALL CONTINUE TO display accurate real-time temperature and conditions for New Delhi

3.9 WHEN telemetry data renders THEN the system SHALL CONTINUE TO show correct statistics from useTelemetry hook

3.10 WHEN news and reports load THEN the system SHALL CONTINUE TO fetch and display latest content from APIs

#### 4. Responsive Design

3.11 WHEN viewport size changes THEN the system SHALL CONTINUE TO adapt layout for mobile, tablet, and desktop viewports

3.12 WHEN images are made responsive THEN the system SHALL CONTINUE TO scale appropriately across all device sizes

#### 5. Accessibility

3.13 WHEN optimizations are applied THEN the system SHALL CONTINUE TO maintain semantic HTML structure and ARIA attributes

3.14 WHEN animations are reduced THEN the system SHALL CONTINUE TO respect prefers-reduced-motion user preferences
