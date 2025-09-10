const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const supabaseService = require('../services/supabaseClient');
const asaasClient = require('../services/asaasClient');

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
 * GET /health
 * Health check completo com dependências
 */
router.get('/health',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      dependencies: {}
    };

    try {
      // 1. Verificar conexão com Supabase
      try {
        await supabaseService.executeQuery('profiles', {
          type: 'select',
          limit: 1
        }, null, { useServiceRole: true });
        
        healthStatus.dependencies.supabase = {
          status: 'healthy',
          response_time: Date.now() - startTime
        };
      } catch (error) {
        healthStatus.dependencies.supabase = {
          status: 'unhealthy',
          error: error.message,
          response_time: Date.now() - startTime
        };
        healthStatus.status = 'degraded';
      }

      // 2. Verificar conexão com Asaas
      const asaasStartTime = Date.now();
      try {
        await asaasClient.makeRequest('GET', '/customers?limit=1');
        
        healthStatus.dependencies.asaas = {
          status: 'healthy',
          response_time: Date.now() - asaasStartTime
        };
      } catch (error) {
        healthStatus.dependencies.asaas = {
          status: 'unhealthy',
          error: error.message,
          response_time: Date.now() - asaasStartTime
        };
        healthStatus.status = 'degraded';
      }

      // 3. Verificar uso de memória
      const memoryUsage = process.memoryUsage();
      healthStatus.memory = {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      };

      // 4. Verificar CPU (aproximado)
      const cpuUsage = process.cpuUsage();
      healthStatus.cpu = {
        user: cpuUsage.user,
        system: cpuUsage.system
      };

      healthStatus.response_time = Date.now() - startTime;

      // Determinar status HTTP baseado na saúde
      const statusCode = healthStatus.status === 'healthy' ? 200 : 
                        healthStatus.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json(healthStatus);

    } catch (error) {
      logger.error('Erro no health check', {
        error: error.message,
        stack: error.stack
      });

      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        response_time: Date.now() - startTime
      });
    }
  })
);

/**
 * GET /metrics
 * Métricas de performance da API
 */
router.get('/metrics',
  authenticateInternal,
  asyncHandler(async (req, res) => {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // 1. Métricas de pagamentos
      const { data: paymentsLast24h } = await supabaseService.executeQuery('payment_transactions', {
        type: 'select'
      }, null, { useServiceRole: true });

      const paymentsToday = paymentsLast24h?.filter(p => 
        new Date(p.created_at) >= last24Hours
      ) || [];

      const paymentsWeek = paymentsLast24h?.filter(p => 
        new Date(p.created_at) >= last7Days
      ) || [];

      // 2. Métricas de webhooks
      const { data: webhooksLast24h } = await supabaseService.executeQuery('asaas_webhooks', {
        type: 'select'
      }, null, { useServiceRole: true });

      const webhooksToday = webhooksLast24h?.filter(w => 
        new Date(w.created_at) >= last24Hours
      ) || [];

      const webhooksProcessed = webhooksToday.filter(w => w.processed);
      const webhooksFailed = webhooksToday.filter(w => !w.processed);

      // 3. Métricas de splits
      const { data: splits } = await supabaseService.executeQuery('payment_splits', {
        type: 'select'
      }, null, { useServiceRole: true });

      const splitsToday = splits?.filter(s => 
        new Date(s.created_at) >= last24Hours
      ) || [];

      // 4. Métricas de comissões
      const { data: commissions } = await supabaseService.executeQuery('affiliate_commissions', {
        type: 'select'
      }, null, { useServiceRole: true });

      const commissionsToday = commissions?.filter(c => 
        new Date(c.created_at) >= last24Hours
      ) || [];

      const metrics = {
        timestamp: now.toISOString(),
        period: {
          last_24_hours: last24Hours.toISOString(),
          last_7_days: last7Days.toISOString()
        },
        payments: {
          total_today: paymentsToday.length,
          total_week: paymentsWeek.length,
          confirmed_today: paymentsToday.filter(p => p.status === 'confirmed').length,
          failed_today: paymentsToday.filter(p => p.status === 'failed').length,
          total_amount_today: paymentsToday.reduce((sum, p) => sum + p.amount, 0),
          average_amount: paymentsToday.length > 0 ? 
            paymentsToday.reduce((sum, p) => sum + p.amount, 0) / paymentsToday.length : 0
        },
        webhooks: {
          total_today: webhooksToday.length,
          processed_today: webhooksProcessed.length,
          failed_today: webhooksFailed.length,
          success_rate: webhooksToday.length > 0 ? 
            (webhooksProcessed.length / webhooksToday.length * 100).toFixed(2) : 100
        },
        splits: {
          total_today: splitsToday.length,
          total_amount_today: splitsToday.reduce((sum, s) => sum + s.total_value, 0)
        },
        commissions: {
          total_today: commissionsToday.length,
          total_amount_today: commissionsToday.reduce((sum, c) => sum + c.commission_amount, 0),
          paid_today: commissionsToday.filter(c => c.status === 'paid').length
        },
        system: {
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          cpu_usage: process.cpuUsage(),
          node_version: process.version,
          platform: process.platform
        }
      };

      res.json({
        success: true,
        metrics
      });

    } catch (error) {
      logger.error('Erro ao gerar métricas', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'METRICS_ERROR',
        message: 'Erro ao gerar métricas'
      });
    }
  })
);

/**
 * GET /alerts
 * Verificar alertas críticos
 */
router.get('/alerts',
  authenticateInternal,
  asyncHandler(async (req, res) => {
    const alerts = [];
    const now = new Date();
    const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);

    try {
      // 1. Verificar taxa de erro alta
      const { data: recentPayments } = await supabaseService.executeQuery('payment_transactions', {
        type: 'select'
      }, null, { useServiceRole: true });

      const paymentsLast5Min = recentPayments?.filter(p => 
        new Date(p.created_at) >= last5Minutes
      ) || [];

      if (paymentsLast5Min.length > 0) {
        const failedPayments = paymentsLast5Min.filter(p => p.status === 'failed');
        const errorRate = (failedPayments.length / paymentsLast5Min.length) * 100;

        if (errorRate > (process.env.ERROR_RATE_THRESHOLD || 5)) {
          alerts.push({
            type: 'high_error_rate',
            severity: 'critical',
            message: `Taxa de erro alta: ${errorRate.toFixed(2)}%`,
            details: {
              total_payments: paymentsLast5Min.length,
              failed_payments: failedPayments.length,
              error_rate: errorRate
            }
          });
        }
      }

      // 2. Verificar webhooks falhados
      const { data: recentWebhooks } = await supabaseService.executeQuery('asaas_webhooks', {
        type: 'select'
      }, null, { useServiceRole: true });

      const webhooksLast5Min = recentWebhooks?.filter(w => 
        new Date(w.created_at) >= last5Minutes
      ) || [];

      const failedWebhooks = webhooksLast5Min.filter(w => !w.processed);
      
      if (failedWebhooks.length > 0) {
        alerts.push({
          type: 'webhook_failures',
          severity: 'warning',
          message: `${failedWebhooks.length} webhooks falharam nos últimos 5 minutos`,
          details: {
            failed_webhooks: failedWebhooks.length,
            total_webhooks: webhooksLast5Min.length
          }
        });
      }

      // 3. Verificar uso de memória
      const memoryUsage = process.memoryUsage();
      const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      const memoryThreshold = process.env.MEMORY_THRESHOLD || 85;

      if (memoryUsedMB > memoryThreshold) {
        alerts.push({
          type: 'high_memory_usage',
          severity: 'warning',
          message: `Uso de memória alto: ${memoryUsedMB.toFixed(2)}MB`,
          details: {
            memory_used_mb: memoryUsedMB,
            threshold: memoryThreshold
          }
        });
      }

      // 4. Verificar discrepâncias de conciliação
      const { data: discrepantPayments } = await supabaseService.executeQuery('payment_transactions', {
        type: 'select',
        filters: { has_discrepancy: true }
      }, null, { useServiceRole: true });

      if (discrepantPayments && discrepantPayments.length > 0) {
        alerts.push({
          type: 'reconciliation_discrepancies',
          severity: 'warning',
          message: `${discrepantPayments.length} pagamentos com discrepâncias`,
          details: {
            discrepant_payments: discrepantPayments.length
          }
        });
      }

      res.json({
        success: true,
        alerts,
        alert_count: alerts.length,
        timestamp: now.toISOString()
      });

    } catch (error) {
      logger.error('Erro ao verificar alertas', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'ALERTS_ERROR',
        message: 'Erro ao verificar alertas'
      });
    }
  })
);

/**
 * GET /dashboard/transactions
 * Dashboard de transações em tempo real
 */
router.get('/dashboard/transactions',
  authenticateInternal,
  asyncHandler(async (req, res) => {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Buscar transações recentes
      const { data: recentPayments } = await supabaseService.executeQuery('payment_transactions', {
        type: 'select',
        order: { column: 'created_at', ascending: false },
        limit: 50
      }, null, { useServiceRole: true });

      const paymentsLast24h = recentPayments?.filter(p => 
        new Date(p.created_at) >= last24Hours
      ) || [];

      // Agrupar por status
      const statusGroups = paymentsLast24h.reduce((groups, payment) => {
        const status = payment.status;
        if (!groups[status]) {
          groups[status] = [];
        }
        groups[status].push(payment);
        return groups;
      }, {});

      // Agrupar por método de pagamento
      const methodGroups = paymentsLast24h.reduce((groups, payment) => {
        const method = payment.payment_method || 'unknown';
        if (!groups[method]) {
          groups[method] = [];
        }
        groups[method].push(payment);
        return groups;
      }, {});

      // Calcular métricas por hora
      const hourlyMetrics = [];
      for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
        
        const hourPayments = paymentsLast24h.filter(p => {
          const paymentTime = new Date(p.created_at);
          return paymentTime >= hourStart && paymentTime < hourEnd;
        });

        hourlyMetrics.push({
          hour: hourStart.getHours(),
          timestamp: hourStart.toISOString(),
          count: hourPayments.length,
          amount: hourPayments.reduce((sum, p) => sum + p.amount, 0),
          confirmed: hourPayments.filter(p => p.status === 'confirmed').length,
          failed: hourPayments.filter(p => p.status === 'failed').length
        });
      }

      const dashboard = {
        timestamp: now.toISOString(),
        summary: {
          total_payments_24h: paymentsLast24h.length,
          total_amount_24h: paymentsLast24h.reduce((sum, p) => sum + p.amount, 0),
          confirmed_payments: (statusGroups.confirmed || []).length,
          failed_payments: (statusGroups.failed || []).length,
          pending_payments: (statusGroups.pending || []).length,
          success_rate: paymentsLast24h.length > 0 ? 
            ((statusGroups.confirmed || []).length / paymentsLast24h.length * 100).toFixed(2) : 100
        },
        by_status: Object.keys(statusGroups).map(status => ({
          status,
          count: statusGroups[status].length,
          amount: statusGroups[status].reduce((sum, p) => sum + p.amount, 0)
        })),
        by_method: Object.keys(methodGroups).map(method => ({
          method,
          count: methodGroups[method].length,
          amount: methodGroups[method].reduce((sum, p) => sum + p.amount, 0)
        })),
        hourly_metrics: hourlyMetrics,
        recent_payments: recentPayments?.slice(0, 10).map(p => ({
          id: p.id,
          asaas_payment_id: p.asaas_payment_id,
          amount: p.amount,
          status: p.status,
          payment_method: p.payment_method,
          created_at: p.created_at
        })) || []
      };

      res.json({
        success: true,
        dashboard
      });

    } catch (error) {
      logger.error('Erro ao gerar dashboard', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'DASHBOARD_ERROR',
        message: 'Erro ao gerar dashboard'
      });
    }
  })
);

/**
 * POST /alerts/test
 * Testar sistema de alertas
 */
router.post('/alerts/test',
  authenticateInternal,
  asyncHandler(async (req, res) => {
    const { alert_type = 'test' } = req.body;

    try {
      const testAlert = {
        type: alert_type,
        severity: 'info',
        message: 'Teste do sistema de alertas',
        details: {
          test: true,
          timestamp: new Date().toISOString(),
          triggered_by: 'manual_test'
        }
      };

      // Enviar alerta de teste
      await notificationService.notifyAdmin(testAlert);

      logger.audit('alert_test_sent', {
        alert_type,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Alerta de teste enviado',
        alert: testAlert
      });

    } catch (error) {
      logger.error('Erro ao enviar alerta de teste', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'ALERT_TEST_ERROR',
        message: 'Erro ao enviar alerta de teste'
      });
    }
  })
);

module.exports = router;