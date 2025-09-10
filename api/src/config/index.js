const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

const config = {
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
  },

  // Configurações do Asaas
  asaas: {
    apiUrl: process.env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3',
    apiKey: process.env.ASAAS_API_KEY,
    webhookToken: process.env.ASAAS_WEBHOOK_TOKEN,
  },

  // Configurações do Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Configurações do Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Configurações do JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Wallet IDs para Split
  wallets: {
    // COMADEMIG não precisa de wallet - usa a conta principal do API_KEY
    renum: process.env.RENUM_WALLET_ID,
  },

  // Configurações de notificação
  notifications: {
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    adminEmail: process.env.ADMIN_EMAIL,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
};

// Validar configurações críticas
const requiredConfigs = [
  'asaas.apiKey',
  'supabase.url',
  'supabase.anonKey',
  'jwt.secret',
];

requiredConfigs.forEach(configPath => {
  const value = configPath.split('.').reduce((obj, key) => obj?.[key], config);
  if (!value) {
    throw new Error(`Configuração obrigatória não encontrada: ${configPath}`);
  }
});

module.exports = config;