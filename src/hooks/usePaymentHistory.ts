import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfDay, endOfDay, subMonths, subDays } from 'date-fns';

interface PaymentHistoryFilters {
  period: 'all' | 'last_month' | 'last_3_months' | 'last_year' | 'custom';
  status: 'all' | 'CONFIRMED' | 'RECEIVED' | 'PENDING' | 'OVERDUE' | 'CANCELLED';
  paymentMethod: 'all' | 'PIX' | 'CREDIT_CARD' | 'BOLETO';
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

interface PaymentHistoryItem {
  id: string;
  asaas_id: string;
  user_id: string;
  value: number;
  status: string;
  payment_method: string;
  description: string;
  service_type: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  invoice_url?: string;
  bank_slip_url?: string;
  pix_qr_code?: string;
}

const DEFAULT_FILTERS: PaymentHistoryFilters = {
  period: 'last_3_months',
  status: 'all',
  paymentMethod: 'all',
  searchTerm: '',
};

export function usePaymentHistory(userId?: string) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<PaymentHistoryFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calcular datas baseadas no período selecionado
  const dateRange = useMemo(() => {
    const now = new Date();
    
    switch (filters.period) {
      case 'last_month':
        return {
          start: startOfDay(subMonths(now, 1)),
          end: endOfDay(now)
        };
      case 'last_3_months':
        return {
          start: startOfDay(subMonths(now, 3)),
          end: endOfDay(now)
        };
      case 'last_year':
        return {
          start: startOfDay(subMonths(now, 12)),
          end: endOfDay(now)
        };
      case 'custom':
        return {
          start: filters.startDate ? startOfDay(filters.startDate) : startOfDay(subMonths(now, 3)),
          end: filters.endDate ? endOfDay(filters.endDate) : endOfDay(now)
        };
      default: // 'all'
        return {
          start: startOfDay(subMonths(now, 24)), // Últimos 2 anos por performance
          end: endOfDay(now)
        };
    }
  }, [filters.period, filters.startDate, filters.endDate]);

  // Buscar pagamentos com filtros
  const paymentsQuery = useQuery({
    queryKey: ['payment-history', userId || user?.id, filters, dateRange],
    queryFn: async () => {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return { data: [], count: 0 };

      let query = supabase
        .from('asaas_cobrancas')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `, { count: 'exact' })
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: false });

      // Filtrar por usuário se especificado
      if (userId) {
        query = query.eq('user_id', userId);
      }

      // Filtrar por status
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Filtrar por método de pagamento
      if (filters.paymentMethod !== 'all') {
        query = query.eq('payment_method', filters.paymentMethod);
      }

      // Filtrar por termo de busca
      if (filters.searchTerm && filters.searchTerm.trim()) {
        query = query.or(`description.ilike.%${filters.searchTerm}%,asaas_id.ilike.%${filters.searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar histórico de pagamentos:', error);
        throw error;
      }

      // Transformar dados para o formato esperado
      const transformedData: PaymentHistoryItem[] = (data || []).map(payment => ({
        id: payment.id,
        asaas_id: payment.asaas_id,
        user_id: payment.user_id,
        value: payment.value,
        status: payment.status,
        payment_method: payment.payment_method,
        description: payment.description,
        service_type: payment.service_type,
        due_date: payment.due_date,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        user_name: payment.profiles?.full_name,
        user_email: payment.profiles?.email,
        invoice_url: payment.invoice_url,
        bank_slip_url: payment.bank_slip_url,
        pix_qr_code: payment.pix_qr_code,
      }));

      return {
        data: transformedData,
        count: count || 0
      };
    },
    enabled: !!(userId || user?.id),
  });

  // Paginação dos dados
  const paginatedData = useMemo(() => {
    const data = paymentsQuery.data?.data || [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      items: data.slice(startIndex, endIndex),
      totalItems: data.length,
      totalPages: Math.ceil(data.length / itemsPerPage),
      currentPage,
      itemsPerPage,
      hasNextPage: endIndex < data.length,
      hasPreviousPage: currentPage > 1,
    };
  }, [paymentsQuery.data?.data, currentPage, itemsPerPage]);

  // Estatísticas dos filtros aplicados
  const filteredStats = useMemo(() => {
    const data = paymentsQuery.data?.data || [];
    
    const totalValue = data.reduce((sum, payment) => sum + payment.value, 0);
    const confirmedValue = data
      .filter(p => ['CONFIRMED', 'RECEIVED'].includes(p.status))
      .reduce((sum, payment) => sum + payment.value, 0);
    const pendingValue = data
      .filter(p => ['PENDING', 'OVERDUE'].includes(p.status))
      .reduce((sum, payment) => sum + payment.value, 0);

    const byMethod = data.reduce((acc, payment) => {
      acc[payment.payment_method] = (acc[payment.payment_method] || 0) + payment.value;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = data.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalValue,
      confirmedValue,
      pendingValue,
      totalCount: data.length,
      byMethod,
      byStatus,
    };
  }, [paymentsQuery.data?.data]);

  // Funções de controle
  const updateFilters = (newFilters: Partial<PaymentHistoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset para primeira página
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, paginatedData.totalPages)));
  };

  const nextPage = () => {
    if (paginatedData.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const previousPage = () => {
    if (paginatedData.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return {
    // Dados
    payments: paginatedData.items,
    pagination: paginatedData,
    stats: filteredStats,
    
    // Estados
    filters,
    isLoading: paymentsQuery.isLoading,
    error: paymentsQuery.error,
    
    // Ações
    updateFilters,
    resetFilters,
    goToPage,
    nextPage,
    previousPage,
    
    // Utilitários
    refetch: paymentsQuery.refetch,
  };
}