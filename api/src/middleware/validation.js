const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Middleware para validação de entrada usando Joi
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Erro de validação', {
        path: req.path,
        method: req.method,
        errors: details,
        ip: req.ip
      });

      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Dados de entrada inválidos',
        details
      });
    }

    // Substituir dados validados
    req[property] = value;
    next();
  };
};

// Schemas de validação comuns
const schemas = {
  // Validação para filiação de membros
  memberJoin: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\d{10,15}$/).required(),
    cpfCnpj: Joi.string().pattern(/^\d{11}$|^\d{14}$/).optional(),
    cargo: Joi.string().min(2).max(50).required(),
    plan_id: Joi.string().uuid().required(),
    payment_method: Joi.string().valid('PIX', 'CREDIT_CARD').required(),
    affiliate_code: Joi.string().optional()
  }),

  // Validação para serviços pontuais
  servicePayment: Joi.object({
    service_type: Joi.string().valid('certidao', 'regularizacao').required(),
    service_data: Joi.object().required(),
    payment_method: Joi.string().valid('PIX', 'CREDIT_CARD').required()
  }),

  // Validação para tokenização de cartão
  cardTokenize: Joi.object({
    card_number: Joi.string().creditCard().required(),
    card_holder: Joi.string().min(2).max(100).required(),
    expiry_month: Joi.string().pattern(/^(0[1-9]|1[0-2])$/).required(),
    expiry_year: Joi.string().pattern(/^\d{4}$/).required(),
    cvv: Joi.string().pattern(/^\d{3,4}$/).required()
  }),

  // Validação para wallet de afiliado
  affiliateWallet: Joi.object({
    wallet_id: Joi.string().min(5).max(100).required()
  }),

  // Validação para salvar token de cartão
  saveCardToken: Joi.object({
    subscription_id: Joi.string().uuid().required(),
    card_token: Joi.string().min(10).max(200).required()
  }),

  // Validação para conciliação
  reconcileSplits: Joi.object({
    payment_ids: Joi.array().items(Joi.string().uuid()).optional(),
    date_range: Joi.object({
      start: Joi.date().iso().required(),
      end: Joi.date().iso().min(Joi.ref('start')).required()
    }).optional()
  }).or('payment_ids', 'date_range'),

  // Validação para notificação admin
  adminNotify: Joi.object({
    type: Joi.string().valid('service_paid', 'subscription_created', 'payment_failed').required(),
    service_id: Joi.string().uuid().optional(),
    user_id: Joi.string().uuid().required(),
    payment_id: Joi.string().uuid().required(),
    service_type: Joi.string().valid('certidao', 'regularizacao').optional(),
    amount: Joi.number().integer().min(0).required()
  }),

  // Validação para retry de webhooks
  retryWebhooks: Joi.object({
    max_retries: Joi.number().integer().min(1).max(10).default(3),
    retry_older_than_hours: Joi.number().integer().min(1).max(72).default(1)
  }),

  // Validação para teste de alertas
  testAlert: Joi.object({
    alert_type: Joi.string().valid('test', 'high_error_rate', 'webhook_failures', 'high_memory_usage').default('test')
  })
};

module.exports = {
  validate,
  schemas
};