import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthState } from '@/hooks/useAuthState';
import { z } from 'zod';
import { toast } from 'sonner';

// Schema para validação de permissões
const UserPermissionsSchema = z.record(z.boolean());

export type UserPermissions = z.infer<typeof UserPermissionsSchema>;

// Schema para assinatura do usuário
const UserSubscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  subscription_plan_id: z.string().uuid(),
  member_type_id: z.string().uuid(),
  status: z.enum(['active', 'expired', 'cancelled', 'pending']),
  started_at: z.string(),
  expires_at: z.string().nullable(),
  subscription_plans: z.object({
    id: z.string().uuid(),
    name: z.string(),
    permissions: z.record(z.boolean()),
    price: z.number(),
    recurrence: z.enum(['monthly', 'semestral', 'annual']),
  }).optional(),
  member_types: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).optional(),
});

export type UserSubscription = z.infer<typeof UserSubscriptionSchema>;

// Query keys for cache management
const QUERY_KEYS = {
  userPermissions: (userId: string) => ['user-permissions', userId] as const,
  userSubscriptions: (userId: string) => ['user-subscriptions', userId] as const,
  allUserSubscriptions: ['user-subscriptions'] as const,
} as const;

/**
 * Hook para obter permissões do usuário atual baseadas em suas assinaturas ativas
 */
export function useUserPermissions() {
  const { user } = useAuthState();

  return useQuery({
    queryKey: QUERY_KEYS.userPermissions(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) {
        return {};
      }

      // Buscar assinaturas ativas do usuário
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(
            id,
            name,
            permissions,
            price,
            recurrence
          ),
          member_types(
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .or('expires_at.is.null,expires_at.gt.now()'); // Não expiradas

      if (error) {
        console.error('Erro ao buscar permissões do usuário:', error);
        // Em caso de erro, retornar permissões vazias ao invés de falhar
        return {};
      }

      if (!subscriptions || subscriptions.length === 0) {
        // Usuário sem assinaturas ativas - permissões básicas apenas
        return {
          basic_access: true
        };
      }

      // Combinar permissões de todas as assinaturas ativas
      const combinedPermissions: UserPermissions = {
        basic_access: true // Todos os usuários têm acesso básico
      };

      subscriptions.forEach((subscription: any) => {
        const planPermissions = subscription.subscription_plans?.permissions || {};
        
        // Mesclar permissões (OR lógico - se qualquer plano permite, usuário tem a permissão)
        Object.entries(planPermissions).forEach(([permission, allowed]) => {
          if (allowed === true) {
            combinedPermissions[permission] = true;
          }
        });
      });

      return UserPermissionsSchema.parse(combinedPermissions);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para verificar se o usuário tem uma permissão específica
 */
export function useHasPermission(permission: string) {
  const { data: permissions, isLoading } = useUserPermissions();

  const hasPermission = permissions?.[permission] === true;

  return {
    hasPermission,
    isLoading,
    permissions
  };
}

/**
 * Hook para verificar múltiplas permissões
 */
export function useHasPermissions(requiredPermissions: string[]) {
  const { data: permissions, isLoading } = useUserPermissions();

  const hasAllPermissions = requiredPermissions.every(
    permission => permissions?.[permission] === true
  );

  const hasAnyPermission = requiredPermissions.some(
    permission => permissions?.[permission] === true
  );

  const missingPermissions = requiredPermissions.filter(
    permission => permissions?.[permission] !== true
  );

  return {
    hasAllPermissions,
    hasAnyPermission,
    missingPermissions,
    isLoading,
    permissions
  };
}

/**
 * Hook para obter assinaturas ativas do usuário atual
 */
export function useUserSubscriptions() {
  const { user } = useAuthState();

  return useQuery({
    queryKey: QUERY_KEYS.userSubscriptions(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(
            id,
            name,
            permissions,
            price,
            recurrence
          ),
          member_types(
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar assinaturas do usuário:', error);
        throw new Error(`Erro ao carregar assinaturas: ${error.message}`);
      }

      // Validar e retornar dados
      try {
        return data.map(item => UserSubscriptionSchema.parse(item));
      } catch (validationError) {
        console.error('Erro de validação nas assinaturas:', validationError);
        return data as UserSubscription[];
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para criar uma nova assinatura de usuário
 */
export function useCreateUserSubscription() {
  const queryClient = useQueryClient();
  const { user } = useAuthState();

  return useMutation({
    mutationFn: async (data: {
      subscription_plan_id: string;
      member_type_id: string;
      payment_id?: string;
      expires_at?: string;
    }) => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const subscriptionData = {
        user_id: user.id,
        subscription_plan_id: data.subscription_plan_id,
        member_type_id: data.member_type_id,
        payment_id: data.payment_id,
        status: 'active' as const,
        started_at: new Date().toISOString(),
        expires_at: data.expires_at || null,
      };

      const { data: result, error } = await supabase
        .from('user_subscriptions')
        .insert([subscriptionData])
        .select(`
          *,
          subscription_plans(
            id,
            name,
            permissions,
            price,
            recurrence
          ),
          member_types(
            id,
            name
          )
        `)
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Usuário já possui uma assinatura ativa para este plano');
        }
        throw new Error(`Erro ao criar assinatura: ${error.message}`);
      }

      return UserSubscriptionSchema.parse(result);
    },
    onSuccess: (data) => {
      // Invalidar cache de permissões e assinaturas
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userPermissions(user.id) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSubscriptions(user.id) });
      }
      
      toast.success('Assinatura criada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao criar assinatura:', error);
      toast.error(error.message);
    },
  });
}

/**
 * Hook para atualizar status de uma assinatura
 */
export function useUpdateUserSubscriptionStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuthState();

  return useMutation({
    mutationFn: async (data: {
      subscription_id: string;
      status: 'active' | 'expired' | 'cancelled' | 'pending';
      expires_at?: string | null;
    }) => {
      const { data: result, error } = await supabase
        .from('user_subscriptions')
        .update({
          status: data.status,
          expires_at: data.expires_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.subscription_id)
        .select(`
          *,
          subscription_plans(
            id,
            name,
            permissions,
            price,
            recurrence
          ),
          member_types(
            id,
            name
          )
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Assinatura não encontrada');
        }
        throw new Error(`Erro ao atualizar assinatura: ${error.message}`);
      }

      return UserSubscriptionSchema.parse(result);
    },
    onSuccess: (data) => {
      // Invalidar cache de permissões e assinaturas
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userPermissions(user.id) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSubscriptions(user.id) });
      }
      
      const statusMap = {
        active: 'ativada',
        expired: 'expirada',
        cancelled: 'cancelada',
        pending: 'pendente'
      };
      
      toast.success(`Assinatura ${statusMap[data.status]} com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar assinatura:', error);
      toast.error(error.message);
    },
  });
}

/**
 * Hook para verificar se o usuário é admin ou tem permissões administrativas
 */
export function useIsAdmin() {
  const { user } = useAuthState();
  const { data: permissions, isLoading } = useUserPermissions();

  // Verificar se é admin por role ou por permissões de assinatura
  const isAdminByRole = user?.user_metadata?.tipo_membro === 'admin';
  const isAdminByPermission = permissions?.admin_access === true || 
                              permissions?.manage_users === true;

  const isAdmin = isAdminByRole || isAdminByPermission;

  return {
    isAdmin,
    isAdminByRole,
    isAdminByPermission,
    isLoading
  };
}

/**
 * Hook para obter estatísticas de assinaturas (para admins)
 */
export function useSubscriptionStats() {
  const { isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select(`
          status,
          subscription_plans(name, price),
          created_at
        `);

      if (error) {
        throw new Error(`Erro ao carregar estatísticas: ${error.message}`);
      }

      const stats = {
        total: subscriptions.length,
        active: subscriptions.filter(s => s.status === 'active').length,
        expired: subscriptions.filter(s => s.status === 'expired').length,
        cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
        pending: subscriptions.filter(s => s.status === 'pending').length,
        totalRevenue: subscriptions
          .filter(s => s.status === 'active')
          .reduce((sum, s) => sum + (s.subscription_plans?.price || 0), 0),
        byPlan: {} as Record<string, number>
      };

      // Agrupar por plano
      subscriptions.forEach(sub => {
        const planName = sub.subscription_plans?.plan_title || 'Desconhecido';
        stats.byPlan[planName] = (stats.byPlan[planName] || 0) + 1;
      });

      return stats;
    },
    enabled: isAdmin,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Utilitário para verificar permissões de forma síncrona (para uso em componentes)
 */
export const checkPermission = (permissions: UserPermissions | undefined, permission: string): boolean => {
  return permissions?.[permission] === true;
};

/**
 * Utilitário para verificar múltiplas permissões de forma síncrona
 */
export const checkPermissions = (
  permissions: UserPermissions | undefined, 
  requiredPermissions: string[],
  requireAll: boolean = true
): boolean => {
  if (!permissions) return false;
  
  if (requireAll) {
    return requiredPermissions.every(permission => permissions[permission] === true);
  } else {
    return requiredPermissions.some(permission => permissions[permission] === true);
  }
};