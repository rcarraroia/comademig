import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserActivityLog {
  id: string;
  user_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  // Relacionamentos
  user?: {
    id: string;
    nome_completo: string;
    cargo?: string;
  };
}

export interface AuditFilters {
  user_id?: string;
  table_name?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface AuditStats {
  total_activities: number;
  activities_today: number;
  activities_this_week: number;
  activities_this_month: number;
  most_active_users: Array<{
    user_id: string;
    user_name: string;
    activity_count: number;
  }>;
  most_modified_tables: Array<{
    table_name: string;
    modification_count: number;
  }>;
  action_distribution: Array<{
    action: string;
    count: number;
  }>;
}

// Hook para buscar logs de auditoria com filtros
export function useAuditLogs(filters: AuditFilters = {}, options?: {
  limit?: number;
  offset?: number;
}) {
  const { limit = 50, offset = 0 } = options || {};

  return useQuery({
    queryKey: ['audit-logs', filters, { limit, offset }],
    queryFn: async () => {
      let query = supabase
        .from('user_activity_log')
        .select(`
          *,
          user:profiles(id, nome_completo, cargo)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Aplicar filtros
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Busca por texto (em record_id ou valores)
      if (filters.search) {
        // Para busca em JSONB, precisamos usar uma abordagem diferente
        // Por enquanto, vamos buscar apenas no record_id
        query = query.ilike('record_id', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar logs de auditoria:', error);
        throw error;
      }

      return data as UserActivityLog[];
    },
  });
}

// Hook para buscar estatísticas de auditoria
export function useAuditStats(dateRange?: { from: string; to: string }) {
  return useQuery({
    queryKey: ['audit-stats', dateRange],
    queryFn: async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Query base
      let baseQuery = supabase.from('user_activity_log');

      // Aplicar filtro de data se fornecido
      if (dateRange) {
        baseQuery = baseQuery
          .gte('created_at', dateRange.from)
          .lte('created_at', dateRange.to);
      }

      // Total de atividades
      const { count: totalActivities } = await baseQuery
        .select('*', { count: 'exact', head: true });

      // Atividades hoje
      const { count: activitiesToday } = await supabase
        .from('user_activity_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Atividades esta semana
      const { count: activitiesThisWeek } = await supabase
        .from('user_activity_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisWeek.toISOString());

      // Atividades este mês
      const { count: activitiesThisMonth } = await supabase
        .from('user_activity_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonth.toISOString());

      // Usuários mais ativos
      const { data: userActivities } = await supabase
        .from('user_activity_log')
        .select(`
          user_id,
          user:profiles(nome_completo)
        `)
        .not('user_id', 'is', null);

      // Processar usuários mais ativos
      const userActivityMap = new Map();
      userActivities?.forEach((activity: any) => {
        const userId = activity.user_id;
        const userName = activity.user?.nome_completo || 'Usuário desconhecido';
        
        if (userActivityMap.has(userId)) {
          userActivityMap.set(userId, {
            ...userActivityMap.get(userId),
            activity_count: userActivityMap.get(userId).activity_count + 1
          });
        } else {
          userActivityMap.set(userId, {
            user_id: userId,
            user_name: userName,
            activity_count: 1
          });
        }
      });

      const mostActiveUsers = Array.from(userActivityMap.values())
        .sort((a, b) => b.activity_count - a.activity_count)
        .slice(0, 10);

      // Tabelas mais modificadas
      const { data: tableActivities } = await supabase
        .from('user_activity_log')
        .select('table_name');

      const tableActivityMap = new Map();
      tableActivities?.forEach((activity) => {
        const tableName = activity.table_name;
        if (tableName) {
          tableActivityMap.set(tableName, (tableActivityMap.get(tableName) || 0) + 1);
        }
      });

      const mostModifiedTables = Array.from(tableActivityMap.entries())
        .map(([table_name, modification_count]) => ({ table_name, modification_count }))
        .sort((a, b) => b.modification_count - a.modification_count)
        .slice(0, 10);

      // Distribuição por ação
      const { data: actionActivities } = await supabase
        .from('user_activity_log')
        .select('action');

      const actionMap = new Map();
      actionActivities?.forEach((activity) => {
        const action = activity.action;
        actionMap.set(action, (actionMap.get(action) || 0) + 1);
      });

      const actionDistribution = Array.from(actionMap.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count);

      const stats: AuditStats = {
        total_activities: totalActivities || 0,
        activities_today: activitiesToday || 0,
        activities_this_week: activitiesThisWeek || 0,
        activities_this_month: activitiesThisMonth || 0,
        most_active_users: mostActiveUsers,
        most_modified_tables: mostModifiedTables,
        action_distribution: actionDistribution,
      };

      return stats;
    },
  });
}

// Hook para buscar atividades de um usuário específico
export function useUserActivityTimeline(userId: string, limit = 20) {
  return useQuery({
    queryKey: ['user-activity-timeline', userId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao buscar timeline do usuário:', error);
        throw error;
      }

      return data as UserActivityLog[];
    },
    enabled: !!userId,
  });
}

// Hook para buscar atividades de uma tabela específica
export function useTableActivityHistory(tableName: string, recordId?: string, limit = 20) {
  return useQuery({
    queryKey: ['table-activity-history', tableName, recordId, limit],
    queryFn: async () => {
      let query = supabase
        .from('user_activity_log')
        .select(`
          *,
          user:profiles(id, nome_completo, cargo)
        `)
        .eq('table_name', tableName)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (recordId) {
        query = query.eq('record_id', recordId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar histórico da tabela:', error);
        throw error;
      }

      return data as UserActivityLog[];
    },
    enabled: !!tableName,
  });
}

// Hook para criar log manual (para ações especiais)
export function useCreateAuditLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      action: string;
      table_name: string;
      record_id: string;
      description?: string;
      metadata?: Record<string, any>;
    }) => {
      const { data: result, error } = await supabase
        .from('user_activity_log')
        .insert({
          action: data.action,
          table_name: data.table_name,
          record_id: data.record_id,
          new_values: {
            description: data.description,
            metadata: data.metadata,
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar log de auditoria:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['audit-stats'] });
    },
    onError: (error: any) => {
      console.error('Erro ao criar log:', error);
      toast.error('Erro ao registrar atividade: ' + error.message);
    },
  });
}

// Utilitários para formatação
export const formatAction = (action: string) => {
  switch (action) {
    case 'INSERT':
      return 'Criação';
    case 'UPDATE':
      return 'Atualização';
    case 'DELETE':
      return 'Exclusão';
    default:
      return action;
  }
};

export const getActionColor = (action: string) => {
  switch (action) {
    case 'INSERT':
      return 'bg-green-100 text-green-800';
    case 'UPDATE':
      return 'bg-blue-100 text-blue-800';
    case 'DELETE':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const formatTableName = (tableName: string) => {
  const tableNames: Record<string, string> = {
    'profiles': 'Perfis de Usuário',
    'member_types': 'Tipos de Membro',
    'subscription_plans': 'Planos de Assinatura',
    'user_subscriptions': 'Assinaturas de Usuário',
    'support_tickets': 'Tickets de Suporte',
    'support_messages': 'Mensagens de Suporte',
    'financial_transactions': 'Transações Financeiras',
    'certidoes': 'Certidões',
    'asaas_cobrancas': 'Cobranças Asaas',
  };

  return tableNames[tableName] || tableName;
};

export const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

  if (diffInSeconds < 60) {
    return 'Agora mesmo';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min atrás`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h atrás`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} dias atrás`;
  }
};