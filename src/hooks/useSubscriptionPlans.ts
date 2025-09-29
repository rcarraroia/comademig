import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { toast } from 'sonner';

// Zod schema for validation
const SubscriptionPlanSchema = z.object({
  id: z.string().uuid().optional(),
  plan_title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  description: z.string().optional(),
  price: z.number().min(0, 'Preço deve ser positivo'),
  recurrence: z.enum(['monthly', 'semestral', 'annual'], {
    errorMap: () => ({ message: 'Recorrência deve ser monthly, semestral ou annual' })
  }),
  is_active: z.boolean().default(true),
  plan_id_gateway: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  created_by: z.string().uuid().optional(),
});

export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

export type CreateSubscriptionPlanData = Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSubscriptionPlanData = Partial<CreateSubscriptionPlanData> & { id: string };

// Query keys for cache management
const QUERY_KEYS = {
  subscriptionPlans: ['subscription-plans'] as const,
  subscriptionPlan: (id: string) => ['subscription-plans', id] as const,
  plansByMemberType: (memberTypeId: string) => ['subscription-plans', 'member-type', memberTypeId] as const,
} as const;

/**
 * Hook para buscar todos os planos de assinatura
 */
export function useSubscriptionPlans(options?: { 
  includeInactive?: boolean;
  memberTypeId?: string;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.subscriptionPlans, { 
      includeInactive: options?.includeInactive,
      memberTypeId: options?.memberTypeId 
    }],
    queryFn: async () => {
      let query = supabase
        .from('subscription_plans')
        .select(`
          *,
          member_type_subscriptions(
            member_type_id,
            member_types(
              id,
              name
            )
          )
        `)
        .order('plan_title', { ascending: true });

      if (!options?.includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar planos de assinatura:', error);
        throw new Error(`Erro ao carregar planos de assinatura: ${error.message}`);
      }

      // Filtrar por tipo de membro se especificado
      let filteredData = data;
      if (options?.memberTypeId) {
        filteredData = data.filter(plan => 
          plan.member_type_subscriptions?.some((mts: any) => 
            mts.member_type_id === options.memberTypeId
          )
        );
      }

      // Validar dados retornados
      try {
        return filteredData.map(item => {
          const planData = {
            ...item,
            member_type_subscriptions: undefined // Remove para validação
          };
          const validatedPlan = SubscriptionPlanSchema.parse(planData);
          
          // Adicionar informações de tipos de membro associados
          return {
            ...validatedPlan,
            associated_member_types: item.member_type_subscriptions || []
          };
        });
      } catch (validationError) {
        console.error('Erro de validação nos dados:', validationError);
        // Fallback: retornar dados sem validação em caso de erro
        return filteredData as (SubscriptionPlan & { associated_member_types: any[] })[];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para buscar um plano de assinatura específico
 */
export function useSubscriptionPlan(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptionPlan(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select(`
          *,
          member_type_subscriptions(
            member_type_id,
            member_types(
              id,
              name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Plano de assinatura não encontrado');
        }
        throw new Error(`Erro ao carregar plano de assinatura: ${error.message}`);
      }

      const planData = {
        ...data,
        member_type_subscriptions: undefined
      };
      
      const validatedPlan = SubscriptionPlanSchema.parse(planData);
      
      return {
        ...validatedPlan,
        associated_member_types: data.member_type_subscriptions || []
      };
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar planos disponíveis para um tipo de membro específico
 */
export function useSubscriptionPlansByMemberType(memberTypeId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.plansByMemberType(memberTypeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select(`
          *,
          member_type_subscriptions!inner(
            member_type_id
          )
        `)
        .eq('member_type_subscriptions.member_type_id', memberTypeId)
        .eq('is_active', true)
        .order('plan_title', { ascending: true });

      if (error) {
        console.error('Erro ao buscar planos por tipo de membro:', error);
        throw new Error(`Erro ao carregar planos: ${error.message}`);
      }

      return data.map(item => SubscriptionPlanSchema.parse(item));
    },
    enabled: !!memberTypeId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para criar um novo plano de assinatura
 */
export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSubscriptionPlanData & { member_type_ids?: string[] }) => {
      const { member_type_ids, ...planData } = data;
      
      // Validar dados de entrada
      const validatedData = SubscriptionPlanSchema.omit({ 
        id: true, 
        created_at: true, 
        updated_at: true 
      }).parse(planData);

      // 1. Criar o plano
      const { data: result, error } = await supabase
        .from('subscription_plans')
        .insert([validatedData])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe um plano de assinatura com este nome');
        }
        throw new Error(`Erro ao criar plano de assinatura: ${error.message}`);
      }

      // 2. Associar aos tipos de membro se especificados
      if (member_type_ids && member_type_ids.length > 0) {
        const associations = member_type_ids.map(memberTypeId => ({
          subscription_plan_id: result.id,
          member_type_id: memberTypeId
        }));

        const { error: associationError } = await supabase
          .from('member_type_subscriptions')
          .insert(associations);

        if (associationError) {
          console.error('Erro ao associar tipos de membro:', associationError);
          // Não falha aqui pois o plano já foi criado
        }
      }

      return SubscriptionPlanSchema.parse(result);
    },
    onSuccess: (data) => {
      // Invalidar cache para recarregar listas
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionPlans });
      
      // Adicionar ao cache individual
      queryClient.setQueryData(QUERY_KEYS.subscriptionPlan(data.id!), data);
      
      toast.success('Plano de assinatura criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao criar plano de assinatura:', error);
      toast.error(error.message);
    },
  });
}

/**
 * Hook para atualizar um plano de assinatura
 */
export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSubscriptionPlanData & { member_type_ids?: string[] }) => {
      const { id, member_type_ids, ...updateData } = data;
      
      // Validar dados de entrada
      const validatedData = SubscriptionPlanSchema.omit({ 
        id: true, 
        created_at: true, 
        updated_at: true 
      }).partial().parse(updateData);

      // 1. Atualizar o plano
      const { data: result, error } = await supabase
        .from('subscription_plans')
        .update(validatedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe um plano de assinatura com este nome');
        }
        if (error.code === 'PGRST116') {
          throw new Error('Plano de assinatura não encontrado');
        }
        throw new Error(`Erro ao atualizar plano de assinatura: ${error.message}`);
      }

      // 2. Atualizar associações com tipos de membro se especificado
      if (member_type_ids !== undefined) {
        // Remover associações existentes
        await supabase
          .from('member_type_subscriptions')
          .delete()
          .eq('subscription_plan_id', id);

        // Adicionar novas associações
        if (member_type_ids.length > 0) {
          const associations = member_type_ids.map(memberTypeId => ({
            subscription_plan_id: id,
            member_type_id: memberTypeId
          }));

          const { error: associationError } = await supabase
            .from('member_type_subscriptions')
            .insert(associations);

          if (associationError) {
            console.error('Erro ao atualizar associações:', associationError);
            // Não falha aqui pois o plano já foi atualizado
          }
        }
      }

      return SubscriptionPlanSchema.parse(result);
    },
    onSuccess: (data) => {
      // Invalidar cache para recarregar listas
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionPlans });
      
      // Atualizar cache individual
      queryClient.setQueryData(QUERY_KEYS.subscriptionPlan(data.id!), data);
      
      toast.success('Plano de assinatura atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar plano de assinatura:', error);
      toast.error(error.message);
    },
  });
}

/**
 * Hook para deletar um plano de assinatura
 */
export function useDeleteSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '23503') {
          throw new Error('Não é possível excluir este plano pois há usuários com assinaturas ativas');
        }
        if (error.code === 'PGRST116') {
          throw new Error('Plano de assinatura não encontrado');
        }
        throw new Error(`Erro ao excluir plano de assinatura: ${error.message}`);
      }

      return id;
    },
    onSuccess: (deletedId) => {
      // Invalidar cache para recarregar listas
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionPlans });
      
      // Remover do cache individual
      queryClient.removeQueries({ queryKey: QUERY_KEYS.subscriptionPlan(deletedId) });
      
      toast.success('Plano de assinatura excluído com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir plano de assinatura:', error);
      toast.error(error.message);
    },
  });
}

/**
 * Hook para desativar/ativar um plano de assinatura (soft delete)
 */
export function useToggleSubscriptionPlanStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data: result, error } = await supabase
        .from('subscription_plans')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Plano de assinatura não encontrado');
        }
        throw new Error(`Erro ao alterar status: ${error.message}`);
      }

      return SubscriptionPlanSchema.parse(result);
    },
    onSuccess: (data) => {
      // Invalidar cache para recarregar listas
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionPlans });
      
      // Atualizar cache individual
      queryClient.setQueryData(QUERY_KEYS.subscriptionPlan(data.id!), data);
      
      const action = data.is_active ? 'ativado' : 'desativado';
      toast.success(`Plano de assinatura ${action} com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao alterar status:', error);
      toast.error(error.message);
    },
  });
}

/**
 * Hook para obter estatísticas dos planos de assinatura
 */
export function useSubscriptionPlansStats() {
  return useQuery({
    queryKey: ['subscription-plans-stats'],
    queryFn: async () => {
      // Buscar contagem de planos
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('id, is_active, price');

      if (plansError) {
        throw new Error(`Erro ao carregar estatísticas: ${plansError.message}`);
      }

      // Buscar contagem de assinaturas ativas
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .select('subscription_plan_id, status')
        .eq('status', 'active');

      if (subscriptionsError && subscriptionsError.code !== 'PGRST116') {
        console.warn('Erro ao carregar assinaturas ativas:', subscriptionsError);
      }

      const totalPlans = plansData.length;
      const activePlans = plansData.filter(p => p.is_active).length;
      const inactivePlans = totalPlans - activePlans;
      const averagePrice = totalPlans > 0 
        ? plansData.reduce((sum, p) => sum + p.price, 0) / totalPlans 
        : 0;
      const activeSubscriptions = subscriptionsData?.length || 0;

      return {
        totalPlans,
        activePlans,
        inactivePlans,
        averagePrice,
        activeSubscriptions
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}