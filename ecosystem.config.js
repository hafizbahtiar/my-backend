module.exports = {
  apps: [
    {
      name: 'my-backend',
      script: 'bun',
      args: 'run src/server.ts',
      cwd: './',
      
      // Process management
      instances: 1, // Set to 'max' for cluster mode
      exec_mode: 'fork', // Use 'cluster' for multiple instances
      
      // Environment
      env: {
        NODE_ENV: 'development',
        PORT: 6998
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 7000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 6999
      },
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart
      watch: false, // Set to true to watch for file changes
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        '.git',
        '*.log'
      ],
      
      // Restart conditions
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      
      // Advanced options
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      
      // Source map support
      source_map_support: true,
      
      // Bun specific
      interpreter: 'bun',
      interpreter_args: '',
      
      // PM2 specific
      pmx: true,
      merge_logs: true,
      time: true
    }
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:hafizbahtiar/my-backend.git',
      path: '/var/www/my-backend',
      'post-deploy': 'bun install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get update && apt-get install -y bun'
    },
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:hafizbahtiar/my-backend.git',
      path: '/var/www/my-backend-staging',
      'post-deploy': 'bun install && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': 'apt-get update && apt-get install -y bun'
    },
    development: {
      user: 'deploy',
      host: ['dev-server.com'],
      ref: 'origin/dev',
      repo: 'git@github.com:hafizbahtiar/my-backend.git',
      path: '/var/www/my-backend-dev',
      'post-deploy': 'bun install && pm2 reload ecosystem.config.js --env development',
      'pre-setup': 'apt-get update && apt-get install -y bun'
    }
  }
};
