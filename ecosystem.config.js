module.exports = {
  apps: [{
    name: 'dcrs',
    script: '.next/standalone/server-wrapper.js',  // Use your custom server wrapper
    args: '',  // No args needed
    instances: 2,  // Run at least 2 instances for zero-downtime
    exec_mode: 'cluster',
    
    // Zero-downtime reload settings
    wait_ready: true,           // Wait for app to emit 'ready' signal
    listen_timeout: 10000,      // Wait up to 10s for app to be ready
    kill_timeout: 5000,         // Give old process 5s to shutdown gracefully
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Memory management (matching your package.json)
    node_args: '--max-old-space-size=512',
    
    // Auto restart on crash
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Logging
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Memory restart threshold
    max_memory_restart: '500M'
  }]
};
