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

// Log memory usage on startup
const mem = process.memoryUsage();
console.log(`[SERVER] Memory on start: RSS=${Math.round(mem.rss / 1024 / 1024)}MB, Heap=${Math.round(mem.heapUsed / 1024 / 1024)}MB`);

// Start the Next.js standalone server
require('./.next/standalone/server.js');
