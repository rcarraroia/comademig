const logger = require('../utils/logger');
const config = require('../config');

/**
 * Middleware de tratamento de erros global
 */
const errorHandler = (err, req, res, next) => {
  // Log do erro completo
  logger.error('Erro não tratado', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user_id: req.user?.id,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Determinar código de status
  let statusCode = err.statusCode || err.status || 500;
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Erro interno do servidor';

  // Tratar erros específicos
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Dados de entrada inválidos';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = 'Acesso não autorizado';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Token inválido';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Token expirado';
  }

  // Resposta de erro
  const errorResponse = {
    success: false,
    error: errorCode,
    message,
    timestamp: new Date().toISOString()
  };

  // Incluir stack trace apenas em desenvolvimento
  if (config.server.env === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para capturar 404
 */
const notFoundHandler = (req, res) => {
  logger.warn('Endpoint não encontrado', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Endpoint não encontrado',
    timestamp: new Date().toISOString()
  });
};

/**
 * Wrapper para async functions que captura erros automaticamente
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};