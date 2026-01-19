import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, isAfter, isBefore, parseISO } from 'date-fns';

interface UserSubscription {
  id: string;
  user_id: string;
  subscription_plan_id: string;
  member_type_id: string;
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'overdue';
  asaas_subscription_id: string | null;
  initial_payment_id: string | null;
  value: number;
  cycle: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SubscriptionStatus {
  hasSubscription: boolean;
  subscription: UserSubscription | null;
  canRenew: boolean;
  isNearExpiration: boolean;
  daysUntilExpiration: number | null;
  nextDueDate: Date | null;
  actionText: string;
  actionVariant: 'default' | 'destructive' | 'secondary';
}

export function useSubscriptionActions() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Buscar assinatura ativa do usuário
  const subscriptionQuery = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async (): Promise<UserSubscription | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar assinatura:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  // Calcular status da assinatura
  const getSubscriptionStatus = (): SubscriptionStatus => {
    const subscription = subscriptionQuery.data;

    if (!subscription) {
      return {
        hasSubscription: false,
        subscription: null,
        canRenew: false,
        isNearExpiration: false,
        daysUntilExpiration: null,
        nextDueDate: null,
        actionText: 'Fazer Filiação',
        actionVariant: 'default'
      };
    }

    const now = new Date();
    let nextDueDate: Date | null = null;
    let daysUntilExpiration: number | null = null;
    let isNearExpiration = false;

    // Calcular próximo vencimento baseado no ciclo
    if (subscription.expires_at) {
      nextDueDate = parseISO(subscription.expires_at);
      const diffTime = nextDueDate.getTime() - now.getTime();
      daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isNearExpiration = daysUntilExpiration <= 7 && daysUntilExpiration > 0;
    }

    // Determinar se pode renovar e texto da ação
    let canRenew = false;
    let actionText = '';
    let actionVariant: 'default' | 'destructive' | 'secondary' = 'default';

    switch (subscription.status) {
      case 'pending':
        canRenew = true;
        actionText = 'Finalizar Pagamento';
        actionVariant = 'secondary';
        break;
      case 'overdue':
        canRenew = true;
        actionText = 'Quitar Débito';
        actionVariant = 'destructive';
        break;
      case 'active':
        if (isNearExpiration) {
          canRenew = true;
          actionText = 'Renovar Antecipadamente';
          actionVariant = 'default';
        } else {
          canRenew = false;
          actionText = 'Assinatura Ativa';
          actionVariant = 'secondary';
        }
        break;
      case 'expired':
        canRenew = true;
        actionText = 'Renovar Assinatura';
        actionVariant = 'destructive';
        break;
      case 'cancelled':
        canRenew = true;
        actionText = 'Reativar Assinatura';
        actionVariant = 'default';
        break;
      default:
        canRenew = false;
        actionText = 'Status Desconhecido';
        actionVariant = 'secondary';
    }

    return {
      hasSubscription: true,
      subscription,
      canRenew,
      isNearExpiration,
      daysUntilExpiration,
      nextDueDate,
      actionText,
      actionVariant
    };
  };

  // Redirecionar para renovação
  const redirectToRenewal = () => {
    const status = getSubscriptionStatus();
    
    if (!status.subscription) {
      // Redirecionar para filiação
      navigate('/filiacao');
      return;
    }

    // Redirecionar para checkout de renovação
    const params = new URLSearchParams({
      type: 'renewal',
      subscriptionId: status.subscription.id,
      planId: status.subscription.subscription_plan_id,
      memberTypeId: status.subscription.member_type_id,
      currentStatus: status.subscription.status
    });

    navigate(`/checkout-new?${params.toString()}`);
  };

  // Verificar se está próximo do vencimento (7 dias)
  const isNearExpiration = (expirationDate: string | null): boolean => {
    if (!expirationDate) return false;
    
    const expDate = parseISO(expirationDate);
    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);
    
    return isAfter(expDate, now) && isBefore(expDate, sevenDaysFromNow);
  };

  // Calcular próxima data de vencimento
  const getNextDueDate = (subscription: UserSubscription): Date | null => {
    if (!subscription.expires_at) return null;
    return parseISO(subscription.expires_at);
  };

  return {
    subscription: subscriptionQuery.data,
    isLoading: subscriptionQuery.isLoading,
    error: subscriptionQuery.error,
    getSubscriptionStatus,
    redirectToRenewal,
    isNearExpiration,
    getNextDueDate,
    refetch: subscriptionQuery.refetch
  };
}