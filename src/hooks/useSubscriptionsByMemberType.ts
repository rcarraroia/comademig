import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Schema para plano de assinatura filtrado
const FilteredSubscriptionPlanSchema = z.object({
  id: z.string().uuid(),
  plan_title: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  recurrence: z.enum(['Mensal', 'Anual']),
  permissions: z.record(z.boolean()).default({}),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  // Dados do relacionamento
  member_type_ids: z.array(z.string()).default([]),
  compatible_member_types: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
  })).default([]),
});

export type FilteredSubscriptionPlan = z.infer<typeof FilteredSubscriptionPlanSchema>;

// Query keys
const QUERY_KEYS = {
  subscriptionsByMemberType: (memberTypeId?: string) => 
    ['subscriptions-by-member-type', memberTypeId] as const,
  allSubscriptionsWithTypes: ['all-subscriptions-with-types'] as const,
} as const;

/**
 * Hook para buscar planos de assinatura filtrados por tipo de membro
 */
export function useSubscriptionsByMemberType(memberTypeId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptionsByMemberType(memberTypeId),
    queryFn: async (): Promise<FilteredSubscriptionPlan[]> => {
      try {
        // Buscar planos de assinatura com relacionamentos
        let query = supabase
          .from('subscription_plans')
          .select(`
            *,
            member_type_subscriptions(
              member_type_id,
              member_types(
                id,
                name,
                description
              )
            )
          `)
          .eq('is_active', true)
          .order('plan_title', { ascending: true });

        const { data: plansData, error: plansError } = await query;

        if (plansError) {
          console.error('Erro ao buscar planos de assinatura:', plansError);
          throw new Error(`Erro ao carregar planos: ${plansError.message}`);
        }

        if (!plansData || plansData.length === 0) {
          return [];
        }

        // Processar e filtrar dados
        let filteredPlans = plansData.map((plan: any) => {
          const memberTypeRelations = plan.member_type_subscriptions || [];
          
          return {
            ...plan,
            member_type_ids: memberTypeRelations.map((rel: any) => rel.member_type_id),
            compatible_member_types: memberTypeRelations.map((rel: any) => rel.member_types).filter(Boolean),
            member_type_subscriptions: undefined // Remove para limpeza
          };
        });

        // Aplicar filtro por tipo de membro se especificado
        if (memberTypeId) {
          filteredPlans = filteredPlans.filter((plan: any) => 
            plan.member_type_ids.includes(memberTypeId) || 
            plan.member_type_ids.length === 0 // Planos sem restrição de tipo
          );
        }

        // Validar dados
        try {
          return filteredPlans.map(plan => FilteredSubscriptionPlanSchema.parse(plan));
        } catch (validationError) {
          console.error('Erro de validação nos planos:', validationError);
          return filteredPlans as FilteredSubscriptionPlan[];
        }

      } catch (error) {
        console.error('Erro em useSubscriptionsByMemberType:', error);
        // Em caso de erro, retornar array vazio ao invés de falhar
        return [];
      }
    },
    enabled: true, // Sempre habilitado, filtro é opcional
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para buscar todos os planos com informações de tipos compatíveis
 */
export function useAllSubscriptionsWithTypes() {
  return useQuery({
    queryKey: QUERY_KEYS.allSubscriptionsWithTypes,
    queryFn: async (): Promise<FilteredSubscriptionPlan[]> => {
      try {
        const { data: plansData, error } = await supabase
          .from('subscription_plans')
          .select(`
            *,
            member_type_subscriptions(
              member_type_id,
              member_types(
                id,
                name,
                description
              )
            )
          `)
          .eq('is_active', true)
          .order('plan_title', { ascending: true });

        if (error) {
          throw new Error(`Erro ao carregar planos: ${error.message}`);
        }

        if (!plansData) return [];

        const processedPlans = plansData.map((plan: any) => {
          const memberTypeRelations = plan.member_type_subscriptions || [];
          
          return {
            ...plan,
            member_type_ids: memberTypeRelations.map((rel: any) => rel.member_type_id),
            compatible_member_types: memberTypeRelations.map((rel: any) => rel.member_types).filter(Boolean),
            member_type_subscriptions: undefined
          };
        });

        return processedPlans.map(plan => FilteredSubscriptionPlanSchema.parse(plan));
      } catch (error) {
        console.error('Erro ao buscar todos os planos:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para verificar compatibilidade entre tipo de membro e plano
 */
export function useSubscriptionCompatibility(memberTypeId: string, subscriptionPlanId: string) {
  const { data: subscriptions } = useAllSubscriptionsWithTypes();

  const isCompatible = subscriptions?.some(plan => 
    plan.id === subscriptionPlanId && 
    (plan.member_type_ids.includes(memberTypeId) || plan.member_type_ids.length === 0)
  ) || false;

  const subscription = subscriptions?.find(plan => plan.id === subscriptionPlanId);

  return {
    isCompatible,
    subscription,
    compatibleMemberTypes: subscription?.compatible_member_types || [],
  };
}

/**
 * Utilitário para filtrar planos por tipo de membro (uso síncrono)
 */
export function filterSubscriptionsByMemberType(
  subscriptions: FilteredSubscriptionPlan[],
  memberTypeId?: string
): FilteredSubscriptionPlan[] {
  if (!memberTypeId) {
    return subscriptions;
  }

  return subscriptions.filter(plan => 
    plan.member_type_ids.includes(memberTypeId) || 
    plan.member_type_ids.length === 0 // Planos universais
  );
}

/**
 * Utilitário para obter tipos de membro compatíveis com um plano
 */
export function getCompatibleMemberTypes(subscription: FilteredSubscriptionPlan): string[] {
  return subscription.compatible_member_types.map(type => type.name);
}

/**
 * Utilitário para verificar se um plano é universal (sem restrições de tipo)
 */
export function isUniversalSubscription(subscription: FilteredSubscriptionPlan): boolean {
  return subscription.member_type_ids.length === 0;
}

/**
 * Hook para estatísticas de compatibilidade
 */
export function useSubscriptionCompatibilityStats() {
  const { data: subscriptions } = useAllSubscriptionsWithTypes();

  const stats = {
    totalPlans: subscriptions?.length || 0,
    universalPlans: subscriptions?.filter(isUniversalSubscription).length || 0,
    restrictedPlans: subscriptions?.filter(plan => !isUniversalSubscription(plan)).length || 0,
    averageCompatibleTypes: 0,
  };

  if (subscriptions && subscriptions.length > 0) {
    const totalCompatibleTypes = subscriptions.reduce(
      (sum, plan) => sum + plan.compatible_member_types.length, 
      0
    );
    stats.averageCompatibleTypes = Math.round(totalCompatibleTypes / subscriptions.length);
  }

  return stats;
}