import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Interfaces
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  recurrence: 'monthly' | 'semestral' | 'annual';
  permissions: any;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  _count?: {
    member_type_subscriptions: number;
    user_subscriptions: number;
  };
}

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_plan_id: string;
  member_type_id: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  starts_at: string;
  expires_at: string;
  auto_renew: boolean;
  payment_method?: string;
  created_at: string;
  updated_at: string;
  subscription_plan?: SubscriptionPlan;
  member_type?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    nome_completo: string;
    email: string;
  };
}

export interface MemberTypeSubscription {
  id: string;
  member_type_id: string;
  subscription_plan_id: string;
  created_at: string;
  member_type?: {
    id: string;
    name: string;
  };
  subscription_plan?: SubscriptionPlan;
}

// Hook para planos de assinatura
export const useSubscriptionPlans = () => {
  const queryClient = useQueryClient();

  // Buscar todos os planos (otimizado para evitar loop)
  const { data: plans = [], isLoading, error, refetch } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  // Criar plano
  const createPlan = useMutation({
    mutationFn: async (planData: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([{
          ...planData,
          sort_order: planData.sort_order || 0
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plano de assinatura criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar plano:', error);
      toast.error('Erro ao criar plano de assinatura');
    },
  });

  // Atualizar plano
  const updatePlan = useMutation({
    mutationFn: async ({ id, ...planData }: Partial<SubscriptionPlan> & { id: string }) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update(planData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plano de assinatura atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar plano:', error);
      toast.error('Erro ao atualizar plano de assinatura');
    },
  });

  // Excluir plano
  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plano de assinatura excluído com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao excluir plano:', error);
      toast.error('Erro ao excluir plano de assinatura');
    },
  });

  return {
    plans,
    isLoading,
    error,
    refetch,
    createPlan,
    updatePlan,
    deletePlan,
  };
};

// Hook para assinaturas de usuários
export const useUserSubscriptions = () => {
  const queryClient = useQueryClient();

  // Buscar todas as assinaturas
  const { data: subscriptions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['user-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plan:subscription_plans(*),
          member_type:member_types(id, name),
          user:profiles(id, nome_completo)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserSubscription[];
    },
  });

  // Criar assinatura
  const createSubscription = useMutation({
    mutationFn: async (subscriptionData: Omit<UserSubscription, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([subscriptionData])
        .select(`
          *,
          subscription_plan:subscription_plans(*),
          member_type:member_types(id, name),
          user:profiles(id, nome_completo)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
      toast.success('Assinatura criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar assinatura:', error);
      toast.error('Erro ao criar assinatura');
    },
  });

  // Atualizar assinatura
  const updateSubscription = useMutation({
    mutationFn: async ({ id, ...subscriptionData }: Partial<UserSubscription> & { id: string }) => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update(subscriptionData)
        .eq('id', id)
        .select(`
          *,
          subscription_plan:subscription_plans(*),
          member_type:member_types(id, name),
          user:profiles(id, nome_completo)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
      toast.success('Assinatura atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar assinatura:', error);
      toast.error('Erro ao atualizar assinatura');
    },
  });

  // Excluir assinatura
  const deleteSubscription = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
      toast.success('Assinatura excluída com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao excluir assinatura:', error);
      toast.error('Erro ao excluir assinatura');
    },
  });

  return {
    subscriptions,
    isLoading,
    error,
    refetch,
    createSubscription,
    updateSubscription,
    deleteSubscription,
  };
};

// Hook para associações entre tipos de membro e planos
export const useMemberTypeSubscriptions = () => {
  const queryClient = useQueryClient();

  // Buscar associações
  const { data: associations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['member-type-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_type_subscriptions')
        .select(`
          *,
          member_type:member_types(id, name),
          subscription_plan:subscription_plans(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MemberTypeSubscription[];
    },
  });

  // Criar associação
  const createAssociation = useMutation({
    mutationFn: async (associationData: Omit<MemberTypeSubscription, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('member_type_subscriptions')
        .insert([associationData])
        .select(`
          *,
          member_type:member_types(id, name),
          subscription_plan:subscription_plans(*)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-type-subscriptions'] });
      toast.success('Associação criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar associação:', error);
      toast.error('Erro ao criar associação');
    },
  });

  // Excluir associação
  const deleteAssociation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('member_type_subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-type-subscriptions'] });
      toast.success('Associação excluída com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao excluir associação:', error);
      toast.error('Erro ao excluir associação');
    },
  });

  return {
    associations,
    isLoading,
    error,
    refetch,
    createAssociation,
    deleteAssociation,
  };
};

// Hook para estatísticas
export const useSubscriptionStats = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      const [plansCount, activeSubscriptions, totalRevenue] = await Promise.all([
        supabase.from('subscription_plans').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('user_subscriptions').select(`
          subscription_plan:subscription_plans(price, billing_cycle)
        `).eq('status', 'active')
      ]);

      // Calcular receita total
      let monthlyRevenue = 0;
      if (totalRevenue.data) {
        totalRevenue.data.forEach((sub: any) => {
          if (sub.subscription_plan) {
            const price = sub.subscription_plan.price;
            const cycle = sub.subscription_plan.recurrence;
            
            if (cycle === 'monthly') {
              monthlyRevenue += price;
            } else if (cycle === 'annual') {
              monthlyRevenue += price / 12; // Converter anual para mensal
            } else if (cycle === 'semestral') {
              monthlyRevenue += price / 6; // Converter semestral para mensal
            }
          }
        });
      }

      return {
        totalPlans: plansCount.count || 0,
        activeSubscriptions: activeSubscriptions.count || 0,
        monthlyRevenue: monthlyRevenue,
        yearlyRevenue: monthlyRevenue * 12,
      };
    },
  });

  return {
    stats,
    isLoading,
    error,
  };
};