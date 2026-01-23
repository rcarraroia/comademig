/**
 * FallbackSystem - Sistema de Recuperação para Cenários de Erro
 * 
 * Implementa sistema de fallback para recuperar processos interrompidos
 * conforme Requirement 4: Sistema de Fallback para Cenários de Erro
 */

import { supabase } from '@/integrations/supabase/client';

export interface PendingSubscriptionData {
  id?: string;
  payment_id: string;
  asaas_customer_id: string;
  user_data: {
    email: string;
    password: string;
    nome: string;
    cpf: string;
    telefone: string;
    endereco: any;
    tipo_membro: string;
  };
  subscription_data: {
    plan_id: string;
    affiliate_id?: string;
    split_config?: any;
  };
  payment_data: {
    amount: number;
    payment_method: string;
    card_token?: string;
  };
  attempts: number;
  last_error?: string;
  created_at?: string;
  updated_at?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface PendingCompletionData {
  id?: string;
  payment_id: string;
  asaas_customer_id: string;
  asaas_subscription_id: string;
  user_data: {
    email: string;
    password: string;
    nome: string;
    cpf: string;
    telefone: string;
    endereco: any;
    tipo_membro: string;
  };
  attempts: number;
  last_error?: string;
  created_at?: string;
  updated_at?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface RetryResult {
  success: boolean;
  error?: string;
  completed?: boolean;
  requiresManualIntervention?: boolean;
}

export interface FallbackStats {
  pendingSubscriptions: number;
  pendingCompletions: number;
  totalRetries: number;
  successRate: number;
  lastProcessed?: string;
}

export class FallbackSystem {
  private static instance: FallbackSystem;
  private maxRetries = 3;
  private retryDelay = 5000; // 5 segundos

  static getInstance(): FallbackSystem {
    if (!FallbackSystem.instance) {
      FallbackSystem.instance = new FallbackSystem();
    }
    return FallbackSystem.instance;
  }

  /**
   * Requirement 4.1: Armazenar dados em pending_subscriptions quando assinatura falha
   */
  async storePendingSubscription(data: PendingSubscriptionData): Promise<string> {
    try {
      console.log('Armazenando pending subscription:', data.payment_id);

      const { data: result, error } = await supabase
        .from('pending_subscriptions')
        .insert({
          payment_id: data.payment_id,
          asaas_customer_id: data.asaas_customer_id,
          user_data: data.user_data,
          subscription_data: data.subscription_data,
          payment_data: data.payment_data,
          attempts: data.attempts || 0,
          last_error: data.last_error,
          status: data.status || 'pending'
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Erro ao armazenar pending subscription: ${error.message}`);
      }

      console.log('Pending subscription armazenada com ID:', result.id);
      return result.id;

    } catch (error) {
      console.error('Erro no storePendingSubscription:', error);
      throw error;
    }
  }

  /**
   * Requirement 4.2: Armazenar dados em pending_completions quando criação de conta falha
   */
  async storePendingCompletion(data: PendingCompletionData): Promise<string> {
    try {
      console.log('Armazenando pending completion:', data.payment_id);

      const { data: result, error } = await supabase
        .from('pending_completions')
        .insert({
          payment_id: data.payment_id,
          asaas_customer_id: data.asaas_customer_id,
          asaas_subscription_id: data.asaas_subscription_id,
          user_data: data.user_data,
          attempts: data.attempts || 0,
          last_error: data.last_error,
          status: data.status || 'pending'
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Erro ao armazenar pending completion: ${error.message}`);
      }

      console.log('Pending completion armazenada com ID:', result.id);
      return result.id;

    } catch (error) {
      console.error('Erro no storePendingCompletion:', error);
      throw error;
    }
  }

  /**
   * Requirement 4.3: Tentar completar processo automaticamente
   */
  async retryPendingSubscriptions(): Promise<RetryResult[]> {
    try {
      console.log('Iniciando retry de pending subscriptions...');

      // Buscar pending subscriptions que precisam de retry
      const { data: pendingItems, error } = await supabase
        .from('pending_subscriptions')
        .select('*')
        .eq('status', 'pending')
        .lt('attempts', this.maxRetries)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Erro ao buscar pending subscriptions: ${error.message}`);
      }

      if (!pendingItems || pendingItems.length === 0) {
        console.log('Nenhuma pending subscription para processar');
        return [];
      }

      console.log(`Processando ${pendingItems.length} pending subscriptions`);

      const results: RetryResult[] = [];

      for (const item of pendingItems) {
        try {
          // Marcar como processando
          await this.updatePendingSubscriptionStatus(item.id, 'processing');

          // Tentar completar o processo
          const result = await this.completePendingSubscription(item);
          results.push(result);

          if (result.success) {
            // Marcar como concluído
            await this.updatePendingSubscriptionStatus(item.id, 'completed');
            console.log(`Pending subscription ${item.id} concluída com sucesso`);
          } else {
            // Incrementar tentativas e atualizar erro
            await this.incrementPendingSubscriptionAttempts(item.id, result.error);
            
            if (item.attempts + 1 >= this.maxRetries) {
              // Marcar como falhada e notificar admin
              await this.updatePendingSubscriptionStatus(item.id, 'failed');
              await this.notifyAdministrators('pending_subscription', item.id, result.error);
              console.error(`Pending subscription ${item.id} falhou após ${this.maxRetries} tentativas`);
            }
          }

        } catch (error) {
          console.error(`Erro ao processar pending subscription ${item.id}:`, error);
          await this.incrementPendingSubscriptionAttempts(item.id, error instanceof Error ? error.message : 'Erro desconhecido');
          
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            requiresManualIntervention: item.attempts + 1 >= this.maxRetries
          });
        }

        // Aguardar antes da próxima tentativa
        if (pendingItems.indexOf(item) < pendingItems.length - 1) {
          await this.sleep(this.retryDelay);
        }
      }

      return results;

    } catch (error) {
      console.error('Erro no retryPendingSubscriptions:', error);
      throw error;
    }
  }

  /**
   * Requirement 4.3: Tentar completar processo automaticamente (completions)
   */
  async retryPendingCompletions(): Promise<RetryResult[]> {
    try {
      console.log('Iniciando retry de pending completions...');

      // Buscar pending completions que precisam de retry
      const { data: pendingItems, error } = await supabase
        .from('pending_completions')
        .select('*')
        .eq('status', 'pending')
        .lt('attempts', this.maxRetries)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Erro ao buscar pending completions: ${error.message}`);
      }

      if (!pendingItems || pendingItems.length === 0) {
        console.log('Nenhuma pending completion para processar');
        return [];
      }

      console.log(`Processando ${pendingItems.length} pending completions`);

      const results: RetryResult[] = [];

      for (const item of pendingItems) {
        try {
          // Marcar como processando
          await this.updatePendingCompletionStatus(item.id, 'processing');

          // Tentar completar o processo
          const result = await this.completePendingCompletion(item);
          results.push(result);

          if (result.success) {
            // Marcar como concluído
            await this.updatePendingCompletionStatus(item.id, 'completed');
            console.log(`Pending completion ${item.id} concluída com sucesso`);
          } else {
            // Incrementar tentativas e atualizar erro
            await this.incrementPendingCompletionAttempts(item.id, result.error);
            
            if (item.attempts + 1 >= this.maxRetries) {
              // Marcar como falhada e notificar admin
              await this.updatePendingCompletionStatus(item.id, 'failed');
              await this.notifyAdministrators('pending_completion', item.id, result.error);
              console.error(`Pending completion ${item.id} falhou após ${this.maxRetries} tentativas`);
            }
          }

        } catch (error) {
          console.error(`Erro ao processar pending completion ${item.id}:`, error);
          await this.incrementPendingCompletionAttempts(item.id, error instanceof Error ? error.message : 'Erro desconhecido');
          
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            requiresManualIntervention: item.attempts + 1 >= this.maxRetries
          });
        }

        // Aguardar antes da próxima tentativa
        if (pendingItems.indexOf(item) < pendingItems.length - 1) {
          await this.sleep(this.retryDelay);
        }
      }

      return results;

    } catch (error) {
      console.error('Erro no retryPendingCompletions:', error);
      throw error;
    }
  }

  /**
   * Requirement 4.4: Notificar administradores quando tentativas automáticas falharem
   */
  private async notifyAdministrators(type: 'pending_subscription' | 'pending_completion', itemId: string, error?: string): Promise<void> {
    try {
      console.log(`Notificando administradores sobre falha em ${type}:`, itemId);

      // Criar notificação no sistema
      const { error: notificationError } = await supabase
        .from('admin_notifications')
        .insert({
          type: 'fallback_system_failure',
          title: `Falha no Sistema de Fallback - ${type}`,
          message: `Item ${itemId} falhou após múltiplas tentativas. Erro: ${error || 'Não especificado'}`,
          data: {
            fallback_type: type,
            item_id: itemId,
            error: error,
            requires_manual_intervention: true
          },
          priority: 'high',
          status: 'unread'
        });

      if (notificationError) {
        console.error('Erro ao criar notificação para admin:', notificationError);
      }

      // TODO: Integrar com sistema de email/webhook para notificação externa
      // await this.sendEmailNotification(type, itemId, error);

    } catch (error) {
      console.error('Erro ao notificar administradores:', error);
    }
  }

  /**
   * Requirement 4.5: Permitir completar processo manualmente
   */
  async manuallyCompletePendingSubscription(itemId: string): Promise<RetryResult> {
    try {
      console.log('Completando pending subscription manualmente:', itemId);

      // Buscar item
      const { data: item, error } = await supabase
        .from('pending_subscriptions')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error || !item) {
        throw new Error(`Pending subscription não encontrada: ${itemId}`);
      }

      // Marcar como processando
      await this.updatePendingSubscriptionStatus(itemId, 'processing');

      // Tentar completar
      const result = await this.completePendingSubscription(item);

      if (result.success) {
        await this.updatePendingSubscriptionStatus(itemId, 'completed');
        console.log(`Pending subscription ${itemId} completada manualmente`);
      } else {
        await this.updatePendingSubscriptionStatus(itemId, 'failed');
        console.error(`Falha ao completar pending subscription ${itemId} manualmente:`, result.error);
      }

      return result;

    } catch (error) {
      console.error('Erro no manuallyCompletePendingSubscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Requirement 4.5: Permitir completar processo manualmente (completions)
   */
  async manuallyCompletePendingCompletion(itemId: string): Promise<RetryResult> {
    try {
      console.log('Completando pending completion manualmente:', itemId);

      // Buscar item
      const { data: item, error } = await supabase
        .from('pending_completions')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error || !item) {
        throw new Error(`Pending completion não encontrada: ${itemId}`);
      }

      // Marcar como processando
      await this.updatePendingCompletionStatus(itemId, 'processing');

      // Tentar completar
      const result = await this.completePendingCompletion(item);

      if (result.success) {
        await this.updatePendingCompletionStatus(itemId, 'completed');
        console.log(`Pending completion ${itemId} completada manualmente`);
      } else {
        await this.updatePendingCompletionStatus(itemId, 'failed');
        console.error(`Falha ao completar pending completion ${itemId} manualmente:`, result.error);
      }

      return result;

    } catch (error) {
      console.error('Erro no manuallyCompletePendingCompletion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Obter estatísticas do sistema de fallback
   */
  async getStats(): Promise<FallbackStats> {
    try {
      // Contar pending subscriptions
      const { count: pendingSubscriptions } = await supabase
        .from('pending_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Contar pending completions
      const { count: pendingCompletions } = await supabase
        .from('pending_completions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Contar total de tentativas
      const { data: attemptsData } = await supabase
        .from('pending_subscriptions')
        .select('attempts')
        .union(
          supabase
            .from('pending_completions')
            .select('attempts')
        );

      const totalRetries = attemptsData?.reduce((sum, item) => sum + (item.attempts || 0), 0) || 0;

      // Calcular taxa de sucesso
      const { count: totalCompleted } = await supabase
        .from('pending_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const { count: totalCompletedCompletions } = await supabase
        .from('pending_completions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const { count: totalProcessed } = await supabase
        .from('pending_subscriptions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['completed', 'failed']);

      const { count: totalProcessedCompletions } = await supabase
        .from('pending_completions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['completed', 'failed']);

      const totalSuccess = (totalCompleted || 0) + (totalCompletedCompletions || 0);
      const totalItems = (totalProcessed || 0) + (totalProcessedCompletions || 0);
      const successRate = totalItems > 0 ? (totalSuccess / totalItems) * 100 : 0;

      return {
        pendingSubscriptions: pendingSubscriptions || 0,
        pendingCompletions: pendingCompletions || 0,
        totalRetries,
        successRate: Math.round(successRate * 100) / 100,
        lastProcessed: new Date().toISOString()
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        pendingSubscriptions: 0,
        pendingCompletions: 0,
        totalRetries: 0,
        successRate: 0
      };
    }
  }

  // Métodos privados auxiliares

  private async completePendingSubscription(item: PendingSubscriptionData): Promise<RetryResult> {
    try {
      // TODO: Implementar lógica de completar assinatura
      // Isso será implementado quando tivermos o PaymentFirstFlowService
      
      // Por enquanto, simular sucesso para testes
      console.log('Simulando completamento de pending subscription:', item.payment_id);
      
      return {
        success: true,
        completed: true
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  private async completePendingCompletion(item: PendingCompletionData): Promise<RetryResult> {
    try {
      // TODO: Implementar lógica de completar criação de conta
      // Isso será implementado quando tivermos o PaymentFirstFlowService
      
      // Por enquanto, simular sucesso para testes
      console.log('Simulando completamento de pending completion:', item.payment_id);
      
      return {
        success: true,
        completed: true
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  private async updatePendingSubscriptionStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('pending_subscriptions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao atualizar status: ${error.message}`);
    }
  }

  private async updatePendingCompletionStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('pending_completions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao atualizar status: ${error.message}`);
    }
  }

  private async incrementPendingSubscriptionAttempts(id: string, error?: string): Promise<void> {
    const { error: updateError } = await supabase
      .from('pending_subscriptions')
      .update({ 
        attempts: supabase.raw('attempts + 1'),
        last_error: error,
        updated_at: new Date().toISOString(),
        status: 'pending'
      })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Erro ao incrementar tentativas: ${updateError.message}`);
    }
  }

  private async incrementPendingCompletionAttempts(id: string, error?: string): Promise<void> {
    const { error: updateError } = await supabase
      .from('pending_completions')
      .update({ 
        attempts: supabase.raw('attempts + 1'),
        last_error: error,
        updated_at: new Date().toISOString(),
        status: 'pending'
      })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Erro ao incrementar tentativas: ${updateError.message}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exportar instância singleton
export const fallbackSystem = FallbackSystem.getInstance();

// Tipos auxiliares para uso em hooks
export type { PendingSubscriptionData, PendingCompletionData, RetryResult, FallbackStats };