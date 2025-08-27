import { useSupabaseQuery, useSupabaseMutation } from './useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { z } from 'zod';

// Schema de validação
const subscriptionPlanSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, "Preço deve ser positivo"),
  recurrence: z.enum(['monthly', 'semestral', 'annual']),
  permissions: z.record(z.boolean()),
  member_types: z.array(z.string().uuid()).optional()
});

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  recurrence: 'monthly' | 'semestral' | 'annual';
  permissions: Record<string, boolean>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  member_types?: string[]; // IDs dos tipos permitidos
  _count?: {
    users: number;
    member_types: number;
  };
}

export interface CreateSubscriptionPlanData {
  name: string;
  description?: string;
  price: number;
  recurrence: 'monthly' | 'semestral' | 'annual';
  permissions: Record<string, boolean>;
  member_types?: string[];
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateSubscriptionPlanData extends CreateSubscriptionPlanData {
  id: string;
}

// Permissões disponíveis no sistema
export const AVAILABLE_PERMISSIONS = {
  manage_events: 'Permitir Criar, Publicar e Editar Eventos',
  manage_news: 'Permitir Criar, Publicar e Editar Notícias',
  manage_media: 'Permitir Criar, Publicar e Editar Vídeos e Fotos'
} as const;

export const useSubscriptionPlans = (memberTypeId?: string) => {
  const { toast } = useToast();

  // Query para buscar planos de assinatura
  const { data: plans = [], isLoading, error, refetch } = useSupabaseQuery(
    ['subscription-plans', memberTypeId],
    async (): Promise<SubscriptionPlan[]> => {
      let query = supabase
        .from('subscription_plans')
        .select(`
          *,
          member_type_subscriptions!inner(
            member_type_id,
            member_types(id, name)
          ),
          user_subscriptions(count)
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      // Filtrar por tipo de membro se fornecido
      if (memberTypeId) {
        query = query.eq('member_type_subscriptions.member_type_id', memberTypeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Processar dados
      return (data || []).map(plan => ({
        ...plan,
        member_types: plan.member_type_subscriptions?.map((mts: any) => mts.member_type_id) || [],
        _count: {
          users: plan.user_subscriptions?.length || 0,
          member_types: plan.member_type_subscriptions?.length || 0
        }
      }));
    }
  );  
// Mutation para criar plano de assinatura
  const createSubscriptionPlan = useSupabaseMutation(
    async (data: CreateSubscriptionPlanData) => {
      const validatedData = subscriptionPlanSchema.parse(data);
      
      // Criar o plano
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .insert({
          name: validatedData.name,
          description: validatedData.description,
          price: validatedData.price,
          recurrence: validatedData.recurrence,
          permissions: validatedData.permissions,
          is_active: data.is_active ?? true,
          sort_order: data.sort_order ?? 0
        })
        .select()
        .single();

      if (planError) {
        if (planError.code === '23505') {
          throw new Error('Já existe um plano com este nome');
        }
        throw new Error(`Erro ao criar plano: ${planError.message}`);
      }

      // Associar tipos de membro se fornecidos
      if (data.member_types && data.member_types.length > 0) {
        const associations = data.member_types.map(typeId => ({
          subscription_plan_id: plan.id,
          member_type_id: typeId
        }));

        const { error: assocError } = await supabase
          .from('member_type_subscriptions')
          .insert(associations);

        if (assocError) {
          console.error('Erro ao associar tipos de membro:', assocError);
        }
      }

      return plan;
    },
    {
      onSuccess: (data) => {
        toast({
          title: "Plano criado",
          description: `${data.name} foi criado com sucesso`,
        });
        refetch();
      }
    }
  );

  // Mutation para atualizar plano
  const updateSubscriptionPlan = useSupabaseMutation(
    async (data: UpdateSubscriptionPlanData) => {
      const { id, member_types, ...updateData } = data;
      const validatedData = subscriptionPlanSchema.parse(updateData);
      
      // Atualizar o plano
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (planError) {
        if (planError.code === '23505') {
          throw new Error('Já existe um plano com este nome');
        }
        throw new Error(`Erro ao atualizar plano: ${planError.message}`);
      }

      // Atualizar associações de tipos de membro
      if (member_types !== undefined) {
        // Remover associações existentes
        await supabase
          .from('member_type_subscriptions')
          .delete()
          .eq('subscription_plan_id', id);

        // Adicionar novas associações
        if (member_types.length > 0) {
          const associations = member_types.map(typeId => ({
            subscription_plan_id: id,
            member_type_id: typeId
          }));

          const { error: assocError } = await supabase
            .from('member_type_subscriptions')
            .insert(associations);

          if (assocError) {
            console.error('Erro ao atualizar associações:', assocError);
          }
        }
      }

      return plan;
    },
    {
      onSuccess: (data) => {
        toast({
          title: "Plano atualizado",
          description: `${data.name} foi atualizado com sucesso`,
        });
        refetch();
      }
    }
  );

  // Mutation para deletar plano
  const deleteSubscriptionPlan = useSupabaseMutation(
    async (id: string) => {
      // Verificar se há usuários com assinaturas ativas
      const { data: activeSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('subscription_plan_id', id)
        .eq('status', 'active');

      if (activeSubscriptions && activeSubscriptions > 0) {
        throw new Error('Não é possível excluir este plano pois há assinaturas ativas');
      }

      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao excluir plano: ${error.message}`);
      }

      return id;
    },
    {
      onSuccess: () => {
        toast({
          title: "Plano excluído",
          description: "Plano de assinatura foi excluído com sucesso",
        });
        refetch();
      }
    }
  );

  // Função para obter planos ativos
  const getActivePlans = () => {
    return plans.filter(plan => plan.is_active);
  };

  // Função para formatar preço
  const formatPrice = (price: number, recurrence: string) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);

    const recurrenceMap = {
      monthly: 'mensal',
      semestral: 'semestral', 
      annual: 'anual'
    };

    return `${formatted}/${recurrenceMap[recurrence as keyof typeof recurrenceMap]}`;
  };

  return {
    plans,
    isLoading,
    error,
    refetch,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
    getActivePlans,
    formatPrice,
    AVAILABLE_PERMISSIONS
  };
};