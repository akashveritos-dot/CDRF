// Custom server wrapper for Hostinger deployment
// Catches uncaught exceptions and limits memory usage

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});

process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received, shutting down...');
  process.exit(0);
});

// Validate essential environment secrets on startup
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dcrf_jwt_secret_key') {
    console.error('❌ FATAL ERROR: JWT_SECRET environment variable is not configured or insecure in production!');
    process.exit(1);
  }
  if (!process.env.CRON_SECRET || process.env.CRON_SECRET === 'dcrf_cron_secret_trigger') {
    console.error('❌ FATAL ERROR: CRON_SECRET environment variable is not configured or insecure in production!');
    process.exit(1);
  }
}

// Start the Next.js standalone server
let app;
try {
  // Try to load when run from the root directory
  app = require('./.next/standalone/server.js');
} catch (err) {
  // Try to load when run from within the .next/standalone directory
  app = require('./server.js');
}

// Signal to PM2 that the app is ready (for zero-downtime reloads)
if (process.send) {
  console.log('[SERVER] Sending ready signal to PM2...');
  process.send('ready');
}

// ── Background Scheduler for Automated Scraping ──
// Ensure scheduler only runs on PM2 instance 0 (primary worker) to prevent duplicate runs in cluster mode
const isPrimaryInstance = process.env.NODE_APP_INSTANCE === '0' || !process.env.NODE_APP_INSTANCE;

if (isPrimaryInstance) {
  const getISTTime = () => {
    const utcDate = new Date();
    // Indian timezone offset is UTC + 5.5 hours
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(utcDate.getTime() + istOffset);
    return {
      hours: istDate.getUTCHours(),
      minutes: istDate.getUTCMinutes(),
      seconds: istDate.getUTCSeconds()
    };
  };

  const triggerScraper = async () => {
    const port = process.env.PORT || 3000;
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      console.error('[SCHEDULER ERROR] CRON_SECRET environment variable is missing. Cannot trigger scraper.');
      return;
    }
    const url = `http://127.0.0.1:${port}/api/scrape?secret=${secret}`;
    console.log(`[SCHEDULER] Triggering scraper via: ${url}`);
    try {
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      console.log(`[SCHEDULER] Scraper response:`, data);
    } catch (err) {
      console.error(`[SCHEDULER ERROR] Scraper fetch failed:`, err.message);
    }
  };

  let lastRunHour = -1;

  setInterval(() => {
    const { hours, minutes } = getISTTime();
    // Trigger at 8 AM, 12 PM, and 4 PM IST
    if ((hours === 8 || hours === 12 || hours === 16) && minutes === 0) {
      if (lastRunHour !== hours) {
        lastRunHour = hours;
        triggerScraper();
      }
    } else {
      if (minutes !== 0) {
        lastRunHour = -1;
      }
    }
  }, 30000); // Check every 30 seconds

  console.log('[SCHEDULER] Automated Data Scraping Scheduler initialized on primary cluster instance (8 AM, 12 PM, 4 PM IST daily).');
} else {
  console.log('[SCHEDULER] Replica cluster instance. Scraping scheduler disabled to prevent collisions.');
}


