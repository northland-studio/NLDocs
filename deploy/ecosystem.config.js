// ==============================================================================
// NLDocs PM2 进程配置文件
// 后端端口: 3015
// 在服务器上通过 `pm2 start deploy/ecosystem.config.js --env production` 启动
// ==============================================================================
module.exports = {
  apps: [{
    name: 'nldocs-backend',
    script: './index.js',
    cwd: '/var/www/nldocs/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3015
    },
    error_file: '/var/log/nldocs/error.log',
    out_file: '/var/log/nldocs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
