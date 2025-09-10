module.exports = {
  apps: [{
    name: 'comademig-payments-api',
    script: 'index.js',
    instances: 'max', // Usar todos os cores disponíveis
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Configurações de monitoramento
    monitoring: true,
    
    // Configurações de restart
    max_restarts: 10,
    min_uptime: '10s',
    
    // Configurações de logs
    log_file: 'logs/combined.log',
    out_file: 'logs/out.log',
    error_file: 'logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Configurações de memória
    max_memory_restart: '1G',
    
    // Configurações de cluster
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Variáveis de ambiente específicas
    env_vars: {
      ENABLE_METRICS: true,
      ENABLE_CRON_JOBS: true
    }
  }],
  
  // Configuração de deploy
  deploy: {
    production: {
      user: 'deploy',
      host: ['api.comademig.com.br'],
      ref: 'origin/main',
      repo: 'git@github.com:comademig/payments-api.git',
      path: '/var/www/comademig-payments',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    },
    staging: {
      user: 'deploy',
      host: ['staging-api.comademig.com.br'],
      ref: 'origin/develop',
      repo: 'git@github.com:comademig/payments-api.git',
      path: '/var/www/comademig-payments-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging'
    }
  }
};