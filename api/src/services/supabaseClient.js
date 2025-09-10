const { createClient } = require('@supabase/supabase-js');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Cliente Supabase configurado para a API
 */
class SupabaseService {
  constructor() {
    // Cliente com chave anônima (para operações básicas)
    this.anonClient = createClient(
      config.supabase.url,
      config.supabase.anonKey
    );

    // Cliente com service role (para operações administrativas)
    this.serviceClient = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey
    );
  }

  /**
   * Obter cliente apropriado baseado no contexto
   */
  getClient(useServiceRole = false) {
    return useServiceRole ? this.serviceClient : this.anonClient;
  }

  /**
   * Executar query com logging automático
   */
  async executeQuery(tableName, operation, data = null, options = {}) {
    const client = this.getClient(options.useServiceRole);
    const startTime = Date.now();

    try {
      let query = client.from(tableName);

      // Aplicar operação
      switch (operation.type) {
        case 'select':
          query = query.select(operation.columns || '*');
          if (operation.filters) {
            Object.entries(operation.filters).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                query = query.in(key, value);
              } else {
                query = query.eq(key, value);
              }
            });
          }
          if (operation.order) {
            query = query.order(operation.order.column, { 
              ascending: operation.order.ascending !== false 
            });
          }
          if (operation.limit) {
            query = query.limit(operation.limit);
          }
          break;

        case 'insert':
          query = query.insert(data);
          if (operation.select) {
            query = query.select(operation.select);
          }
          break;

        case 'update':
          query = query.update(data);
          if (operation.filters) {
            Object.entries(operation.filters).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          if (operation.select) {
            query = query.select(operation.select);
          }
          break;

        case 'delete':
          if (operation.filters) {
            Object.entries(operation.filters).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          query = query.delete();
          break;

        default:
          throw new Error(`Operação não suportada: ${operation.type}`);
      }

      // Executar query
      const result = await query;
      const duration = Date.now() - startTime;

      // Log da operação
      logger.info('Supabase Query', {
        table: tableName,
        operation: operation.type,
        duration,
        success: !result.error,
        count: result.data?.length || 0,
        useServiceRole: options.useServiceRole
      });

      if (result.error) {
        throw result.error;
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Supabase Query Error', {
        table: tableName,
        operation: operation.type,
        duration,
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS ESPECÍFICOS PARA PAGAMENTOS
  // ============================================================================

  /**
   * Buscar ou criar usuário por email/CPF
   */
  async findOrCreateUser(userData) {
    try {
      // Primeiro, tentar encontrar por email ou CPF
      const { data: existingUsers } = await this.executeQuery('profiles', {
        type: 'select',
        filters: userData.email ? { email: userData.email } : { cpf: userData.cpfCnpj }
      }, null, { useServiceRole: true });

      if (existingUsers && existingUsers.length > 0) {
        return existingUsers[0];
      }

      // Se não encontrou, criar novo usuário
      const newUser = {
        nome_completo: userData.name,
        email: userData.email,
        telefone: userData.phone,
        cpf: userData.cpfCnpj,
        cargo: userData.cargo,
        created_at: new Date().toISOString()
      };

      const { data: createdUsers } = await this.executeQuery('profiles', {
        type: 'insert',
        select: '*'
      }, newUser, { useServiceRole: true });

      return createdUsers[0];
    } catch (error) {
      logger.error('Erro ao buscar/criar usuário', {
        userData,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Atualizar customer ID do Asaas no perfil
   */
  async updateUserAsaasCustomerId(userId, asaasCustomerId) {
    return await this.executeQuery('profiles', {
      type: 'update',
      filters: { id: userId },
      select: '*'
    }, { asaas_customer_id: asaasCustomerId }, { useServiceRole: true });
  }

  /**
   * Buscar plano de assinatura
   */
  async getSubscriptionPlan(planId) {
    const { data: plans } = await this.executeQuery('subscription_plans', {
      type: 'select',
      filters: { id: planId, is_active: true }
    });

    return plans && plans.length > 0 ? plans[0] : null;
  }

  /**
   * Criar assinatura
   */
  async createSubscription(subscriptionData) {
    return await this.executeQuery('subscriptions', {
      type: 'insert',
      select: '*'
    }, subscriptionData, { useServiceRole: true });
  }

  /**
   * Criar pagamento
   */
  async createPayment(paymentData) {
    return await this.executeQuery('payment_transactions', {
      type: 'insert',
      select: '*'
    }, paymentData, { useServiceRole: true });
  }

  /**
   * Criar solicitação de serviço
   */
  async createServiceRequest(serviceData) {
    return await this.executeQuery('services_requests', {
      type: 'insert',
      select: '*'
    }, serviceData, { useServiceRole: true });
  }

  /**
   * Atualizar status de pagamento
   */
  async updatePaymentStatus(paymentId, status, metadata = {}) {
    return await this.executeQuery('payment_transactions', {
      type: 'update',
      filters: { asaas_payment_id: paymentId },
      select: '*'
    }, { 
      status, 
      metadata,
      updated_at: new Date().toISOString()
    }, { useServiceRole: true });
  }

  /**
   * Criar transações de split
   */
  async createSplitTransactions(transactionsData) {
    return await this.executeQuery('payment_splits', {
      type: 'insert',
      select: '*'
    }, transactionsData, { useServiceRole: true });
  }

  /**
   * Registrar evento de webhook
   */
  async createWebhookEvent(eventData) {
    return await this.executeQuery('asaas_webhooks', {
      type: 'insert',
      select: '*'
    }, eventData, { useServiceRole: true });
  }

  /**
   * Verificar se evento já foi processado
   */
  async isWebhookProcessed(asaasEventId) {
    const { data: events } = await this.executeQuery('asaas_webhooks', {
      type: 'select',
      filters: { id: asaasEventId }
    }, null, { useServiceRole: true });

    return events && events.length > 0 ? events[0] : null;
  }

  /**
   * Marcar webhook como processado
   */
  async markWebhookProcessed(asaasEventId, success = true, errorMessage = null) {
    return await this.executeQuery('asaas_webhooks', {
      type: 'update',
      filters: { id: asaasEventId },
      select: '*'
    }, {
      processed: success,
      processed_at: new Date().toISOString(),
      error_message: errorMessage
    }, { useServiceRole: true });
  }

  /**
   * Buscar wallets ativas
   */
  async getActiveWallets() {
    const { data: wallets } = await this.executeQuery('wallets', {
      type: 'select',
      filters: { is_active: true }
    });

    return wallets || [];
  }

  /**
   * Validar wallet de afiliado
   */
  async validateAffiliateWallet(userId, walletId) {
    // Verificar se o usuário existe e pode ser afiliado
    const { data: users } = await this.executeQuery('profiles', {
      type: 'select',
      filters: { id: userId }
    }, null, { useServiceRole: true });

    if (!users || users.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    // Atualizar wallet do afiliado
    return await this.executeQuery('profiles', {
      type: 'update',
      filters: { id: userId },
      select: '*'
    }, { affiliate_wallet_id: walletId }, { useServiceRole: true });
  }

  /**
   * Registrar log de auditoria
   */
  async createAuditLog(logData) {
    return await this.executeQuery('audit_logs', {
      type: 'insert'
    }, {
      ...logData,
      created_at: new Date().toISOString()
    }, { useServiceRole: true });
  }

  /**
   * Buscar pagamentos para conciliação
   */
  async getPaymentsForReconciliation(filters = {}) {
    const operation = {
      type: 'select',
      columns: 'id, asaas_payment_id, amount_cents, status, created_at',
      order: { column: 'created_at', ascending: false }
    };

    if (filters.dateRange) {
      // Implementar filtro de data se necessário
    }

    if (filters.paymentIds) {
      operation.filters = { id: filters.paymentIds };
    }

    const { data: payments } = await this.executeQuery('payments', operation, null, { useServiceRole: true });
    return payments || [];
  }
}

// Singleton instance
const supabaseService = new SupabaseService();

module.exports = supabaseService;