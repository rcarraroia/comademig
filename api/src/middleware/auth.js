const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Middleware de autenticação JWT
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logger.warn('Token de acesso não fornecido', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    return res.status(401).json({
      success: false,
      error: 'TOKEN_REQUIRED',
      message: 'Token de acesso obrigatório'
    });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      logger.warn('Token inválido', {
        error: err.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      return res.status(403).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Token inválido'
      });
    }

    req.user = user;
    next();
  });
};

/**
 * Middleware para endpoints públicos (opcional auth)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, config.jwt.secret, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }

  next();
};

/**
 * Middleware para validar webhook do Asaas
 */
const validateWebhook = (req, res, next) => {
  // TODO: Implementar validação de assinatura do webhook quando disponível
  // Por enquanto, validar apenas o token se configurado
  
  if (config.asaas.webhookToken) {
    const webhookToken = req.headers['x-webhook-token'] || req.headers['authorization'];
    
    if (!webhookToken || !webhookToken.includes(config.asaas.webhookToken)) {
      logger.warn('Webhook com token inválido', {
        ip: req.ip,
        headers: req.headers,
        path: req.path
      });
      return res.status(401).json({
        success: false,
        error: 'INVALID_WEBHOOK_TOKEN'
      });
    }
  }

  // Marcar como webhook válido
  req.isWebhook = true;
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  validateWebhook
};