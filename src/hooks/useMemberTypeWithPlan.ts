import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedMemberType {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Financial Data (denormalized from subscription_plans)
  plan_id?: string;
  plan_title?: string;
  plan_value?: number;
  plan_recurrence?: 'Mensal' | 'Anual';
  plan_id_gateway?: string;
  plan_description?: string;
}

export interface UseMemberTypeWithPlanReturn {
  memberTypes: UnifiedMemberType[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook para buscar tipos de membro com planos associados
 * Implementa desnormalização de dados para UX otimizada
 */
export const useMemberTypeWithPlan = (): UseMemberTypeWithPlanReturn => {
  const {
    data: memberTypes = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['memberTypesWithPlan'],
    queryFn: async () => {
      // Query com JOIN para desnormalizar dados
      const { data, error } = await supabase
        .from('member_types')
        .select(`
          id,
          name,
          description,
          sort_order,
          is_active,
          created_at,
          updated_at,
          member_type_subscriptions(
            subscription_plans(
              id,
              plan_title,
              price,
              recurrence,
              plan_id_gateway,
              description
            )
          )
        `)
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Erro ao buscar tipos de membro com planos:', error);
        throw error;
      }

      // Transformar dados para formato unificado
      const unifiedData: UnifiedMemberType[] = data.map(memberType => {
        // Filtrar relacionamentos válidos (com subscription_plans não null)
        const validSubscriptions = memberType.member_type_subscriptions?.filter(
          sub => sub.subscription_plans !== null
        ) || [];
        
        const subscription = validSubscriptions[0]?.subscription_plans;
        
        return {
          id: memberType.id,
          name: memberType.name,
          description: memberType.description,
          sort_order: memberType.sort_order,
          is_active: memberType.is_active,
          created_at: memberType.created_at,
          updated_at: memberType.updated_at,
          
          // Dados financeiros desnormalizados
          plan_id: subscription?.id,
          plan_title: subscription?.plan_title,
          plan_value: subscription?.price,
          plan_recurrence: subscription?.recurrence as 'Mensal' | 'Anual',
          plan_id_gateway: subscription?.plan_id_gateway,
          plan_description: subscription?.description
        };
      });

      return unifiedData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    memberTypes,
    isLoading,
    error: error as Error | null,
    refetch
  };
};