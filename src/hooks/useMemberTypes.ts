import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MemberType {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SubscriptionPlan {
  id: string;
  member_type_id: string;
  name: string;
  price: number;
  recurrence: string;
  duration_months: number;
  is_active: boolean;
  sort_order: number;
  features: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MemberTypeWithPlans extends MemberType {
  subscription_plans: SubscriptionPlan[];
}

interface UseMemberTypesOptions {
  includeInactive?: boolean;
  includePlans?: boolean;
}

export function useMemberTypes(options: UseMemberTypesOptions = {}) {
  const { includeInactive = false, includePlans = true } = options;

  return useQuery({
    queryKey: ['member-types', { includeInactive, includePlans }],
    queryFn: async () => {
      let query = supabase
        .from('member_types')
        .select(
          includePlans
            ? `
              *,
              subscription_plans (
                id,
                name,
                price,
                recurrence,
                duration_months,
                is_active,
                sort_order,
                features
              )
            `
            : '*'
        )
        .order('sort_order', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar member types:', error);
        throw error;
      }

      // Ordenar planos por duration_months
      if (includePlans && data) {
        return data.map((mt: any) => ({
          ...mt,
          subscription_plans: mt.subscription_plans?.sort(
            (a: SubscriptionPlan, b: SubscriptionPlan) => 
              a.duration_months - b.duration_months
          ) || []
        })) as MemberTypeWithPlans[];
      }

      return data as MemberType[];
    },
  });
}

export function useCreateMemberTypeWithPlans() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      memberType: Omit<MemberType, 'id' | 'created_at' | 'updated_at'>;
      plans: Array<{
        name: string;
        price: number;
        duration_months: number;
        features?: Record<string, any>;
        sort_order?: number;
      }>;
    }) => {
      // 1. Criar member_type
      const { data: memberType, error: mtError } = await supabase
        .from('member_types')
        .insert(data.memberType)
        .select()
        .single();

      if (mtError) {
        console.error('Erro ao criar member type:', mtError);
        throw mtError;
      }

      // 2. Criar subscription_plans
      const plansToInsert = data.plans.map((plan, index) => ({
        member_type_id: memberType.id,
        name: plan.name,
        price: plan.price,
        recurrence: 'monthly', // Sempre monthly devido ao constraint
        duration_months: plan.duration_months,
        features: plan.features || {},
        sort_order: plan.sort_order ?? index + 1,
        is_active: true,
      }));

      const { error: plansError } = await supabase
        .from('subscription_plans')
        .insert(plansToInsert);

      if (plansError) {
        console.error('Erro ao criar planos:', plansError);
        // Rollback: deletar member_type criado
        await supabase.from('member_types').delete().eq('id', memberType.id);
        throw plansError;
      }

      return { memberType, plans: plansToInsert };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-types'] });
      toast.success('Cargo e planos criados com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na criação:', error);
      toast.error('Erro ao criar cargo e planos: ' + error.message);
    },
  });
}

export function useUpdateMemberType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      updates: Partial<MemberType>;
    }) => {
      const { data: result, error } = await supabase
        .from('member_types')
        .update(data.updates)
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar member type:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-types'] });
      toast.success('Cargo atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na atualização:', error);
      toast.error('Erro ao atualizar cargo: ' + error.message);
    },
  });
}

export function useToggleMemberTypeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; is_active: boolean }) => {
      const { data: result, error } = await supabase
        .from('member_types')
        .update({ is_active: data.is_active })
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao alterar status:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['member-types'] });
      const status = result.is_active ? 'ativado' : 'desativado';
      toast.success(`Cargo ${status} com sucesso!`);
    },
    onError: (error: any) => {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status: ' + error.message);
    },
  });
}

export function useDeleteMemberType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🔧 Hook useDeleteMemberType - ID recebido:', id);
      
      // FASE 1: VALIDAÇÃO DE DEPENDÊNCIAS
      
      // 1. Verificar se há usuários usando este tipo de membro
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('member_type_id', id);
      
      if (usersError) {
        console.error('❌ Erro ao verificar usuários:', usersError);
        throw new Error('Erro ao verificar dependências de usuários');
      }
      
      console.log(`📊 Usuários usando este tipo: ${usersCount || 0}`);
      
      // 2. Verificar se há assinaturas ativas usando este tipo
      const { count: subscriptionsCount, error: subscriptionsError } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('member_type_id', id)
        .in('status', ['active', 'pending']);
      
      if (subscriptionsError) {
        console.error('❌ Erro ao verificar assinaturas:', subscriptionsError);
        throw new Error('Erro ao verificar dependências de assinaturas');
      }
      
      console.log(`📊 Assinaturas ativas usando este tipo: ${subscriptionsCount || 0}`);
      
      // 3. Se há dependências, BLOQUEAR exclusão
      if ((usersCount || 0) > 0 || (subscriptionsCount || 0) > 0) {
        const usersMsg = (usersCount || 0) > 0 ? `${usersCount} usuário(s)` : '';
        const subsMsg = (subscriptionsCount || 0) > 0 ? `${subscriptionsCount} assinatura(s) ativa(s)` : '';
        const separator = usersMsg && subsMsg ? ' e ' : '';
        
        const errorMsg = `❌ Não é possível excluir este tipo de membro.\n\n${usersMsg}${separator}${subsMsg} estão vinculados a ele.\n\n💡 Sugestão: Desative o tipo ao invés de excluir.`;
        
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('✅ Nenhuma dependência encontrada - prosseguindo com exclusão');
      
      // 4. Deletar planos associados primeiro (para evitar referências órfãs)
      const { error: plansError } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('member_type_id', id);
      
      if (plansError) {
        console.error('❌ Erro ao deletar planos:', plansError);
        throw new Error('Erro ao deletar planos associados');
      }
      
      console.log('✅ Planos associados deletados');
      
      // 5. Deletar tipo de membro (HARD DELETE)
      const { data: result, error } = await supabase
        .from('member_types')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao excluir member type:', error);
        throw new Error('Erro ao excluir tipo de membro');
      }

      console.log('✅ Tipo de membro excluído permanentemente:', result);
      return result;
    },
    onSuccess: () => {
      console.log('✅ onSuccess chamado - invalidando cache');
      queryClient.invalidateQueries({ queryKey: ['member-types'] });
      toast.success('✅ Tipo de membro excluído com sucesso!');
    },
    onError: (error: any) => {
      console.error('❌ onError chamado:', error);
      toast.error(error.message || 'Erro ao excluir tipo de membro');
    },
  });
}

// Hook para gerenciar planos de um cargo específico
export function useSubscriptionPlans(memberTypeId?: string) {
  return useQuery({
    queryKey: ['subscription-plans', memberTypeId],
    queryFn: async () => {
      if (!memberTypeId) return [];

      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('member_type_id', memberTypeId)
        .eq('is_active', true)
        .order('duration_months', { ascending: true });

      if (error) {
        console.error('Erro ao buscar planos:', error);
        throw error;
      }

      return data as SubscriptionPlan[];
    },
    enabled: !!memberTypeId,
  });
}

export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      member_type_id: string;
      name: string;
      price: number;
      duration_months: number;
      features?: Record<string, any>;
    }) => {
      const { data: result, error } = await supabase
        .from('subscription_plans')
        .insert({
          ...data,
          recurrence: 'monthly', // Sempre monthly devido ao constraint
          features: data.features || {},
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar plano:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-types'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plano criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na criação do plano:', error);
      toast.error('Erro ao criar plano: ' + error.message);
    },
  });
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      updates: Partial<SubscriptionPlan>;
    }) => {
      const { data: result, error } = await supabase
        .from('subscription_plans')
        .update(data.updates)
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar plano:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-types'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plano atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na atualização do plano:', error);
      toast.error('Erro ao atualizar plano: ' + error.message);
    },
  });
}