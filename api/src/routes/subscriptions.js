const express = require('express');
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { generalLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const supabaseService = require('../services/supabaseClient');
const asaasClient = require('../services/asaasClient');
const notificationService = require('../services/notificationService');

const router = express.Router();

/**
 * POST /api/subscriptions/save-card-token
 * Persistir token de cartão para renovações automáticas
 */
router.post('/save-card-token',
  authenticateToken,
  generalLimiter,
  validate(schemas.saveCardToken),
  asyncHandler(async (req, res) => {
    const { subscription_id, card_token } = req.body;
    const userId = req.user.id;

    logger.audit('save_card_token_attempt', {
      user_id: userId,
      subscription_id,
      token_preview: card_token.substring(0, 10) + '...',
      ip: req.ip
    });

    try {
      // 1. Verificar se a assinatura pertence ao usuário
      const { data: subscriptions } = await supabaseService.executeQuery('subscriptions', {
        type: 'select',
        filters: { id: subscription_id, user_id: userId }
      });

      if (!subscriptions || subscriptions.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Assinatura não encontrada ou não pertence ao usuário'
        });
      }

      const subscription = subscriptions[0];

      // 2. Validar token no Asaas (opcional - pode ser feito na tokenização)
      try {
        // Verificar se o token ainda é válido fazendo uma consulta
        await asaasClient.makeRequest('GET', `/creditCard/tokenize/${card_token}`);
      } catch (error) {
        logger.warn('Token de cartão pode estar inválido', {
          subscription_id,
          token_preview: card_token.substring(0, 10) + '...',
          error: error.message
        });
        // Continuar mesmo assim, pois o token pode ser válido mas a consulta não suportada
      }

      // 3. Salvar token de forma segura na assinatura
      const tokenData = {
        asaas_card_token: card_token,
        card_token_saved_at: new Date().toISOString(),
        auto_renewal_enabled: true,
        updated_at: new Date().toISOString()
      };

      await supabaseService.executeQuery('subscriptions', {
        type: 'update',
        filters: { id: subscription_id },
        select: '*'
      }, tokenData, { useServiceRole: true });

      // 4. Atualizar assinatura no Asaas com token
      if (subscription.asaas_subscription_id) {
        try {
          await asaasClient.makeRequest('PUT', `/subscriptions/${subscription.asaas_subscription_id}`, {
            creditCardToken: card_token
          });

          logger.info('Token atualizado na assinatura Asaas', {
            subscription_id,
            asaas_subscription_id: subscription.asaas_subscription_id
          });
        } catch (error) {
          logger.error('Erro ao atualizar token na assinatura Asaas', {
            error: error.message,
            subscription_id,
            asaas_subscription_id: subscription.asaas_subscription_id
          });
          // Não falhar a operação por isso
        }
      }

      // 5. Agendar verificação de expiração do token
      await scheduleTokenExpirationCheck(subscription_id, card_token);

      logger.audit('card_token_saved', {
        user_id: userId,
        subscription_id,
        asaas_subscription_id: subscription.asaas_subscription_id,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Token do cartão salvo com sucesso',
        subscription_id,
        auto_renewal_enabled: true,
        token_saved_at: tokenData.card_token_saved_at
      });

    } catch (error) {
      logger.error('Erro ao salvar token de cartão', {
        error: error.message,
        stack: error.stack,
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
 * DELETE /api/subscriptions/:id/card-token
 * Invalidar token de cartão de uma assinatura
 */
router.delete('/:id/card-token',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id: subscription_id } = req.params;
    const userId = req.user.id;

    logger.audit('remove_card_token_attempt', {
      user_id: userId,
      subscription_id,
      ip: req.ip
    });

    try {
      // 1. Verificar se a assinatura pertence ao usuário
      const { data: subscriptions } = await supabaseService.executeQuery('subscriptions', {
        type: 'select',
        filters: { id: subscription_id, user_id: userId }
      });

      if (!subscriptions || subscriptions.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Assinatura não encontrada ou não pertence ao usuário'
        });
      }

      const subscription = subscriptions[0];

      // 2. Remover token da assinatura local
      await supabaseService.executeQuery('subscriptions', {
        type: 'update',
        filters: { id: subscription_id }
      }, {
        asaas_card_token: null,
        card_token_saved_at: null,
        auto_renewal_enabled: false,
        updated_at: new Date().toISOString()
      }, { useServiceRole: true });

      // 3. Remover token da assinatura no Asaas
      if (subscription.asaas_subscription_id) {
        try {
          await asaasClient.makeRequest('PUT', `/subscriptions/${subscription.asaas_subscription_id}`, {
            creditCardToken: null
          });
        } catch (error) {
          logger.error('Erro ao remover token da assinatura Asaas', {
            error: error.message,
            subscription_id,
            asaas_subscription_id: subscription.asaas_subscription_id
          });
        }
      }

      logger.audit('card_token_removed', {
        user_id: userId,
        subscription_id,
        ip: req.ip
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

/**
 * GET /api/subscriptions/:id/renewal-status
 * Consultar status de renovação automática
 */
router.get('/:id/renewal-status',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id: subscription_id } = req.params;
    const userId = req.user.id;

    try {
      const { data: subscriptions } = await supabaseService.executeQuery('subscriptions', {
        type: 'select',
        filters: { id: subscription_id, user_id: userId }
      });

      if (!subscriptions || subscriptions.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Assinatura não encontrada'
        });
      }

      const subscription = subscriptions[0];

      res.json({
        success: true,
        subscription_id,
        auto_renewal_enabled: subscription.auto_renewal_enabled || false,
        has_saved_card: !!subscription.asaas_card_token,
        card_token_saved_at: subscription.card_token_saved_at,
        next_due_date: subscription.next_due_date,
        status: subscription.status
      });

    } catch (error) {
      logger.error('Erro ao consultar status de renovação', {
        error: error.message,
        user_id: userId,
        subscription_id
      });

      res.status(500).json({
        success: false,
        error: 'STATUS_CHECK_ERROR',
        message: 'Erro ao consultar status de renovação'
      });
    }
  })
);

/**
 * POST /internal/check-token-expiration
 * Job interno para verificar expiração de tokens
 */
router.post('/internal/check-token-expiration',
  asyncHandler(async (req, res) => {
    // Verificar se é chamada interna (pode usar um token especial)
    const internalToken = req.headers['x-internal-token'];
    if (internalToken !== process.env.INTERNAL_API_TOKEN) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Token interno inválido'
      });
    }

    logger.info('Iniciando verificação de expiração de tokens');

    try {
      // Buscar assinaturas com tokens salvos
      const { data: subscriptions } = await supabaseService.executeQuery('subscriptions', {
        type: 'select',
        filters: { auto_renewal_enabled: true }
      }, null, { useServiceRole: true });

      let checkedCount = 0;
      let expiredCount = 0;
      let notifiedCount = 0;

      for (const subscription of subscriptions || []) {
        if (!subscription.asaas_card_token) continue;

        checkedCount++;

        try {
          // Verificar se token ainda é válido no Asaas
          await asaasClient.makeRequest('GET', `/creditCard/tokenize/${subscription.asaas_card_token}`);
        } catch (error) {
          // Token expirado ou inválido
          expiredCount++;

          // Desabilitar renovação automática
          await supabaseService.executeQuery('subscriptions', {
            type: 'update',
            filters: { id: subscription.id }
          }, {
            auto_renewal_enabled: false,
            asaas_card_token: null,
            card_token_saved_at: null,
            updated_at: new Date().toISOString()
          }, { useServiceRole: true });

          // Notificar usuário sobre expiração
          await notifyTokenExpiration(subscription);
          notifiedCount++;

          logger.warn('Token de cartão expirado removido', {
            subscription_id: subscription.id,
            user_id: subscription.user_id
          });
        }
      }

      logger.info('Verificação de tokens concluída', {
        checked_count: checkedCount,
        expired_count: expiredCount,
        notified_count: notifiedCount
      });

      res.json({
        success: true,
        message: 'Verificação de tokens concluída',
        statistics: {
          checked: checkedCount,
          expired: expiredCount,
          notified: notifiedCount
        }
      });

    } catch (error) {
      logger.error('Erro na verificação de tokens', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'TOKEN_CHECK_ERROR',
        message: 'Erro na verificação de tokens'
      });
    }
  })
);

// Função auxiliar para agendar verificação de expiração
async function scheduleTokenExpirationCheck(subscriptionId, cardToken) {
  // Implementar agendamento (pode usar cron job ou queue)
  logger.info('Token expiration check scheduled', {
    subscription_id: subscriptionId,
    token_preview: cardToken.substring(0, 10) + '...'
  });
}

// Função auxiliar para notificar expiração de token
async function notifyTokenExpiration(subscription) {
  try {
    const notificationData = {
      type: 'card_token_expired',
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      message: 'Token do cartão expirado - renovação automática desabilitada'
    };

    await notificationService.notifyAdmin(notificationData);

    // Aqui poderia enviar email para o usuário também
    logger.info('Notificação de token expirado enviada', {
      subscription_id: subscription.id,
      user_id: subscription.user_id
    });
  } catch (error) {
    logger.error('Erro ao notificar expiração de token', {
      error: error.message,
      subscription_id: subscription.id
    });
  }
}

module.exports = router;