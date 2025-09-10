const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Rate limiter padrão para endpoints gerais
 */
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Muitas requisições. Tente novamente em alguns minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit excedido', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Muitas requisições. Tente novamente em alguns minutos.'
    });
  }
});

/**
 * Rate limiter mais restritivo para webhooks
 */
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 webhooks por minuto
  message: {
    success: false,
    error: 'WEBHOOK_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: false,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit por IP para webhooks
    return req.ip;
  },
  handler: (req, res) => {
    logger.error('Rate limit de webhook excedido', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      error: 'WEBHOOK_RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Rate limiter para endpoints de pagamento (mais restritivo)
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 tentativas de pagamento por minuto por IP
  message: {
    success: false,
    error: 'PAYMENT_RATE_LIMIT_EXCEEDED',
    message: 'Muitas tentativas de pagamento. Aguarde um momento.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit de pagamento excedido', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      user_id: req.user?.id
    });
    
    res.status(429).json({
      success: false,
      error: 'PAYMENT_RATE_LIMIT_EXCEEDED',
      message: 'Muitas tentativas de pagamento. Aguarde um momento.'
    });
  }
});

module.exports = {
  generalLimiter,
  webhookLimiter,
  paymentLimiter
};