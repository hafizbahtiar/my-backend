module.exports = {
    apps: [
        {
            name: 'my-backend',
            cwd: '/var/www/my-backend',
            script: 'src/server.ts', // main entry file
            interpreter: '/home/hafiz/.bun/bin/bun', // full path to bun
            exec_mode: 'fork',
            instances: 1,

            env: {
                NODE_ENV: 'development',
                PORT: 6998
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 7000
            },

            out_file: './logs/out.log',
            error_file: './logs/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
        }
    ]
};
