import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FiliacaoStatus {
  subscription: {
    id: string;
    status: 'pending' | 'active' | 'overdue' | 'cancelled';
    payment_id: string;
    member_type_id: string;
    activated_at?: string;
    expires_at: string;
    subscription_plans?: {
      name: string;
      price: number;
      recurrence: string;
    };
    member_types?: {
      name: string;
    };
  } | null;
  payment: {
    id: string;
    status: string;
    value: number;
    payment_method: string;
    created_at: string;
    data_pagamento?: string;
  } | null;
  isLoading: boolean;
  error: Error | null;
}

export function useFiliacaoStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null);

  // Query para buscar status da filiação
  const {
    data: filiacaoData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['filiacao-status', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar assinatura mais recente do usuário
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(
            id,
            name,
            price,
            recurrence,
            permissions
          ),
          member_types(
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        throw new Error(`Erro ao buscar assinatura: ${subscriptionError.message}`);
      }

      let payment = null;
      if (subscription?.payment_id) {
        // Buscar dados do pagamento
        const { data: paymentData, error: paymentError } = await supabase
          .from('asaas_cobrancas')
          .select('*')
          .eq('asaas_id', subscription.payment_id)
          .single();

        if (paymentError && paymentError.code !== 'PGRST116') {
          console.warn('Erro ao buscar pagamento:', paymentError);
        } else {
          payment = paymentData;
        }
      }

      return {
        subscription,
        payment
      };
    },
    enabled: !!user?.id,
    refetchInterval: (data) => {
      // Refetch mais frequente se pagamento estiver pendente
      if (data?.subscription?.status === 'pending' || data?.payment?.status === 'PENDING') {
        return 30000; // 30 segundos
      }
      return 300000; // 5 minutos para status estáveis
    },
  });

  // Configurar Realtime para mudanças na assinatura
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('filiacao-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Mudança na assinatura detectada:', payload);
          
          // Invalidar e refetch da query
          queryClient.invalidateQueries({ queryKey: ['filiacao-status', user.id] });
          
          // Mostrar notificação se status mudou para ativo
          if (payload.new && payload.new.status === 'active' && payload.old?.status === 'pending') {
            toast.success('Sua filiação foi ativada com sucesso!', {
              description: 'Você já pode acessar todos os benefícios do COMADEMIG.',
              duration: 5000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asaas_cobrancas',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Mudança no pagamento detectada:', payload);
          
          // Invalidar e refetch da query
          queryClient.invalidateQueries({ queryKey: ['filiacao-status', user.id] });
          
          // Mostrar notificação se pagamento foi confirmado
          if (payload.new && 
              (payload.new.status === 'CONFIRMED' || payload.new.status === 'RECEIVED') && 
              payload.old?.status === 'PENDING') {
            toast.success('Pagamento confirmado!', {
              description: 'Sua filiação será ativada em instantes.',
              duration: 3000,
            });
          }
        }
      )
      .subscribe();

    setRealtimeSubscription(subscription);

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, queryClient]);

  // Cleanup do Realtime
  useEffect(() => {
    return () => {
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
      }
    };
  }, [realtimeSubscription]);

  // Função para forçar atualização
  const refreshStatus = () => {
    refetch();
  };

  // Função para verificar se usuário tem filiação ativa
  const hasActiveSubscription = () => {
    return filiacaoData?.subscription?.status === 'active';
  };

  // Função para verificar se pagamento está pendente
  const hasPaymentPending = () => {
    return filiacaoData?.payment?.status === 'PENDING' || 
           filiacaoData?.subscription?.status === 'pending';
  };

  // Função para obter próxima data de vencimento
  const getNextDueDate = () => {
    if (!filiacaoData?.subscription?.expires_at) return null;
    return new Date(filiacaoData.subscription.expires_at);
  };

  // Função para verificar se está próximo do vencimento (30 dias)
  const isNearExpiration = () => {
    const dueDate = getNextDueDate();
    if (!dueDate) return false;
    
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 30 && diffDays > 0;
  };

  // Função para verificar se está vencido
  const isExpired = () => {
    const dueDate = getNextDueDate();
    if (!dueDate) return false;
    
    return new Date() > dueDate;
  };

  return {
    subscription: filiacaoData?.subscription || null,
    payment: filiacaoData?.payment || null,
    isLoading,
    error,
    refreshStatus,
    hasActiveSubscription,
    hasPaymentPending,
    getNextDueDate,
    isNearExpiration,
    isExpired,
  };
}