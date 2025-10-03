/**
 * Hook para gerenciar webhooks e status de pagamentos Asaas
 * Monitora mudanças de status e executa ações baseadas em eventos
 */

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PaymentStatus = 
  | 'PENDING'
  | 'RECEIVED' 
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'REFUND_IN_PROGRESS'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS';

export interface PaymentStatusUpdate {
  payment_id: string;
  asaas_id: string;
  old_status: PaymentStatus;
  new_status: PaymentStatus;
  updated_at: string;
  service_type?: string;
}

export const useAsaasWebhooks = () => {
  const [isListening, setIsListening] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<PaymentStatusUpdate | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  /**
   * Verifica status atual de um pagamento
   */
  const checkPaymentStatus = useCallback(async (paymentId: string): Promise<PaymentStatus | null> => {
    try {
      const { data, error } = await supabase
        .from('asaas_cobrancas' as any)
        .select('status')
        .eq('id', paymentId)
        .single();

      if (error) {
        console.error('Erro ao verificar status:', error);
        return null;
      }

      return (data as any)?.status || null;
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      return null;
    }
  }, []);

  /**
   * Busca histórico de webhooks para um pagamento
   */
  const getWebhookHistory = useCallback(async (asaasId: string) => {
    try {
      const { data, error } = await supabase
        .from('asaas_webhooks' as any)
        .select('*')
        .eq('asaas_payment_id', asaasId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar histórico de webhooks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico de webhooks:', error);
      return [];
    }
  }, []);

  /**
   * Monitora mudanças de status em tempo real
   */
  const startStatusMonitoring = useCallback((paymentIds: string[]) => {
    if (!user || paymentIds.length === 0) return;

    setIsListening(true);

    // Configurar subscription para mudanças na tabela asaas_cobrancas
    const subscription = supabase
      .channel('payment-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'asaas_cobrancas',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;

          if (newRecord.status !== oldRecord.status) {
            const statusUpdate: PaymentStatusUpdate = {
              payment_id: newRecord.id,
              asaas_id: newRecord.asaas_id,
              old_status: oldRecord.status,
              new_status: newRecord.status,
              updated_at: newRecord.updated_at,
              service_type: newRecord.service_type
            };

            setLastUpdate(statusUpdate);
            handleStatusChange(statusUpdate);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      setIsListening(false);
    };
  }, [user]);

  /**
   * Trata mudanças de status com notificações apropriadas
   */
  const handleStatusChange = useCallback((update: PaymentStatusUpdate) => {
    const { new_status, service_type, asaas_id } = update;

    // Notificações baseadas no novo status
    switch (new_status) {
      case 'CONFIRMED':
      case 'RECEIVED':
        toast({
          title: "Pagamento Confirmado! 🎉",
          description: `Seu pagamento foi aprovado e processado com sucesso.`,
        });
        break;

      case 'OVERDUE':
        toast({
          title: "Pagamento Vencido",
          description: "O prazo de pagamento expirou. Gere um novo boleto se necessário.",
          variant: "destructive",
        });
        break;

      case 'REFUNDED':
        toast({
          title: "Pagamento Estornado",
          description: "Seu pagamento foi estornado e o valor será devolvido.",
        });
        break;

      case 'CHARGEBACK_REQUESTED':
        toast({
          title: "Contestação Solicitada",
          description: "Uma contestação foi solicitada para este pagamento.",
          variant: "destructive",
        });
        break;

      case 'AWAITING_RISK_ANALYSIS':
        toast({
          title: "Análise de Risco",
          description: "Seu pagamento está em análise de segurança.",
        });
        break;

      default:
        console.log(`Status atualizado para: ${new_status}`);
    }

    // Ações específicas por tipo de serviço
    if (new_status === 'CONFIRMED' || new_status === 'RECEIVED') {
      handleServiceActivation(service_type, asaas_id);
    }
  }, [toast]);

  /**
   * Executa ações específicas quando serviço é ativado
   */
  const handleServiceActivation = useCallback((serviceType?: string, asaasId?: string) => {
    if (!serviceType) return;

    switch (serviceType) {
      case 'filiacao':
        toast({
          title: "Filiação Ativada! 🎉",
          description: "Sua filiação foi confirmada e está ativa. Bem-vindo!",
        });
        // Redirecionar para dashboard ou página de boas-vindas
        break;

      case 'certidao':
        toast({
          title: "Certidão Processada",
          description: "Sua certidão está sendo processada e ficará disponível em breve.",
        });
        break;

      case 'regularizacao':
        toast({
          title: "Regularização Confirmada",
          description: "Sua solicitação de regularização foi confirmada e está sendo processada.",
        });
        break;

      case 'evento':
        toast({
          title: "Inscrição Confirmada",
          description: "Sua inscrição no evento foi confirmada com sucesso!",
        });
        break;

      case 'taxa_anual':
        toast({
          title: "Taxa Anual Paga",
          description: "Sua situação foi regularizada. Você está adimplente!",
        });
        break;
    }
  }, [toast]);

  /**
   * Para o monitoramento de status
   */
  const stopStatusMonitoring = useCallback(() => {
    setIsListening(false);
    setLastUpdate(null);
  }, []);

  /**
   * Força verificação de status de um pagamento específico
   */
  const refreshPaymentStatus = useCallback(async (paymentId: string) => {
    const currentStatus = await checkPaymentStatus(paymentId);
    
    if (currentStatus) {
      console.log(`Status atual do pagamento ${paymentId}: ${currentStatus}`);
      return currentStatus;
    }
    
    return null;
  }, [checkPaymentStatus]);

  /**
   * Busca pagamentos pendentes do usuário
   */
  const getPendingPayments = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('asaas_cobrancas' as any)
        .select('id, asaas_id, valor, descricao, status, data_vencimento, service_type, created_at')
        .eq('user_id', user.id)
        .in('status', ['PENDING', 'AWAITING_RISK_ANALYSIS'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pagamentos pendentes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pagamentos pendentes:', error);
      return [];
    }
  }, [user]);

  /**
   * Verifica se há webhooks não processados
   */
  const checkUnprocessedWebhooks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('asaas_webhooks' as any)
        .select('id, asaas_payment_id, event_type, created_at')
        .eq('processed', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao verificar webhooks não processados:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao verificar webhooks não processados:', error);
      return [];
    }
  }, []);

  return {
    // Estado
    isListening,
    lastUpdate,
    
    // Funções principais
    startStatusMonitoring,
    stopStatusMonitoring,
    checkPaymentStatus,
    refreshPaymentStatus,
    
    // Consultas
    getPendingPayments,
    getWebhookHistory,
    checkUnprocessedWebhooks,
    
    // Handlers
    handleStatusChange,
    handleServiceActivation
  };
};