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
 * Funciona com a estrutura atual do banco, mesmo se subscription_plans não existir ainda
 */
export const useMemberTypeWithPlan = (): UseMemberTypeWithPlanReturn => {
  const {
    data: memberTypes = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['memberTypesWithPlans'],
    queryFn: async (): Promise<UnifiedMemberType[]> => {
      try {
        // Primeiro, buscar todos os tipos de membro ativos
        const { data: memberTypesData, error: memberTypesError } = await supabase
          .from('member_types')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (memberTypesError) {
          throw new Error(`Error fetching member types: ${memberTypesError.message}`);
        }

        if (!memberTypesData || memberTypesData.length === 0) {
          return [];
        }

        // Tentar buscar dados de planos se a tabela existir
        let plansData: any[] = [];
        let relationshipsData: any[] = [];

        try {
          // Verificar se subscription_plans existe
          const { data: plans, error: plansError } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true);

          if (!plansError && plans) {
            plansData = plans;

            // Buscar relacionamentos se existirem planos
            const { data: relationships, error: relationshipsError } = await supabase
              .from('member_type_subscriptions')
              .select('*');

            if (!relationshipsError && relationships) {
              relationshipsData = relationships;
            }
          }
        } catch (error) {
          // Se as tabelas não existirem, continuamos apenas com member_types
          console.log('Subscription tables not available yet, using member_types only');
        }

        // Desnormalizar os dados
        const unifiedMemberTypes: UnifiedMemberType[] = memberTypesData.map((memberType) => {
          // Encontrar relacionamento para este tipo de membro
          const relationship = relationshipsData.find(
            (rel) => rel.member_type_id === memberType.id
          );

          // Encontrar plano associado se houver relacionamento
          const associatedPlan = relationship
            ? plansData.find((plan) => plan.id === relationship.subscription_plan_id)
            : null;

          return {
            id: memberType.id,
            name: memberType.name,
            description: memberType.description || '',
            sort_order: memberType.sort_order || 0,
            is_active: memberType.is_active,
            created_at: memberType.created_at,
            updated_at: memberType.updated_at,
            
            // Dados financeiros (se disponíveis)
            plan_id: associatedPlan?.id,
            plan_title: associatedPlan?.plan_title,
            plan_value: associatedPlan?.price,
            plan_recurrence: associatedPlan?.recurrence,
            plan_id_gateway: associatedPlan?.plan_id_gateway,
            plan_description: associatedPlan?.description,
          };
        });

        return unifiedMemberTypes;
      } catch (error) {
        console.error('Error in useMemberTypeWithPlan:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    memberTypes,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook para buscar um tipo de membro específico com plano
 */
export const useMemberTypeById = (id: string) => {
  const { memberTypes, isLoading, error } = useMemberTypeWithPlan();
  
  const memberType = memberTypes.find((mt) => mt.id === id);
  
  return {
    memberType,
    isLoading,
    error,
  };
};

/**
 * Hook para buscar apenas tipos de membro que têm planos associados
 */
export const useMemberTypesWithPlansOnly = () => {
  const { memberTypes, isLoading, error, refetch } = useMemberTypeWithPlan();
  
  const memberTypesWithPlans = memberTypes.filter((mt) => mt.plan_id);
  
  return {
    memberTypes: memberTypesWithPlans,
    isLoading,
    error,
    refetch,
  };
};