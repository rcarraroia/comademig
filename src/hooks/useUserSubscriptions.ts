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
  } = useSupabaseQuery<UserSubscription[]>(\n    ['user-subscriptions', user?.id],\n    async (): Promise<UserSubscription[]> => {\n      if (!user) return [];\n\n      const { data, error } = await supabase\n        .from('user_subscriptions')\n        .select(`\n          *,\n          subscription_plans(\n            id,\n            name,\n            price,\n            recurrence,\n            permissions\n          ),\n          member_types(\n            id,\n            name,\n            description\n          )\n        `)\n        .eq('user_id', user.id)\n        .order('created_at', { ascending: false });\n\n      if (error) {\n        console.error('Erro ao buscar assinaturas do usuário:', error);\n        throw error;\n      }\n\n      return data || [];\n    },\n    {\n      enabled: !!user,\n      staleTime: 5 * 60 * 1000, // Cache por 5 minutos\n      cacheTime: 10 * 60 * 1000 // Manter em cache por 10 minutos\n    }\n  );\n\n  // Query para buscar assinatura ativa do usuário\n  const { \n    data: activeSubscription, \n    isLoading: loadingActiveSubscription \n  } = useSupabaseQuery<UserSubscription | null>(\n    ['active-subscription', user?.id],\n    async (): Promise<UserSubscription | null> => {\n      if (!user) return null;\n\n      const { data, error } = await supabase\n        .from('user_subscriptions')\n        .select(`\n          *,\n          subscription_plans(\n            id,\n            name,\n            price,\n            recurrence,\n            permissions\n          ),\n          member_types(\n            id,\n            name,\n            description\n          )\n        `)\n        .eq('user_id', user.id)\n        .eq('status', 'active')\n        .single();\n\n      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned\n        console.error('Erro ao buscar assinatura ativa:', error);\n        throw error;\n      }\n\n      return data || null;\n    },\n    {\n      enabled: !!user,\n      staleTime: 5 * 60 * 1000,\n      cacheTime: 10 * 60 * 1000\n    }\n  );\n\n  // Mutation para criar nova assinatura\n  const createUserSubscription = useSupabaseMutation<UserSubscription, CreateUserSubscriptionData>(\n    async (subscriptionData: CreateUserSubscriptionData): Promise<UserSubscription> => {\n      const { data, error } = await supabase\n        .from('user_subscriptions')\n        .insert({\n          ...subscriptionData,\n          start_date: subscriptionData.start_date || new Date().toISOString(),\n          status: subscriptionData.status || 'pending'\n        })\n        .select(`\n          *,\n          subscription_plans(\n            id,\n            name,\n            price,\n            recurrence,\n            permissions\n          ),\n          member_types(\n            id,\n            name,\n            description\n          )\n        `)\n        .single();\n\n      if (error) {\n        console.error('Erro ao criar assinatura:', error);\n        throw error;\n      }\n\n      return data;\n    },\n    {\n      onSuccess: () => {\n        toast.success('Assinatura criada com sucesso!');\n        refetch();\n      },\n      onError: (error) => {\n        console.error('Erro ao criar assinatura:', error);\n        toast.error('Erro ao criar assinatura. Tente novamente.');\n      }\n    }\n  );\n\n  // Mutation para atualizar status da assinatura\n  const updateSubscriptionStatus = useSupabaseMutation<UserSubscription, { id: string; status: string; payment_reference?: string }>(\n    async ({ id, status, payment_reference }): Promise<UserSubscription> => {\n      const updateData: any = { status, updated_at: new Date().toISOString() };\n      \n      if (payment_reference) {\n        updateData.payment_reference = payment_reference;\n      }\n      \n      if (status === 'active' && !payment_reference) {\n        updateData.start_date = new Date().toISOString();\n      }\n\n      const { data, error } = await supabase\n        .from('user_subscriptions')\n        .update(updateData)\n        .eq('id', id)\n        .select(`\n          *,\n          subscription_plans(\n            id,\n            name,\n            price,\n            recurrence,\n            permissions\n          ),\n          member_types(\n            id,\n            name,\n            description\n          )\n        `)\n        .single();\n\n      if (error) {\n        console.error('Erro ao atualizar status da assinatura:', error);\n        throw error;\n      }\n\n      return data;\n    },\n    {\n      onSuccess: () => {\n        toast.success('Status da assinatura atualizado!');\n        refetch();\n      },\n      onError: (error) => {\n        console.error('Erro ao atualizar assinatura:', error);\n        toast.error('Erro ao atualizar assinatura. Tente novamente.');\n      }\n    }\n  );\n\n  // Mutation para cancelar assinatura\n  const cancelSubscription = useSupabaseMutation<UserSubscription, string>(\n    async (subscriptionId: string): Promise<UserSubscription> => {\n      const { data, error } = await supabase\n        .from('user_subscriptions')\n        .update({ \n          status: 'cancelled',\n          end_date: new Date().toISOString(),\n          updated_at: new Date().toISOString()\n        })\n        .eq('id', subscriptionId)\n        .select(`\n          *,\n          subscription_plans(\n            id,\n            name,\n            price,\n            recurrence,\n            permissions\n          ),\n          member_types(\n            id,\n            name,\n            description\n          )\n        `)\n        .single();\n\n      if (error) {\n        console.error('Erro ao cancelar assinatura:', error);\n        throw error;\n      }\n\n      return data;\n    },\n    {\n      onSuccess: () => {\n        toast.success('Assinatura cancelada com sucesso!');\n        refetch();\n      },\n      onError: (error) => {\n        console.error('Erro ao cancelar assinatura:', error);\n        toast.error('Erro ao cancelar assinatura. Tente novamente.');\n      }\n    }\n  );\n\n  // Função utilitária para verificar se usuário tem assinatura ativa\n  const hasActiveSubscription = (): boolean => {\n    return activeSubscription !== null && activeSubscription !== undefined;\n  };\n\n  // Função utilitária para obter permissões da assinatura ativa\n  const getActivePermissions = (): Record<string, boolean> => {\n    if (!activeSubscription?.subscription_plans?.permissions) {\n      return {};\n    }\n    return activeSubscription.subscription_plans.permissions;\n  };\n\n  // Função utilitária para verificar se tem uma permissão específica\n  const hasPermission = (permission: string): boolean => {\n    const permissions = getActivePermissions();\n    return permissions[permission] === true;\n  };\n\n  return {\n    // Data\n    userSubscriptions,\n    activeSubscription,\n    isLoading,\n    loadingActiveSubscription,\n    error,\n    \n    // Actions\n    createUserSubscription,\n    updateSubscriptionStatus,\n    cancelSubscription,\n    refetch,\n    \n    // Utilities\n    hasActiveSubscription,\n    getActivePermissions,\n    hasPermission\n  };\n};\n\n// Hook simplificado para verificar apenas se tem assinatura ativa\nexport const useActiveSubscription = () => {\n  const { activeSubscription, loadingActiveSubscription, hasActiveSubscription } = useUserSubscriptions();\n  \n  return {\n    subscription: activeSubscription,\n    isLoading: loadingActiveSubscription,\n    hasSubscription: hasActiveSubscription()\n  };\n};"