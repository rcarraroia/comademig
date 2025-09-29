import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { toast } from 'sonner';

// Schema para assinatura de usuário (visão administrativa)
const AdminUserSubscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  subscription_plan_id: z.string().uuid(),
  member_type_id: z.string().uuid(),
  status: z.enum(['active', 'expired', 'cancelled', 'pending']),
  payment_id: z.string().nullable(),
  started_at: z.string(),
  expires_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  // Relacionamentos
  profiles: z.object({
    id: z.string().uuid(),
    nome_completo: z.string(),
    email: z.string().email(),
    cpf: z.string().nullable(),
    telefone: z.string().nullable(),
  }).optional(),
  subscription_plans: z.object({
    id: z.string().uuid(),
    name: z.string(),
    price: z.number(),
    recurrence: z.enum(['monthly', 'semestral', 'annual']),
    permissions: z.record(z.boolean()),
  }).optional(),
  member_types: z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
  }).optional(),
});

export type AdminUserSubscription = z.infer<typeof AdminUserSubscriptionSchema>;

// Schema para criação de assinatura
const CreateUserSubscriptionSchema = z.object({
  user_id: z.string().uuid(),
  subscription_plan_id: z.string().uuid(),
  member_type_id: z.string().uuid(),
  payment_id: z.string().optional(),
  expires_at: z.string().nullable().optional(),
  status: z.enum(['active', 'expired', 'cancelled', 'pending']).default('active'),
});

export type CreateUserSubscriptionData = z.infer<typeof CreateUserSubscriptionSchema>;

// Query keys for cache management
const QUERY_KEYS = {
  allUserSubscriptions: ['admin-user-subscriptions'] as const,
  userSubscriptions: (userId: string) => ['admin-user-subscriptions', 'user', userId] as const,
  subscriptionsByPlan: (planId: string) => ['admin-user-subscriptions', 'plan', planId] as const,
  subscriptionsByStatus: (status: string) => ['admin-user-subscriptions', 'status', status] as const,
  subscriptionStats: ['admin-user-subscriptions-stats'] as const,
} as const;

/**
 * Hook para listar todas as assinaturas de usuários (visão administrativa)
 */
export function useAllUserSubscriptions(options?: {
  status?: 'active' | 'expired' | 'cancelled' | 'pending';
  planId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.allUserSubscriptions, options],
    queryFn: async () => {
      let query = supabase
        .from('user_subscriptions')
        .select(`
          *,
          profiles(
            id,
            nome_completo,
            email,
            cpf,
            telefone
          ),
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
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.planId) {
        query = query.eq('subscription_plan_id', options.planId);
      }

      if (options?.userId) {
        query = query.eq('user_id', options.userId);
      }

      // Paginação
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar assinaturas de usuários:', error);
        throw new Error(`Erro ao carregar assinaturas: ${error.message}`);
      }

      // Validar dados retornados
      try {
        return data.map(item => AdminUserSubscriptionSchema.parse(item));
      } catch (validationError) {
        console.error('Erro de validação nas assinaturas:', validationError);
        return data as AdminUserSubscription[];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obter assinaturas de um usuário específico
 */
export function useUserSubscriptionsAdmin(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.userSubscriptions(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          profiles(
            id,
            nome_completo,
            email,
            cpf,
            telefone
          ),
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar assinaturas do usuário:', error);
        throw new Error(`Erro ao carregar assinaturas: ${error.message}`);
      }

      return data.map(item => AdminUserSubscriptionSchema.parse(item));
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para obter estatísticas de assinaturas
 */
export function useUserSubscriptionsStats() {
  return useQuery({
    queryKey: QUERY_KEYS.subscriptionStats,
    queryFn: async () => {
      // Buscar todas as assinaturas com informações dos planos
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select(`
          status,
          created_at,
          expires_at,
          subscription_plans(
            name,
            price,
            recurrence
          )
        `);

      if (error) {
        throw new Error(`Erro ao carregar estatísticas: ${error.message}`);
      }

      const now = new Date();
      const stats = {
        total: subscriptions.length,
        active: 0,
        expired: 0,
        cancelled: 0,
        pending: 0,
        expiringSoon: 0, // Expirando nos próximos 30 dias
        totalRevenue: 0,
        monthlyRevenue: 0,
        byPlan: {} as Record<string, { count: number; revenue: number }>,
        byStatus: {} as Record<string, number>,
        recentSubscriptions: 0, // Últimos 30 dias
      };

      subscriptions.forEach(sub => {
        const status = sub.status;
        const planName = sub.subscription_plans?.plan_title || 'Desconhecido';
        const planPrice = sub.subscription_plans?.price || 0;
        const createdAt = new Date(sub.created_at);
        const expiresAt = sub.expires_at ? new Date(sub.expires_at) : null;

        // Contadores por status
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
        
        switch (status) {
          case 'active':
            stats.active++;
            stats.totalRevenue += planPrice;
            
            // Receita mensal (aproximada)
            if (sub.subscription_plans?.recurrence === 'monthly') {
              stats.monthlyRevenue += planPrice;
            } else if (sub.subscription_plans?.recurrence === 'annual') {
              stats.monthlyRevenue += planPrice / 12;
            } else if (sub.subscription_plans?.recurrence === 'semestral') {
              stats.monthlyRevenue += planPrice / 6;
            }

            // Verificar se expira em breve
            if (expiresAt) {
              const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
                stats.expiringSoon++;
              }
            }
            break;
          case 'expired':
            stats.expired++;
            break;
          case 'cancelled':
            stats.cancelled++;
            break;
          case 'pending':
            stats.pending++;
            break;
        }

        // Estatísticas por plano
        if (!stats.byPlan[planName]) {
          stats.byPlan[planName] = { count: 0, revenue: 0 };
        }
        stats.byPlan[planName].count++;
        if (status === 'active') {
          stats.byPlan[planName].revenue += planPrice;
        }

        // Assinaturas recentes (últimos 30 dias)
        const daysSinceCreation = Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceCreation <= 30) {
          stats.recentSubscriptions++;
        }
      });

      return stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para criar uma nova assinatura de usuário (admin)
 */
export function useCreateUserSubscriptionAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserSubscriptionData) => {
      // Validar dados de entrada
      const validatedData = CreateUserSubscriptionSchema.parse(data);

      const subscriptionData = {
        ...validatedData,
        started_at: new Date().toISOString(),
      };

      const { data: result, error } = await supabase
        .from('user_subscriptions')
        .insert([subscriptionData])
        .select(`
          *,
          profiles(
            id,
            nome_completo,
            email,
            cpf,
            telefone
          ),
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
        if (error.code === '23505') {
          throw new Error('Usuário já possui uma assinatura ativa para este plano');
        }
        if (error.code === '23503') {
          throw new Error('Plano de assinatura ou tipo de membro não encontrado');
        }
        throw new Error(`Erro ao criar assinatura: ${error.message}`);
      }

      return AdminUserSubscriptionSchema.parse(result);
    },
    onSuccess: (data) => {
      // Invalidar caches relevantes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allUserSubscriptions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSubscriptions(data.user_id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionStats });
      
      toast.success('Assinatura criada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao criar assinatura:', error);
      toast.error(error.message);
    },
  });
}

/**
 * Hook para atualizar uma assinatura existente
 */
export function useUpdateUserSubscriptionAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      status?: 'active' | 'expired' | 'cancelled' | 'pending';
      expires_at?: string | null;
      payment_id?: string | null;
    }) => {
      const { id, ...updateData } = data;

      const { data: result, error } = await supabase
        .from('user_subscriptions')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          profiles(
            id,
            nome_completo,
            email,
            cpf,
            telefone
          ),
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
        if (error.code === 'PGRST116') {
          throw new Error('Assinatura não encontrada');
        }
        throw new Error(`Erro ao atualizar assinatura: ${error.message}`);
      }

      return AdminUserSubscriptionSchema.parse(result);
    },
    onSuccess: (data) => {
      // Invalidar caches relevantes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allUserSubscriptions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSubscriptions(data.user_id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionStats });
      
      toast.success('Assinatura atualizada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar assinatura:', error);
      toast.error(error.message);
    },
  });
}

/**
 * Hook para cancelar uma assinatura
 */
export function useCancelUserSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data: result, error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select(`
          *,
          profiles(
            id,
            nome_completo,
            email
          ),
          subscription_plans(
            name
          )
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Assinatura não encontrada');
        }
        throw new Error(`Erro ao cancelar assinatura: ${error.message}`);
      }

      return result;
    },
    onSuccess: (data) => {
      // Invalidar caches relevantes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allUserSubscriptions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSubscriptions(data.user_id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionStats });
      
      toast.success('Assinatura cancelada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao cancelar assinatura:', error);
      toast.error(error.message);
    },
  });
}

/**
 * Hook para reativar uma assinatura
 */
export function useReactivateUserSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { subscriptionId: string; expiresAt?: string }) => {
      const { data: result, error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          expires_at: data.expiresAt || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.subscriptionId)
        .select(`
          *,
          profiles(
            id,
            nome_completo,
            email
          ),
          subscription_plans(
            name
          )
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Assinatura não encontrada');
        }
        throw new Error(`Erro ao reativar assinatura: ${error.message}`);
      }

      return result;
    },
    onSuccess: (data) => {
      // Invalidar caches relevantes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allUserSubscriptions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSubscriptions(data.user_id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionStats });
      
      toast.success('Assinatura reativada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao reativar assinatura:', error);
      toast.error(error.message);
    },
  });
}

/**
 * Hook para excluir uma assinatura permanentemente
 */
export function useDeleteUserSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Assinatura não encontrada');
        }
        throw new Error(`Erro ao excluir assinatura: ${error.message}`);
      }

      return subscriptionId;
    },
    onSuccess: () => {
      // Invalidar todos os caches relacionados
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allUserSubscriptions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionStats });
      
      toast.success('Assinatura excluída permanentemente!');
    },
    onError: (error: Error) => {
      console.error('Erro ao excluir assinatura:', error);
      toast.error(error.message);
    },
  });
}

/**
 * Hook para buscar assinaturas que estão expirando em breve
 */
export function useExpiringSubscriptions(daysAhead: number = 30) {
  return useQuery({
    queryKey: ['expiring-subscriptions', daysAhead],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          profiles(
            id,
            nome_completo,
            email,
            telefone
          ),
          subscription_plans(
            name,
            price,
            recurrence
          )
        `)
        .eq('status', 'active')
        .not('expires_at', 'is', null)
        .lte('expires_at', futureDate.toISOString())
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true });

      if (error) {
        throw new Error(`Erro ao buscar assinaturas expirando: ${error.message}`);
      }

      return data.map(item => AdminUserSubscriptionSchema.parse(item));
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}