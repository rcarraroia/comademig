import { useSupabaseQuery, useSupabaseMutation } from './useSupabase';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Interface para assinatura do usuário
export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_plan_id: string;
  member_type_id: string;
  status: 'active' | 'inactive' | 'pending' | 'cancelled';
  start_date: string;
  end_date?: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  subscription_plans?: {
    id: string;
    name: string;
    price: number;
    recurrence: string;
    permissions: Record<string, boolean>;
  };
  member_types?: {
    id: string;
    name: string;
    description?: string;
  };
}

// Interface para criar nova assinatura
export interface CreateUserSubscriptionData {
  user_id: string;
  subscription_plan_id: string;
  member_type_id: string;
  status?: 'active' | 'pending';
  payment_reference?: string;
  start_date?: string;
  end_date?: string;
}

export const useUserSubscriptions = () => {
  const { user } = useAuth();

  // Query para buscar assinaturas do usuário atual
  const { 
    data: userSubscriptions = [], 
    isLoading, 
    error, 
    refetch 
  } = useSupabaseQuery<UserSubscription[]>(
    ['user-subscriptions', user?.id],
    async (): Promise<UserSubscription[]> => {
      if (!user) return [];

      const { data, error } = await supabase
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
            name,
            description
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar assinaturas do usuário:', error);
        throw error;
      }

      return data || [];
    },
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000, // Cache por 5 minutos
      cacheTime: 10 * 60 * 1000 // Manter em cache por 10 minutos
    }
  );

  // Query para buscar assinatura ativa do usuário
  const { 
    data: activeSubscription, 
    isLoading: loadingActiveSubscription 
  } = useSupabaseQuery<UserSubscription | null>(
    ['active-subscription', user?.id],
    async (): Promise<UserSubscription | null> => {
      if (!user) return null;

      const { data, error } = await supabase
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
            name,
            description
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erro ao buscar assinatura ativa:', error);
        throw error;
      }

      return data || null;
    },
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000
    }
  );

  // Mutation para criar nova assinatura
  const createUserSubscription = useSupabaseMutation<UserSubscription, CreateUserSubscriptionData>(
    async (subscriptionData: CreateUserSubscriptionData): Promise<UserSubscription> => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          ...subscriptionData,
          start_date: subscriptionData.start_date || new Date().toISOString(),
          status: subscriptionData.status || 'pending'
        })
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
            name,
            description
          )
        `)
        .single();

      if (error) {
        console.error('Erro ao criar assinatura:', error);
        throw error;
      }

      return data;
    },
    {
      onSuccess: () => {
        toast.success('Assinatura criada com sucesso!');
        refetch();
      },
      onError: (error) => {
        console.error('Erro ao criar assinatura:', error);
        toast.error('Erro ao criar assinatura. Tente novamente.');
      }
    }
  );

  // Mutation para atualizar status da assinatura
  const updateSubscriptionStatus = useSupabaseMutation<UserSubscription, { id: string; status: string; payment_reference?: string }>(
    async ({ id, status, payment_reference }): Promise<UserSubscription> => {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      
      if (payment_reference) {
        updateData.payment_reference = payment_reference;
      }
      
      if (status === 'active' && !payment_reference) {
        updateData.start_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', id)
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
            name,
            description
          )
        `)
        .single();

      if (error) {
        console.error('Erro ao atualizar status da assinatura:', error);
        throw error;
      }

      return data;
    },
    {
      onSuccess: () => {
        toast.success('Status da assinatura atualizado!');
        refetch();
      },
      onError: (error) => {
        console.error('Erro ao atualizar assinatura:', error);
        toast.error('Erro ao atualizar assinatura. Tente novamente.');
      }
    }
  );

  // Mutation para cancelar assinatura
  const cancelSubscription = useSupabaseMutation<UserSubscription, string>(
    async (subscriptionId: string): Promise<UserSubscription> => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
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
            name,
            description
          )
        `)
        .single();

      if (error) {
        console.error('Erro ao cancelar assinatura:', error);
        throw error;
      }

      return data;
    },
    {
      onSuccess: () => {
        toast.success('Assinatura cancelada com sucesso!');
        refetch();
      },
      onError: (error) => {
        console.error('Erro ao cancelar assinatura:', error);
        toast.error('Erro ao cancelar assinatura. Tente novamente.');
      }
    }
  );

  // Função utilitária para verificar se usuário tem assinatura ativa
  const hasActiveSubscription = (): boolean => {
    return activeSubscription !== null && activeSubscription !== undefined;
  };

  // Função utilitária para obter permissões da assinatura ativa
  const getActivePermissions = (): Record<string, boolean> => {
    if (!activeSubscription?.subscription_plans?.permissions) {
      return {};
    }
    return activeSubscription.subscription_plans.permissions;
  };

  // Função utilitária para verificar se tem uma permissão específica
  const hasPermission = (permission: string): boolean => {
    const permissions = getActivePermissions();
    return permissions[permission] === true;
  };

  return {
    // Data
    userSubscriptions,
    activeSubscription,
    isLoading,
    loadingActiveSubscription,
    error,
    
    // Actions
    createUserSubscription,
    updateSubscriptionStatus,
    cancelSubscription,
    refetch,
    
    // Utilities
    hasActiveSubscription,
    getActivePermissions,
    hasPermission
  };
};

// Hook simplificado para verificar apenas se tem assinatura ativa
export const useActiveSubscription = () => {
  const { activeSubscription, loadingActiveSubscription, hasActiveSubscription } = useUserSubscriptions();
  
  return {
    subscription: activeSubscription,
    isLoading: loadingActiveSubscription,
    hasSubscription: hasActiveSubscription()
  };
};