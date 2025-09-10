const express = require('express');
const { validateWebhook } = require('../middleware/auth');
const { webhookLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const supabaseService = require('../services/supabaseClient');
const splitService = require('../services/splitService');
const notificationService = require('../services/notificationService');

const router = express.Router();

/**
 * POST /webhook/asaas
 * Endpoint para receber webhooks do Asaas
 * Processa eventos de pagamento e assinatura em tempo real
 */
router.post('/asaas',
  webhookLimiter,
  validateWebhook,
  asyncHandler(async (req, res) => {
    const webhookData = req.body;
    const eventId = webhookData.id || `${webhookData.event}_${Date.now()}`;
    const eventType = webhookData.event;

    logger.webhook('webhook_received', {
      asaas_event_id: eventId,
      event_type: eventType,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    try {
      // 1. Verificar idempotência
      const existingEvent = await supabaseService.isWebhookProcessed(eventId);
      
      if (existingEvent) {
        if (existingEvent.processed) {
          logger.info('Webhook já processado, ignorando', {
            asaas_event_id: eventId,
            processed_at: existingEvent.processed_at
          });
          return res.status(200).json({ success: true, message: 'Already processed' });
        } else {
          logger.info('Webhook em reprocessamento', {
            asaas_event_id: eventId,
            retry_count: existingEvent.retry_count
          });
        }
      } else {
        // Registrar novo evento
        await supabaseService.createWebhookEvent({
          id: eventId,
          event_type: eventType,
          payload: webhookData,
          processed: false
        });
      }

      // 2. Processar evento baseado no tipo
      let processingResult;
      
      switch (eventType) {
        case 'PAYMENT_RECEIVED':
          processingResult = await processPaymentReceived(webhookData);
          break;
          
        case 'PAYMENT_CONFIRMED':
          processingResult = await processPaymentConfirmed(webhookData);
          break;
          
        case 'PAYMENT_FAILED':
          processingResult = await processPaymentFailed(webhookData);
          break;
          
        case 'PAYMENT_REFUNDED':
          processingResult = await processPaymentRefunded(webhookData);
          break;
          
        case 'SUBSCRIPTION_CREATED':
          processingResult = await processSubscriptionCreated(webhookData);
          break;
          
        case 'SUBSCRIPTION_PAYMENT_RECEIVED':
          processingResult = await processSubscriptionPaymentReceived(webhookData);
          break;
          
        case 'SUBSCRIPTION_CANCELED':
          processingResult = await processSubscriptionCanceled(webhookData);
          break;
          
        case 'SUBSCRIPTION_PAYMENT_FAILED':
          processingResult = await processSubscriptionPaymentFailed(webhookData);
          break;
          
        case 'PIX_EXPIRED':
        case 'PAYMENT_EXPIRED':
          processingResult = await processPaymentExpired(webhookData);
          break;
          
        default:
          logger.warn('Tipo de evento não tratado', {
            event_type: eventType,
            asaas_event_id: eventId
          });
          processingResult = { success: true, message: 'Event type not handled' };
      }

      // 3. Marcar evento como processado
      await supabaseService.markWebhookProcessed(
        eventId, 
        processingResult.success, 
        processingResult.error
      );

      logger.webhook('webhook_processed', {
        asaas_event_id: eventId,
        event_type: eventType,
        success: processingResult.success,
        processing_time: Date.now() - new Date(webhookData.dateCreated || Date.now()).getTime()
      });

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        event_id: eventId,
        result: processingResult
      });

    } catch (error) {
      logger.error('Erro no processamento de webhook', {
        error: error.message,
        stack: error.stack,
        asaas_event_id: eventId,
        event_type: eventType,
        payload: webhookData
      });

      // Marcar evento com erro para retry posterior
      try {
        await supabaseService.markWebhookProcessed(eventId, false, error.message);
      } catch (markError) {
        logger.error('Erro ao marcar webhook com falha', {
          error: markError.message,
          asaas_event_id: eventId
        });
      }

      res.status(500).json({
        success: false,
        error: 'WEBHOOK_PROCESSING_ERROR',
        message: 'Erro no processamento do webhook',
        event_id: eventId
      });
    }
  })
);

// ============================================================================
// FUNÇÕES DE PROCESSAMENTO DE EVENTOS
// ============================================================================

/**
 * Processar evento PAYMENT_RECEIVED
 */
async function processPaymentReceived(webhookData) {
  const payment = webhookData.payment;
  
  logger.payment('payment_received', {
    asaas_payment_id: payment.id,
    value: payment.value,
    status: payment.status
  });

  try {
    // Atualizar status do pagamento
    await supabaseService.updatePaymentStatus(payment.id, 'received', {
      webhook_data: webhookData,
      received_at: new Date().toISOString()
    });

    // Buscar dados do pagamento local para split
    const { data: payments } = await supabaseService.executeQuery('payment_transactions', {
      type: 'select',
      filters: { asaas_payment_id: payment.id }
    }, null, { useServiceRole: true });

    if (payments && payments.length > 0) {
      const localPayment = payments[0];
      
      // Se for pagamento de serviço, notificar admin
      if (localPayment.metadata?.service_type) {
        await notifyServicePayment(localPayment, payment);
      }
    }

    return { success: true, message: 'Payment received processed' };
  } catch (error) {
    logger.error('Erro ao processar PAYMENT_RECEIVED', {
      error: error.message,
      payment_id: payment.id
    });
    return { success: false, error: error.message };
  }
}

/**
 * Processar evento PAYMENT_CONFIRMED
 */
async function processPaymentConfirmed(webhookData) {
  const payment = webhookData.payment;
  
  logger.payment('payment_confirmed', {
    asaas_payment_id: payment.id,
    value: payment.value
  });

  try {
    // Atualizar status do pagamento
    await supabaseService.updatePaymentStatus(payment.id, 'confirmed', {
      webhook_data: webhookData,
      confirmed_at: new Date().toISOString()
    });

    // Buscar dados do pagamento local
    const { data: payments } = await supabaseService.executeQuery('payment_transactions', {
      type: 'select',
      filters: { asaas_payment_id: payment.id }
    }, null, { useServiceRole: true });

    if (payments && payments.length > 0) {
      const localPayment = payments[0];
      
      // Se for pagamento de serviço, notificar admin
      if (localPayment.metadata?.service_type) {
        await notifyServicePayment(localPayment, payment);
      }
    }

    return { success: true, message: 'Payment confirmed processed' };
  } catch (error) {
    logger.error('Erro ao processar PAYMENT_CONFIRMED', {
      error: error.message,
      payment_id: payment.id
    });
    return { success: false, error: error.message };
  }
}

/**
 * Processar evento PAYMENT_FAILED
 */
async function processPaymentFailed(webhookData) {
  const payment = webhookData.payment;
  
  logger.payment('payment_failed', {
    asaas_payment_id: payment.id,
    value: payment.value,
    failure_reason: payment.failureReason
  });

  try {
    // Atualizar status do pagamento
    await supabaseService.updatePaymentStatus(payment.id, 'failed', {
      webhook_data: webhookData,
      failed_at: new Date().toISOString(),
      failure_reason: payment.failureReason
    });

    // Notificar sobre falha
    await notificationService.notifyPaymentFailure(payment);

    return { success: true, message: 'Payment failure processed' };
  } catch (error) {
    logger.error('Erro ao processar PAYMENT_FAILED', {
      error: error.message,
      payment_id: payment.id
    });
    return { success: false, error: error.message };
  }
}

/**
 * Processar evento SUBSCRIPTION_CREATED
 */
async function processSubscriptionCreated(webhookData) {
  const subscription = webhookData.subscription;
  
  logger.info('Assinatura criada no Asaas', {
    asaas_subscription_id: subscription.id,
    status: subscription.status
  });

  try {
    // Lógica para processar criação de assinatura
    return { success: true, message: 'Subscription created processed' };
  } catch (error) {
    logger.error('Erro ao processar SUBSCRIPTION_CREATED', {
      error: error.message,
      subscription_id: subscription.id
    });
    return { success: false, error: error.message };
  }
}

/**
 * Notificar administradores sobre pagamento de serviço
 */
async function notifyServicePayment(localPayment, asaasPayment) {
  try {
    const notificationData = {
      type: 'service_paid',
      service_id: localPayment.metadata?.service_request_id,
      user_id: localPayment.user_id,
      payment_id: asaasPayment.id,
      service_type: localPayment.metadata?.service_type,
      amount: Math.round(asaasPayment.value * 100) // Converter para centavos
    };

    await notificationService.notifyAdmin(notificationData);
    
    logger.info('Notificação de serviço pago enviada', {
      service_request_id: localPayment.metadata?.service_request_id,
      payment_id: asaasPayment.id
    });
  } catch (error) {
    logger.error('Erro ao notificar pagamento de serviço', {
      error: error.message,
      service_request_id: localPayment.metadata?.service_request_id
    });
  }
}

/**
 * Processar expiração de pagamento
 */
async function processPaymentExpired(webhookData) {
  const payment = webhookData.payment;
  
  logger.payment('payment_expired', {
    asaas_payment_id: payment.id,
    value: payment.value
  });

  try {
    // Atualizar status do pagamento
    await supabaseService.updatePaymentStatus(payment.id, 'expired', {
      webhook_data: webhookData,
      expired_at: new Date().toISOString(),
      failure_reason: 'Payment expired'
    });

    return { success: true, message: 'Payment expiration processed' };
  } catch (error) {
    logger.error('Erro ao processar expiração de pagamento', {
      error: error.message,
      payment_id: payment.id
    });
    return { success: false, error: error.message };
  }
}

/**
 * Processar cancelamento de assinatura
 */
async function processSubscriptionCanceled(webhookData) {
  const subscription = webhookData.subscription;
  
  logger.info('Assinatura cancelada', {
    asaas_subscription_id: subscription.id
  });

  try {
    // Lógica para processar cancelamento
    return { success: true, message: 'Subscription cancellation processed' };
  } catch (error) {
    logger.error('Erro ao processar cancelamento de assinatura', {
      error: error.message,
      subscription_id: subscription.id
    });
    return { success: false, error: error.message };
  }
}

/**
 * Processar pagamento de assinatura recebido
 */
async function processSubscriptionPaymentReceived(webhookData) {
  const payment = webhookData.payment;
  const subscription = webhookData.subscription;
  
  logger.payment('subscription_payment_received', {
    asaas_payment_id: payment.id,
    asaas_subscription_id: subscription.id,
    value: payment.value
  });

  try {
    // Processar como pagamento normal
    return await processPaymentReceived(webhookData);
  } catch (error) {
    logger.error('Erro ao processar pagamento de assinatura', {
      error: error.message,
      payment_id: payment.id,
      subscription_id: subscription.id
    });
    return { success: false, error: error.message };
  }
}

/**
 * Processar falha de pagamento de assinatura
 */
async function processSubscriptionPaymentFailed(webhookData) {
  const payment = webhookData.payment;
  const subscription = webhookData.subscription;
  
  logger.payment('subscription_payment_failed', {
    asaas_payment_id: payment.id,
    asaas_subscription_id: subscription.id,
    failure_reason: payment.failureReason
  });

  try {
    // Processar falha do pagamento
    await processPaymentFailed(webhookData);

    return { success: true, message: 'Subscription payment failure processed' };
  } catch (error) {
    logger.error('Erro ao processar falha de pagamento de assinatura', {
      error: error.message,
      payment_id: payment.id,
      subscription_id: subscription.id
    });
    return { success: false, error: error.message };
  }
}

/**
 * Processar refund de pagamento
 */
async function processPaymentRefunded(webhookData) {
  const payment = webhookData.payment;
  
  logger.payment('payment_refunded', {
    asaas_payment_id: payment.id,
    value: payment.value
  });

  try {
    // Atualizar status do pagamento
    await supabaseService.updatePaymentStatus(payment.id, 'refunded', {
      webhook_data: webhookData,
      refunded_at: new Date().toISOString()
    });

    return { success: true, message: 'Payment refund processed' };
  } catch (error) {
    logger.error('Erro ao processar refund de pagamento', {
      error: error.message,
      payment_id: payment.id
    });
    return { success: false, error: error.message };
  }
}

module.exports = router;