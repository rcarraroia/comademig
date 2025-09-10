const winston = require('winston');
const config = require('../config');

// Configurar formato de log
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configurar transports
const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Adicionar arquivo de log se configurado
if (config.logging.file) {
  transports.push(
    new winston.transports.File({
      filename: config.logging.file,
      format: logFormat
    })
  );
}

// Criar logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  // Não sair do processo em caso de erro
  exitOnError: false
});

// Função para log estruturado de auditoria
logger.audit = (action, data = {}) => {
  logger.info('AUDIT', {
    action,
    timestamp: new Date().toISOString(),
    ...data
  });
};

// Função para log de pagamentos
logger.payment = (event, paymentData = {}) => {
  logger.info('PAYMENT', {
    event,
    timestamp: new Date().toISOString(),
    payment_id: paymentData.payment_id,
    user_id: paymentData.user_id,
    amount: paymentData.amount,
    status: paymentData.status,
    ...paymentData
  });
};

// Função para log de webhooks
logger.webhook = (event, webhookData = {}) => {
  logger.info('WEBHOOK', {
    event,
    timestamp: new Date().toISOString(),
    asaas_event_id: webhookData.asaas_event_id,
    event_type: webhookData.event_type,
    ...webhookData
  });
};

module.exports = logger;