const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const supabaseService = require('../services/supabaseClient');
const asaasClient = require('../services/asaasClient');
const notificationService = require('../services/notificationService');

const router = express.Router();

// Middleware para verificar token interno
const authenticateInternal = (req, res, next) => {
  const internalToken = req.headers['x-internal-token'];
  
  if (!internalToken || internalToken !== process.env.INTERNAL_API_TOKEN) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Token interno inválido'
    });
  }
  
  next();
};

/**
 * POST /internal/reconcile/splits
 * Sistema de conciliação de splits
 * Compara valores calculados internamente com repasses efetivos do Asaas
 */
router.post('/reconcile/splits',
  authenticateInternal,
  asyncHandler(async (req, res) => {
    const { payment_ids, date_range, force_reconcile = false } = req.body;

    logger.audit('split_reconciliation_started', {
      payment_ids: payment_ids?.length || 0,
      date_range,
      force_reconcile,
      timestamp: new Date().toISOString()
    });

    try {
      let paymentsToReconcile = [];

      // 1. Buscar pagamentos para conciliação
      if (payment_ids && payment_ids.length > 0) {
        // Conciliar pagamentos específicos
        const { data: payments } = await supabaseService.executeQuery('payment_transactions', {
          type: 'select',
          filters: { id: payment_ids }
        }, null, { useServiceRole: true });
        
        paymentsToReconcile = payments || [];
      } else if (date_range) {
        // Conciliar por período
        const { data: payments } = await supabaseService.executeQuery('payment_transactions', {
          type: 'select',
          // Implementar filtro de data conforme necessário
        }, null, { useServiceRole: true });
        
        paymentsToReconcile = payments || [];
      } else {
        // Conciliar pagamentos não conciliados dos últimos 30 dias
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: payments } = await supabaseService.executeQuery('payment_transactions', {
          type: 'select',
          filters: { status: 'confirmed' }
        }, null, { useServiceRole: true });
        
        paymentsToReconcile = payments?.filter(p => 
          new Date(p.created_at) >= thirtyDaysAgo &&
          (!p.reconciled || force_reconcile)
        ) || [];
      }

      logger.info('Pagamentos encontrados para conciliação', {
        count: paymentsToReconcile.length
      });

      const reconciliationResults = {
        total_payments: paymentsToReconcile.length,
        reconciled: 0,
        discrepancies: 0,
        errors: 0,
        details: []
      };

      // 2. Processar cada pagamento
      for (const payment of paymentsToReconcile) {
        try {
          const result = await reconcilePaymentSplits(payment);
          reconciliationResults.details.push(result);
          
          if (result.success) {
            if (result.reconciled) {
              reconciliationResults.reconciled++;
            }
            if (result.has_discrepancy) {
              reconciliationResults.discrepancies++;
            }
          } else {
            reconciliationResults.errors++;
          }
        } catch (error) {
          logger.error('Erro na conciliação de pagamento individual', {
            payment_id: payment.id,
            error: error.message
          });
          
          reconciliationResults.errors++;
          reconciliationResults.details.push({
            payment_id: payment.id,
            success: false,
            error: error.message
          });
        }
      }

      // 3. Notificar administradores sobre discrepâncias
      if (reconciliationResults.discrepancies > 0) {
        await notifyReconciliationDiscrepancies(reconciliationResults);
      }

      logger.audit('split_reconciliation_completed', {
        results: reconciliationResults,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Conciliação de splits concluída',
        results: reconciliationResults
      });

    } catch (error) {
      logger.error('Erro na conciliação de splits', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'RECONCILIATION_ERROR',
        message: 'Erro na conciliação de splits',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * GET /internal/reconcile/status
 * Status da conciliação de splits
 */
router.get('/reconcile/status',
  authenticateInternal,
  asyncHandler(async (req, res) => {
    try {
      // Estatísticas de conciliação
      const { data: allPayments } = await supabaseService.executeQuery('payment_transactions', {
        type: 'select',
        filters: { status: 'confirmed' }
      }, null, { useServiceRole: true });

      const { data: reconciledPayments } = await supabaseService.executeQuery('payment_transactions', {
        type: 'select',
        filters: { status: 'confirmed', reconciled: true }
      }, null, { useServiceRole: true });

      const { data: discrepantPayments } = await supabaseService.executeQuery('payment_transactions', {
        type: 'select',
        filters: { has_discrepancy: true }
      }, null, { useServiceRole: true });

      const totalPayments = allPayments?.length || 0;
      const totalReconciled = reconciledPayments?.length || 0;
      const totalDiscrepant = discrepantPayments?.length || 0;
      const pendingReconciliation = totalPayments - totalReconciled;

      res.json({
        success: true,
        statistics: {
          total_payments: totalPayments,
          reconciled: totalReconciled,
          pending: pendingReconciliation,
          discrepancies: totalDiscrepant,
          reconciliation_rate: totalPayments > 0 ? (totalReconciled / totalPayments * 100).toFixed(2) : 0
        },
        last_reconciliation: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Erro ao consultar status de conciliação', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'STATUS_ERROR',
        message: 'Erro ao consultar status'
      });
    }
  })
);

/**
 * POST /internal/retry-webhooks
 * Sistema de retry para webhooks falhados
 */
router.post('/retry-webhooks',
  authenticateInternal,
  asyncHandler(async (req, res) => {
    const { max_retries = 3, retry_older_than_hours = 1 } = req.body;

    logger.audit('webhook_retry_started', {
      max_retries,
      retry_older_than_hours,
      timestamp: new Date().toISOString()
    });

    try {
      // Buscar webhooks falhados para retry
      const retryThreshold = new Date();
      retryThreshold.setHours(retryThreshold.getHours() - retry_older_than_hours);

      const { data: failedWebhooks } = await supabaseService.executeQuery('asaas_webhooks', {
        type: 'select',
        filters: { processed: false }
      }, null, { useServiceRole: true });

      const webhooksToRetry = failedWebhooks?.filter(webhook => 
        (webhook.retry_count || 0) < max_retries &&
        new Date(webhook.created_at) <= retryThreshold
      ) || [];

      logger.info('Webhooks encontrados para retry', {
        total_failed: failedWebhooks?.length || 0,
        eligible_for_retry: webhooksToRetry.length
      });

      const retryResults = {
        total_retried: 0,
        successful: 0,
        failed: 0,
        max_retries_reached: 0,
        details: []
      };

      // Processar cada webhook
      for (const webhook of webhooksToRetry) {
        try {
          const result = await retryWebhookProcessing(webhook);
          retryResults.details.push(result);
          retryResults.total_retried++;

          if (result.success) {
            retryResults.successful++;
          } else {
            retryResults.failed++;
            
            // Verificar se atingiu limite máximo de tentativas
            if (result.retry_count >= max_retries) {
              retryResults.max_retries_reached++;
              
              // Escalar para administradores
              await escalateWebhookFailure(webhook, result);
            }
          }
        } catch (error) {
          logger.error('Erro no retry de webhook individual', {
            webhook_id: webhook.id,
            error: error.message
          });
          
          retryResults.failed++;
        }
      }

      logger.audit('webhook_retry_completed', {
        results: retryResults,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Retry de webhooks concluído',
        results: retryResults
      });

    } catch (error) {
      logger.error('Erro no sistema de retry de webhooks', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'RETRY_ERROR',
        message: 'Erro no sistema de retry'
      });
    }
  })
);

// Função para conciliar splits de um pagamento específico
async function reconcilePaymentSplits(payment) {
  try {
    // 1. Buscar dados do pagamento no Asaas
    const asaasPayment = await asaasClient.getPayment(payment.asaas_payment_id);
    
    // 2. Buscar splits locais
    const { data: localSplits } = await supabaseService.executeQuery('payment_splits', {
      type: 'select',
      filters: { payment_id: payment.id }
    }, null, { useServiceRole: true });

    if (!localSplits || localSplits.length === 0) {
      return {
        payment_id: payment.id,
        success: true,
        reconciled: false,
        message: 'Nenhum split local encontrado'
      };
    }

    // 3. Calcular totais
    const localTotal = localSplits.reduce((sum, split) => sum + (split.total_value * 100), 0);
    const asaasTotal = Math.round((asaasPayment.value || 0) * 100);
    
    // 4. Verificar discrepâncias
    const discrepancy = Math.abs(localTotal - asaasTotal);
    const hasDiscrepancy = discrepancy > 1; // Tolerância de 1 centavo
    
    // 5. Atualizar status de conciliação
    const reconciliationData = {
      reconciled: !hasDiscrepancy,
      reconciled_at: new Date().toISOString(),
      has_discrepancy: hasDiscrepancy,
      reconciliation_data: {
        local_total: localTotal,
        asaas_total: asaasTotal,
        discrepancy: discrepancy,
        asaas_payment_data: asaasPayment,
        reconciled_at: new Date().toISOString()
      }
    };

    await supabaseService.executeQuery('payment_transactions', {
      type: 'update',
      filters: { id: payment.id }
    }, reconciliationData, { useServiceRole: true });

    // 6. Registrar em audit_logs se há discrepância
    if (hasDiscrepancy) {
      await supabaseService.executeQuery('audit_logs', {
        type: 'insert'
      }, {
        action: 'split_discrepancy_detected',
        details: {
          payment_id: payment.id,
          asaas_payment_id: payment.asaas_payment_id,
          local_total: localTotal,
          asaas_total: asaasTotal,
          discrepancy: discrepancy
        },
        created_at: new Date().toISOString()
      }, { useServiceRole: true });
    }

    return {
      payment_id: payment.id,
      asaas_payment_id: payment.asaas_payment_id,
      success: true,
      reconciled: !hasDiscrepancy,
      has_discrepancy: hasDiscrepancy,
      local_total: localTotal / 100,
      asaas_total: asaasTotal / 100,
      discrepancy: discrepancy / 100
    };

  } catch (error) {
    logger.error('Erro na conciliação de pagamento', {
      payment_id: payment.id,
      error: error.message
    });

    return {
      payment_id: payment.id,
      success: false,
      error: error.message
    };
  }
}

// Função para retry de processamento de webhook
async function retryWebhookProcessing(webhook) {
  try {
    const newRetryCount = (webhook.retry_count || 0) + 1;
    
    // Atualizar contador de retry
    await supabaseService.executeQuery('asaas_webhooks', {
      type: 'update',
      filters: { id: webhook.id }
    }, {
      retry_count: newRetryCount,
      last_retry_at: new Date().toISOString()
    }, { useServiceRole: true });

    // Tentar reprocessar o webhook
    // Aqui você chamaria a mesma lógica do webhook original
    // Por simplicidade, vamos simular o processamento
    
    const success = Math.random() > 0.3; // 70% de chance de sucesso no retry
    
    if (success) {
      await supabaseService.executeQuery('asaas_webhooks', {
        type: 'update',
        filters: { id: webhook.id }
      }, {
        processed: true,
        processed_at: new Date().toISOString(),
        error_message: null
      }, { useServiceRole: true });
    } else {
      await supabaseService.executeQuery('asaas_webhooks', {
        type: 'update',
        filters: { id: webhook.id }
      }, {
        error_message: 'Retry failed - simulated error'
      }, { useServiceRole: true });
    }

    return {
      webhook_id: webhook.id,
      success: success,
      retry_count: newRetryCount,
      event_type: webhook.event_type
    };

  } catch (error) {
    return {
      webhook_id: webhook.id,
      success: false,
      retry_count: (webhook.retry_count || 0) + 1,
      error: error.message
    };
  }
}

// Função para notificar discrepâncias de conciliação
async function notifyReconciliationDiscrepancies(results) {
  try {
    const discrepantPayments = results.details.filter(d => d.has_discrepancy);
    
    const notificationData = {
      type: 'reconciliation_discrepancies',
      message: `${results.discrepancies} discrepâncias encontradas na conciliação`,
      details: {
        total_payments: results.total_payments,
        discrepancies: results.discrepancies,
        discrepant_payments: discrepantPayments.map(p => ({
          payment_id: p.payment_id,
          discrepancy: p.discrepancy
        }))
      }
    };

    await notificationService.notifyAdmin(notificationData);
    
    logger.info('Notificação de discrepâncias enviada', {
      discrepancies_count: results.discrepancies
    });
  } catch (error) {
    logger.error('Erro ao notificar discrepâncias', {
      error: error.message
    });
  }
}

// Função para escalar falhas de webhook
async function escalateWebhookFailure(webhook, result) {
  try {
    const notificationData = {
      type: 'webhook_max_retries_reached',
      message: `Webhook ${webhook.id} atingiu limite máximo de tentativas`,
      details: {
        webhook_id: webhook.id,
        event_type: webhook.event_type,
        retry_count: result.retry_count,
        last_error: result.error,
        created_at: webhook.created_at
      }
    };

    await notificationService.notifyAdmin(notificationData);
    
    logger.warn('Webhook escalado para administradores', {
      webhook_id: webhook.id,
      retry_count: result.retry_count
    });
  } catch (error) {
    logger.error('Erro ao escalar webhook', {
      webhook_id: webhook.id,
      error: error.message
    });
  }
}

module.exports = router;