const express = require('express');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { paymentLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const asaasClient = require('../services/asaasClient');
const supabaseService = require('../services/supabaseClient');

const router = express.Router();

/**
 * POST /api/cards/tokenize
 * Tokenizar cartão de crédito via Asaas
 * Endpoint público para tokenização durante filiação
 */
router.post('/tokenize',
  paymentLimiter,
  validate(schemas.cardTokenize),
  asyncHandler(async (req, res) => {
    const {
      card_number,
      card_holder,
      expiry_month,
      expiry_year,
      cvv
    } = req.body;

    logger.audit('card_tokenization_attempt', {
      holder_name: card_holder,
      last_four: card_number.slice(-4),
      expiry: `${expiry_month}/${expiry_year}`,
      ip: req.ip,
      user_agent: req.get('User-Agent')
    });

    try {
      // Preparar dados para tokenização
      const cardData = {
        holderName: card_holder,
        number: card_number,
        expiryMonth: expiry_month,
        expiryYear: expiry_year,
        ccv: cvv
      };

      // Tokenizar cartão no Asaas
      const tokenResult = await asaasClient.tokenizeCard(cardData);
      
      logger.info('Cartão tokenizado com sucesso', {
        token_id: tokenResult.creditCardToken,
        holder_name: card_holder,
        last_four: card_number.slice(-4),
        ip: req.ip
      });

      // Resposta sem dados sensíveis
      res.json({
        success: true,
        token: tokenResult.creditCardToken,
        card_info: {
          holder_name: card_holder,
          last_four: card_number.slice(-4),
          expiry_month: expiry_month,
          expiry_year: expiry_year,
          brand: tokenResult.creditCardBrand || 'unknown'
        },
        expires_at: tokenResult.expiresAt
      });

    } catch (error) {
      logger.error('Erro na tokenização de cartão', {
        error: error.message,
        holder_name: card_holder,
        last_four: card_number.slice(-4),
        ip: req.ip
      });

      // Determinar tipo de erro
      let statusCode = 500;
      let errorCode = 'TOKENIZATION_ERROR';
      let message = 'Erro na tokenização do cartão';

      if (error.type === 'VALIDATION_ERROR') {
        statusCode = 400;
        errorCode = 'INVALID_CARD_DATA';
        message = 'Dados do cartão inválidos';
      } else if (error.type === 'AUTHENTICATION_ERROR') {
        statusCode = 502;
        errorCode = 'ASAAS_AUTH_ERROR';
        message = 'Erro de autenticação com serviço de pagamento';
      }

      res.status(statusCode).json({
        success: false,
        error: errorCode,
        message,
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * POST /api/cards/save-token
 * Salvar token de cartão para assinatura (renovações automáticas)
 * Requer autenticação
 */
router.post('/save-token',
  authenticateToken,
  validate(schemas.saveCardToken),
  asyncHandler(async (req, res) => {
    const {
      subscription_id,
      card_token
    } = req.body;

    const userId = req.user.id;

    logger.audit('save_card_token_attempt', {
      user_id: userId,
      subscription_id,
      token_preview: card_token.substring(0, 10) + '...',
      ip: req.ip
    });

    try {
      // Verificar se a assinatura pertence ao usuário (simulado)
      const subscription = {
        id: subscription_id,
        user_id: userId,
        asaas_subscription_id: `asaas_${subscription_id}`
      };

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Assinatura não encontrada ou não pertence ao usuário'
        });
      }

      // Atualizar assinatura com token do cartão (simulado)
      logger.info('Token de cartão salvo para assinatura', {
        user_id: userId,
        subscription_id,
        asaas_subscription_id: subscription.asaas_subscription_id
      });

      res.json({
        success: true,
        message: 'Token do cartão salvo com sucesso',
        subscription_id,
        token_saved: true,
        auto_renewal_enabled: true
      });

    } catch (error) {
      logger.error('Erro ao salvar token de cartão', {
        error: error.message,
        user_id: userId,
        subscription_id,
        ip: req.ip
      });

      res.status(500).json({
        success: false,
        error: 'SAVE_TOKEN_ERROR',
        message: 'Erro ao salvar token do cartão',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * DELETE /api/cards/token/:subscription_id
 * Remover token de cartão de uma assinatura
 * Requer autenticação
 */
router.delete('/token/:subscription_id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { subscription_id } = req.params;
    const userId = req.user.id;

    logger.audit('remove_card_token_attempt', {
      user_id: userId,
      subscription_id,
      ip: req.ip
    });

    try {
      // Verificar se a assinatura pertence ao usuário (simulado)
      const subscription = {
        id: subscription_id,
        user_id: userId
      };

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Assinatura não encontrada ou não pertence ao usuário'
        });
      }

      // Remover token do cartão (simulado)
      logger.info('Token de cartão removido da assinatura', {
        user_id: userId,
        subscription_id
      });

      res.json({
        success: true,
        message: 'Token do cartão removido com sucesso',
        subscription_id,
        auto_renewal_enabled: false
      });

    } catch (error) {
      logger.error('Erro ao remover token de cartão', {
        error: error.message,
        user_id: userId,
        subscription_id,
        ip: req.ip
      });

      res.status(500).json({
        success: false,
        error: 'REMOVE_TOKEN_ERROR',
        message: 'Erro ao remover token do cartão',
        timestamp: new Date().toISOString()
      });
    }
  })
);

module.exports = router;