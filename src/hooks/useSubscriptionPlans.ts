import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  recurrence: 'monthly' | 'semestral' | 'annual';
  member_type_id?: string;
  permissions?: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member_types?: {
    id: string;
    name: string;
  };
}

export interface CreateSubscriptionPlanData {
  name: string;
  description?: string;
  price: number;
  recurrence: 'monthly' | 'semestral' | 'annual';
  member_type_id?: string;
  permissions?: Record<string, boolean>;
  is_active?: boolean;
}

export const useSubscriptionPlans = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todos os planos
  const {
    data: subscriptionPlans = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select(`
          *,
          member_types (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar planos:', error);
        throw error;
      }

      return data as SubscriptionPlan[];
    }
  });

  // Criar novo plano
  const createPlan = useMutation({
    mutationFn: async (planData: CreateSubscriptionPlanData) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([{
          ...planData,
          is_active: planData.is_active ?? true
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar plano:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: "Plano criado",
        description: "Plano de assinatura criado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar plano",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
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

      if (error) {
        console.error('Erro ao atualizar plano:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: "Plano atualizado",
        description: "Plano de assinatura atualizado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  });

  // Deletar plano
  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar plano:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: "Plano removido",
        description: "Plano de assinatura removido com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover plano",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  });

  // Buscar estatísticas
  const {
    data: stats,
    isLoading: loadingStats
  } = useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      // Buscar total de assinantes ativos
      const { data: activeSubscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('id, subscription_plans(price, recurrence)')
        .eq('status', 'active');

      if (subsError) {
        console.error('Erro ao buscar assinaturas:', subsError);
        throw subsError;
      }

      // Calcular receita mensal
      let monthlyRevenue = 0;
      activeSubscriptions?.forEach(sub => {
        const plan = sub.subscription_plans as any;
        if (plan) {
          if (plan.recurrence === 'monthly') {
            monthlyRevenue += plan.price;
          } else if (plan.recurrence === 'annual') {
            monthlyRevenue += plan.price / 12;
          } else if (plan.recurrence === 'semestral') {
            monthlyRevenue += plan.price / 6;
          }
        }
      });

      return {
        activeSubscribers: activeSubscriptions?.length || 0,
        monthlyRevenue,
        activePlans: subscriptionPlans.filter(p => p.is_active).length
      };
    },
    enabled: subscriptionPlans.length > 0
  });

  return {
    subscriptionPlans,
    stats,
    isLoading,
    loadingStats,
    error,
    refetch,
    createPlan,
    updatePlan,
    deletePlan
  };
};