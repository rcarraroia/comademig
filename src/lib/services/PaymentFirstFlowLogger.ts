/**
 * Serviço de Logging para Payment First Flow
 * 
 * Responsável por registrar eventos, métricas e alertas do sistema
 * Requirements: 8.1, 8.2, 8.5
 */

import { supabase } from '@/integrations/supabase/client';

export type PaymentFirstFlowEventType = 
  | 'registration_started'
  | 'payment_processed'
  | 'payment_failed'
  | 'account_created'
  | 'account_creation_failed'
  | 'subscription_created'
  | 'fallback_stored'
  | 'process_completed'
  | 'process_failed';

export type AlertType = 
  | 'high_failure_rate'
  | 'slow_processing'
  | 'payment_gateway_issues'
  | 'fallback_threshold_exceeded'
  | 'system_error';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface PaymentFirstFlowLogEntry {
  event_type: PaymentFirstFlowEventType;
  user_email?: string;
  user_id?: string;
  asaas_customer_id?: string;
  asaas_payment_id?: string;
  asaas_subscription_id?: string;
  member_type?: string;
  plan_id?: string;
  affiliate_id?: string;
  processing_time_ms?: number;
  error_message?: string;
  error_code?: string;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface PaymentFirstFlowAlert {
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  threshold_value?: number;
  current_value?: number;
  context?: Record<string, any>;
}

export interface PaymentFirstFlowMetrics {
  date: string;
  hour?: number;
  total_registrations: number;
  successful_registrations: number;
  failed_registrations: number;
  payment_failures: number;
  account_creation_failures: number;
  fallback_activations: number;
  avg_processing_time_ms?: number;
  max_processing_time_ms?: number;
  min_processing_time_ms?: number;
  success_rate: number;
}

class PaymentFirstFlowLoggerService {
  /**
   * Registra um evento do Payment First Flow
   */
  async logEvent(entry: PaymentFirstFlowLogEntry): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_first_flow_logs')
        .insert([{
          event_type: entry.event_type,
          user_email: entry.user_email,
          user_id: entry.user_id,
          asaas_customer_id: entry.asaas_customer_id,
          asaas_payment_id: entry.asaas_payment_id,
          asaas_subscription_id: entry.asaas_subscription_id,
          member_type: entry.member_type,
          plan_id: entry.plan_id,
          affiliate_id: entry.affiliate_id,
          processing_time_ms: entry.processing_time_ms,
          error_message: entry.error_message,
          error_code: entry.error_code,
          context: entry.context || {},
          metadata: entry.metadata || {}
        }]);

      if (error) {
        console.error('Erro ao registrar log do Payment First Flow:', error);
        // Não falhar o processo principal por erro de log
      }
    } catch (error) {
      console.error('Erro ao registrar log do Payment First Flow:', error);
      // Não falhar o processo principal por erro de log
    }
  }

  /**
   * Registra início de processo de registro
   */
  async logRegistrationStarted(data: {
    user_email: string;
    member_type: string;
    plan_id: string;
    affiliate_id?: string;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'registration_started',
      user_email: data.user_email,
      member_type: data.member_type,
      plan_id: data.plan_id,
      affiliate_id: data.affiliate_id,
      context: data.context
    });
  }

  /**
   * Registra pagamento processado com sucesso
   */
  async logPaymentProcessed(data: {
    user_email: string;
    asaas_customer_id: string;
    asaas_payment_id: string;
    processing_time_ms: number;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'payment_processed',
      user_email: data.user_email,
      asaas_customer_id: data.asaas_customer_id,
      asaas_payment_id: data.asaas_payment_id,
      processing_time_ms: data.processing_time_ms,
      context: data.context
    });
  }

  /**
   * Registra falha no pagamento
   */
  async logPaymentFailed(data: {
    user_email: string;
    error_message: string;
    error_code?: string;
    processing_time_ms: number;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'payment_failed',
      user_email: data.user_email,
      error_message: data.error_message,
      error_code: data.error_code,
      processing_time_ms: data.processing_time_ms,
      context: data.context
    });
  }

  /**
   * Registra conta criada com sucesso
   */
  async logAccountCreated(data: {
    user_email: string;
    user_id: string;
    asaas_customer_id: string;
    processing_time_ms: number;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'account_created',
      user_email: data.user_email,
      user_id: data.user_id,
      asaas_customer_id: data.asaas_customer_id,
      processing_time_ms: data.processing_time_ms,
      context: data.context
    });
  }

  /**
   * Registra falha na criação de conta
   */
  async logAccountCreationFailed(data: {
    user_email: string;
    asaas_customer_id: string;
    error_message: string;
    error_code?: string;
    processing_time_ms: number;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'account_creation_failed',
      user_email: data.user_email,
      asaas_customer_id: data.asaas_customer_id,
      error_message: data.error_message,
      error_code: data.error_code,
      processing_time_ms: data.processing_time_ms,
      context: data.context
    });
  }

  /**
   * Registra ativação do sistema de fallback
   */
  async logFallbackStored(data: {
    user_email: string;
    asaas_payment_id: string;
    error_message: string;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'fallback_stored',
      user_email: data.user_email,
      asaas_payment_id: data.asaas_payment_id,
      error_message: data.error_message,
      context: data.context
    });
  }

  /**
   * Registra processo completado com sucesso
   */
  async logProcessCompleted(data: {
    user_email: string;
    user_id: string;
    asaas_customer_id: string;
    asaas_payment_id: string;
    asaas_subscription_id: string;
    processing_time_ms: number;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'process_completed',
      user_email: data.user_email,
      user_id: data.user_id,
      asaas_customer_id: data.asaas_customer_id,
      asaas_payment_id: data.asaas_payment_id,
      asaas_subscription_id: data.asaas_subscription_id,
      processing_time_ms: data.processing_time_ms,
      context: data.context
    });
  }

  /**
   * Registra processo falhado
   */
  async logProcessFailed(data: {
    user_email: string;
    error_message: string;
    error_code?: string;
    processing_time_ms: number;
    context?: Record<string, any>;
  }): Promise<void> {
    await this.logEvent({
      event_type: 'process_failed',
      user_email: data.user_email,
      error_message: data.error_message,
      error_code: data.error_code,
      processing_time_ms: data.processing_time_ms,
      context: data.context
    });
  }

  /**
   * Cria um alerta do sistema
   */
  async createAlert(alert: PaymentFirstFlowAlert): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_first_flow_alerts')
        .insert([{
          alert_type: alert.alert_type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          threshold_value: alert.threshold_value,
          current_value: alert.current_value,
          context: alert.context || {}
        }]);

      if (error) {
        console.error('Erro ao criar alerta:', error);
      }
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
    }
  }

  /**
   * Busca métricas agregadas
   */
  async getMetrics(options: {
    startDate: string;
    endDate: string;
    groupByHour?: boolean;
  }): Promise<PaymentFirstFlowMetrics[]> {
    try {
      let query = supabase
        .from('payment_first_flow_metrics')
        .select('*')
        .gte('date', options.startDate)
        .lte('date', options.endDate);

      if (options.groupByHour) {
        query = query.order('date', { ascending: true }).order('hour', { ascending: true });
      } else {
        query = query.is('hour', null).order('date', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar métricas:', error);
        return [];
      }

      return (data || []).map(metric => ({
        ...metric,
        success_rate: metric.total_registrations > 0 
          ? (metric.successful_registrations / metric.total_registrations) * 100 
          : 0
      }));
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      return [];
    }
  }

  /**
   * Busca alertas ativos
   */
  async getActiveAlerts(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('payment_first_flow_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar alertas:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      return [];
    }
  }

  /**
   * Resolve um alerta
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('payment_first_flow_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', alertId);

      if (error) {
        console.error('Erro ao resolver alerta:', error);
      }
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
    }
  }

  /**
   * Calcula métricas para um período
   */
  async calculateMetrics(date: string, hour?: number): Promise<void> {
    try {
      const { error } = await supabase.rpc('calculate_payment_first_flow_metrics', {
        target_date: date,
        target_hour: hour
      });

      if (error) {
        console.error('Erro ao calcular métricas:', error);
      }
    } catch (error) {
      console.error('Erro ao calcular métricas:', error);
    }
  }

  /**
   * Verifica se deve criar alertas baseado nas métricas atuais
   */
  async checkAndCreateAlerts(): Promise<void> {
    try {
      // Buscar métricas da última hora
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentHour = now.getHours();

      const metrics = await this.getMetrics({
        startDate: currentDate,
        endDate: currentDate,
        groupByHour: true
      });

      const currentMetrics = metrics.find(m => m.hour === currentHour);
      if (!currentMetrics) return;

      // Verificar taxa de falha alta (> 20%)
      if (currentMetrics.success_rate < 80 && currentMetrics.total_registrations >= 5) {
        await this.createAlert({
          alert_type: 'high_failure_rate',
          severity: 'high',
          title: 'Taxa de Falha Alta Detectada',
          description: `Taxa de sucesso de ${currentMetrics.success_rate.toFixed(1)}% na última hora`,
          threshold_value: 80,
          current_value: currentMetrics.success_rate,
          context: { metrics: currentMetrics }
        });
      }

      // Verificar processamento lento (> 20 segundos em média)
      if (currentMetrics.avg_processing_time_ms && currentMetrics.avg_processing_time_ms > 20000) {
        await this.createAlert({
          alert_type: 'slow_processing',
          severity: 'medium',
          title: 'Processamento Lento Detectado',
          description: `Tempo médio de ${(currentMetrics.avg_processing_time_ms / 1000).toFixed(1)}s na última hora`,
          threshold_value: 20000,
          current_value: currentMetrics.avg_processing_time_ms,
          context: { metrics: currentMetrics }
        });
      }

      // Verificar muitas ativações de fallback (> 10% dos registros)
      const fallbackRate = currentMetrics.total_registrations > 0 
        ? (currentMetrics.fallback_activations / currentMetrics.total_registrations) * 100 
        : 0;

      if (fallbackRate > 10 && currentMetrics.total_registrations >= 5) {
        await this.createAlert({
          alert_type: 'fallback_threshold_exceeded',
          severity: 'high',
          title: 'Muitas Ativações de Fallback',
          description: `${fallbackRate.toFixed(1)}% dos registros ativaram fallback na última hora`,
          threshold_value: 10,
          current_value: fallbackRate,
          context: { metrics: currentMetrics }
        });
      }
    } catch (error) {
      console.error('Erro ao verificar alertas:', error);
    }
  }
}

export const paymentFirstFlowLogger = new PaymentFirstFlowLoggerService();