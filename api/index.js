const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { generalLimiter } = require('./src/middleware/rateLimiter');

// Criar aplicação Express
const app = express();

// Middleware de segurança
app.use(helmet());

// CORS configurado
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8080', 'https://comademig.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Webhook-Token']
}));

// Parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting geral
app.use(generalLimiter);

// Middleware de logging de requisições
app.use((req, res, next) => {
  logger.info('Requisição recebida', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API de Pagamentos COMADEMIG funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.server.env
  });
});

// Rotas da API
app.use('/api/members', require('./src/routes/members'));
app.use('/api/payments', require('./src/routes/payments'));
app.use('/api/cards', require('./src/routes/cards'));
app.use('/api/affiliate', require('./src/routes/affiliate'));
app.use('/api/subscriptions', require('./src/routes/subscriptions'));
app.use('/webhook', require('./src/routes/webhook'));
app.use('/internal', require('./src/routes/internal'));
app.use('/', require('./src/routes/monitoring'));

// Middleware de 404
app.use(notFoundHandler);

// Middleware de tratamento de erros
app.use(errorHandler);

// Iniciar servidor
const PORT = config.server.port;

app.listen(PORT, () => {
  logger.info(`Servidor iniciado na porta ${PORT}`, {
    environment: config.server.env,
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  logger.error('Exceção não capturada', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promise rejeitada não tratada', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido, encerrando servidor graciosamente');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recebido, encerrando servidor graciosamente');
  process.exit(0);
});

module.exports = app;