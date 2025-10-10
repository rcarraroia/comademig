import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSplitConfiguration } from './useSplitConfiguration';

/**
 * Hook para gerenciamento avançado de splits (Super Admin)
 * Complementa o useSplitConfiguration com funcionalidades de histórico e relatórios
 */
export function useSplitManagement() {
  // Reutilizar funcionalidades do useSplitConfiguration
  const splitConfig = useSplitConfiguration();

  // Buscar histórico de splits processados
  const useSplitHistory = (filters?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    status?: string;
    limit?: number;
  }) => {
    return useQuery({
      queryKey: ['split-history', filters],
      queryFn: async () => {
        let query = supabase
          .from('asaas_splits')
          .select(`
            *,
            cobranca:asaas_cobrancas!cobranca_id(
              id,
              asaas_id,
              descricao,
              valor,
              status,
              data_vencimento
            )
          `)
          .order('created_at', { ascending: false });

        // Aplicar filtros
        if (filters?.startDate) {
          query = query.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('created_at', filters.endDate);
        }
        if (filters?.category) {
          query = query.eq('service_type', filters.category);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching split history:', error);
          throw new Error('Erro ao buscar histórico de splits');
        }

        return data || [];
      },
    });
  };

  // Buscar relatórios agregados por beneficiário
  const useSplitReports = (filters?: {
    startDate?: string;
    endDate?: string;
  }) => {
    return useQuery({
      queryKey: ['split-reports', filters],
      queryFn: async () => {
        let query = supabase
          .from('asaas_splits')
          .select('recipient_type, recipient_name, service_type, commission_amount, status, created_at');

        // Aplicar filtros de data
        if (filters?.startDate) {
          query = query.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('created_at', filters.endDate);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching split reports:', error);
          throw new Error('Erro ao buscar relatórios de splits');
        }

        // Agregar dados por beneficiário
        const reportsByRecipient: Record<string, {
          recipientType: string;
          recipientName: string;
          totalAmount: number;
          totalProcessed: number;
          totalPending: number;
          totalError: number;
          totalCancelled: number;
          count: number;
          byCategory: Record<string, number>;
        }> = {};

        data?.forEach((split) => {
          const key = split.recipient_type || 'unknown';
          
          if (!reportsByRecipient[key]) {
            reportsByRecipient[key] = {
              recipientType: split.recipient_type || 'unknown',
              recipientName: split.recipient_name || 'Desconhecido',
              totalAmount: 0,
              totalProcessed: 0,
              totalPending: 0,
              totalError: 0,
              totalCancelled: 0,
              count: 0,
              byCategory: {},
            };
          }

          const amount = split.commission_amount || 0;
          reportsByRecipient[key].totalAmount += amount;
          reportsByRecipient[key].count += 1;

          // Agregar por status
          if (split.status === 'PROCESSED') {
            reportsByRecipient[key].totalProcessed += amount;
          } else if (split.status === 'PENDING') {
            reportsByRecipient[key].totalPending += amount;
          } else if (split.status === 'ERROR') {
            reportsByRecipient[key].totalError += amount;
          } else if (split.status === 'CANCELLED') {
            reportsByRecipient[key].totalCancelled += amount;
          }

          // Agregar por categoria
          const category = split.service_type || 'outros';
          if (!reportsByRecipient[key].byCategory[category]) {
            reportsByRecipient[key].byCategory[category] = 0;
          }
          reportsByRecipient[key].byCategory[category] += amount;
        });

        return {
          byRecipient: Object.values(reportsByRecipient),
          summary: {
            totalAmount: Object.values(reportsByRecipient).reduce((sum, r) => sum + r.totalAmount, 0),
            totalProcessed: Object.values(reportsByRecipient).reduce((sum, r) => sum + r.totalProcessed, 0),
            totalPending: Object.values(reportsByRecipient).reduce((sum, r) => sum + r.totalPending, 0),
            totalError: Object.values(reportsByRecipient).reduce((sum, r) => sum + r.totalError, 0),
            totalCancelled: Object.values(reportsByRecipient).reduce((sum, r) => sum + r.totalCancelled, 0),
            totalCount: data?.length || 0,
          },
        };
      },
    });
  };

  // Buscar estatísticas gerais
  const useSplitStats = () => {
    return useQuery({
      queryKey: ['split-stats-general'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('asaas_splits')
          .select('status, commission_amount, service_type, recipient_type');

        if (error) {
          console.error('Error fetching split stats:', error);
          throw new Error('Erro ao buscar estatísticas');
        }

        const stats = {
          total: data?.length || 0,
          totalAmount: 0,
          byStatus: {
            PENDING: { count: 0, amount: 0 },
            PROCESSED: { count: 0, amount: 0 },
            ERROR: { count: 0, amount: 0 },
            CANCELLED: { count: 0, amount: 0 },
          },
          byCategory: {} as Record<string, { count: number; amount: number }>,
          byRecipient: {} as Record<string, { count: number; amount: number }>,
        };

        data?.forEach((split) => {
          const amount = split.commission_amount || 0;
          stats.totalAmount += amount;

          // Por status
          const status = split.status as keyof typeof stats.byStatus;
          if (stats.byStatus[status]) {
            stats.byStatus[status].count += 1;
            stats.byStatus[status].amount += amount;
          }

          // Por categoria
          const category = split.service_type || 'outros';
          if (!stats.byCategory[category]) {
            stats.byCategory[category] = { count: 0, amount: 0 };
          }
          stats.byCategory[category].count += 1;
          stats.byCategory[category].amount += amount;

          // Por beneficiário
          const recipient = split.recipient_type || 'unknown';
          if (!stats.byRecipient[recipient]) {
            stats.byRecipient[recipient] = { count: 0, amount: 0 };
          }
          stats.byRecipient[recipient].count += 1;
          stats.byRecipient[recipient].amount += amount;
        });

        return stats;
      },
    });
  };

  // Buscar splits com erro para reprocessamento
  const useSplitsWithError = () => {
    return useQuery({
      queryKey: ['splits-with-error'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('asaas_splits')
          .select('*')
          .eq('status', 'ERROR')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching splits with error:', error);
          throw new Error('Erro ao buscar splits com erro');
        }

        return data || [];
      },
    });
  };

  // Buscar log de auditoria de alterações de configuração
  const useConfigurationAuditLog = (filters?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    limit?: number;
  }) => {
    return useQuery({
      queryKey: ['split-config-audit-log', filters],
      queryFn: async () => {
        let query = supabase
          .from('audit_logs')
          .select('*')
          .in('table_name', ['split_configurations', 'split_recipients'])
          .order('created_at', { ascending: false });

        // Aplicar filtros
        if (filters?.startDate) {
          query = query.gte('created_at', filters.startDate);
        }
        if (filters?.endDate) {
          query = query.lte('created_at', filters.endDate);
        }
        if (filters?.userId) {
          query = query.eq('user_id', filters.userId);
        }
        if (filters?.limit) {
          query = query.limit(filters.limit);
        } else {
          query = query.limit(100);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching audit log:', error);
          throw new Error('Erro ao buscar log de auditoria');
        }

        return data || [];
      },
    });
  };

  return {
    // Reutilizar funcionalidades de configuração
    ...splitConfig,

    // Funcionalidades de histórico e relatórios
    useSplitHistory,
    useSplitReports,
    useSplitStats,
    useSplitsWithError,
    useConfigurationAuditLog,
  };
}
