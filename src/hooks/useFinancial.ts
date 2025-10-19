import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FinancialTransaction {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  payment_method?: 'pix' | 'credit_card' | 'boleto' | 'debit_card';
  asaas_payment_id?: string;
  asaas_invoice_url?: string;
  asaas_transaction_receipt_url?: string;
  description?: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  user?: {
    id: string;
    nome_completo: string;
    cargo?: string;
  };
  subscription?: {
    id: string;
    member_type_id: string;
    subscription_plan?: {
      name: string;
      duration_months: number;
    };
  };
}

export interface FinancialMetrics {
  total_revenue: number;
  monthly_revenue: number;
  annual_revenue: number;
  pending_payments: number;
  overdue_payments: number;
  paid_today: number;
  revenue_by_member_type: Array<{
    member_type: string;
    revenue: number;
    count: number;
  }>;
  revenue_by_month: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
  payment_methods: Array<{
    method: string;
    count: number;
    revenue: number;
  }>;
  status_distribution: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
}

export interface FinancialFilters {
  status?: string;
  payment_method?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
}

// Hook para buscar transações financeiras
export function useFinancialTransactions(filters: FinancialFilters = {}, options?: {
  limit?: number;
  offset?: number;
}) {
  const { limit = 50, offset = 0 } = options || {};

  return useQuery({
    queryKey: ['financial-transactions', filters, { limit, offset }],
    queryFn: async () => {
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          user:profiles!financial_transactions_user_id_fkey(id, nome_completo, cargo),
          subscription:user_subscriptions(
            id,
            member_type_id,
            subscription_plan:subscription_plans(name, duration_months)
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters.amount_min) {
        query = query.gte('amount', filters.amount_min);
      }

      if (filters.amount_max) {
        query = query.lte('amount', filters.amount_max);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar transações:', error);
        throw error;
      }

      return data as FinancialTransaction[];
    },
  });
}

// Hook para métricas financeiras
export function useFinancialMetrics(dateRange?: { from: string; to: string }) {
  return useQuery({
    queryKey: ['financial-metrics', dateRange],
    queryFn: async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisYear = new Date(now.getFullYear(), 0, 1);

      // CORREÇÃO TEMPORÁRIA: Ler de asaas_cobrancas até refatoração completa
      // TODO: Migrar para financial_transactions após aprovação do cliente
      
      // Receita total
      const { data: allTransactions } = await supabase
        .from('asaas_cobrancas')
        .select('valor, status')
        .eq('status', 'CONFIRMED');

      const totalRevenue = allTransactions?.reduce((sum, t) => sum + parseFloat(t.valor), 0) || 0;

      // Receita mensal
      const { data: monthlyTransactions } = await supabase
        .from('asaas_cobrancas')
        .select('valor')
        .eq('status', 'CONFIRMED')
        .gte('created_at', thisMonth.toISOString());

      const monthlyRevenue = monthlyTransactions?.reduce((sum, t) => sum + parseFloat(t.valor), 0) || 0;

      // Receita anual
      const { data: yearlyTransactions } = await supabase
        .from('asaas_cobrancas')
        .select('valor')
        .eq('status', 'CONFIRMED')
        .gte('created_at', thisYear.toISOString());

      const annualRevenue = yearlyTransactions?.reduce((sum, t) => sum + parseFloat(t.valor), 0) || 0;

      // Pagamentos pendentes
      const { data: pendingTransactions } = await supabase
        .from('asaas_cobrancas')
        .select('valor')
        .eq('status', 'PENDING');

      const pendingPayments = pendingTransactions?.reduce((sum, t) => sum + parseFloat(t.valor), 0) || 0;

      // Pagamentos em atraso (data_vencimento < hoje)
      const { data: overdueTransactions } = await supabase
        .from('asaas_cobrancas')
        .select('valor')
        .in('status', ['PENDING'])
        .lt('data_vencimento', today.toISOString().split('T')[0]);

      const overduePayments = overdueTransactions?.reduce((sum, t) => sum + parseFloat(t.valor), 0) || 0;

      // Pagamentos hoje
      const { data: todayTransactions } = await supabase
        .from('asaas_cobrancas')
        .select('valor')
        .eq('status', 'CONFIRMED')
        .gte('data_pagamento', today.toISOString())
        .lt('data_pagamento', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

      const paidToday = todayTransactions?.reduce((sum, t) => sum + parseFloat(t.valor), 0) || 0;

      // Receita por tipo de serviço (service_type)
      const { data: revenueByType } = await supabase
        .from('asaas_cobrancas')
        .select('valor, service_type')
        .eq('status', 'CONFIRMED');

      const revenueByMemberType = new Map();
      revenueByType?.forEach((transaction: any) => {
        const memberType = transaction.service_type || 'Outros';
        const current = revenueByMemberType.get(memberType) || { revenue: 0, count: 0 };
        revenueByMemberType.set(memberType, {
          revenue: current.revenue + parseFloat(transaction.valor),
          count: current.count + 1
        });
      });

      const revenueByMemberTypeArray = Array.from(revenueByMemberType.entries())
        .map(([member_type, data]) => ({ member_type, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

      // Receita por mês (últimos 12 meses)
      const revenueByMonth = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const { data: monthTransactions } = await supabase
          .from('asaas_cobrancas')
          .select('valor')
          .eq('status', 'CONFIRMED')
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        const monthRevenue = monthTransactions?.reduce((sum, t) => sum + parseFloat(t.valor), 0) || 0;
        
        revenueByMonth.push({
          month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          revenue: monthRevenue,
          transactions: monthTransactions?.length || 0
        });
      }

      // Métodos de pagamento
      const { data: paymentMethodData } = await supabase
        .from('asaas_cobrancas')
        .select('forma_pagamento, valor')
        .eq('status', 'CONFIRMED')
        .not('forma_pagamento', 'is', null);

      const paymentMethods = new Map();
      paymentMethodData?.forEach((transaction) => {
        // Converter forma_pagamento do Asaas para formato padrão
        let method = transaction.forma_pagamento || 'Não informado';
        if (method === 'CREDIT_CARD') method = 'credit_card';
        if (method === 'PIX') method = 'pix';
        if (method === 'BOLETO') method = 'boleto';
        
        const current = paymentMethods.get(method) || { count: 0, revenue: 0 };
        paymentMethods.set(method, {
          count: current.count + 1,
          revenue: current.revenue + parseFloat(transaction.valor)
        });
      });

      const paymentMethodsArray = Array.from(paymentMethods.entries())
        .map(([method, data]) => ({ method, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

      // Distribuição por status
      const { data: statusData } = await supabase
        .from('asaas_cobrancas')
        .select('status, valor');

      const statusDistribution = new Map();
      statusData?.forEach((transaction) => {
        // Converter status do Asaas para formato padrão
        let status = transaction.status;
        if (status === 'CONFIRMED') status = 'paid';
        if (status === 'PENDING') status = 'pending';
        if (status === 'RECEIVED') status = 'paid';
        if (status === 'OVERDUE') status = 'failed';
        
        const current = statusDistribution.get(status) || { count: 0, amount: 0 };
        statusDistribution.set(status, {
          count: current.count + 1,
          amount: current.amount + parseFloat(transaction.valor)
        });
      });

      const statusDistributionArray = Array.from(statusDistribution.entries())
        .map(([status, data]) => ({ status, ...data }))
        .sort((a, b) => b.amount - a.amount);

      const metrics: FinancialMetrics = {
        total_revenue: totalRevenue,
        monthly_revenue: monthlyRevenue,
        annual_revenue: annualRevenue,
        pending_payments: pendingPayments,
        overdue_payments: overduePayments,
        paid_today: paidToday,
        revenue_by_member_type: revenueByMemberTypeArray,
        revenue_by_month: revenueByMonth,
        payment_methods: paymentMethodsArray,
        status_distribution: statusDistributionArray,
      };

      return metrics;
    },
  });
}

// Hook para criar transação
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      user_id: string;
      subscription_id?: string;
      amount: number;
      description?: string;
      due_date?: string;
      payment_method?: string;
    }) => {
      const { data: result, error } = await supabase
        .from('financial_transactions')
        .insert({
          ...data,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar transação:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] });
      toast.success('Transação criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na criação da transação:', error);
      toast.error('Erro ao criar transação: ' + error.message);
    },
  });
}

// Hook para atualizar transação
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      updates: Partial<FinancialTransaction>;
    }) => {
      const { data: result, error } = await supabase
        .from('financial_transactions')
        .update(data.updates)
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar transação:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] });
      toast.success('Transação atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na atualização da transação:', error);
      toast.error('Erro ao atualizar transação: ' + error.message);
    },
  });
}

// Hook para processar pagamento via Asaas
export function useProcessAsaasPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      transaction_id: string;
      asaas_payment_id: string;
      asaas_invoice_url?: string;
      payment_method?: string;
    }) => {
      const updates: any = {
        asaas_payment_id: data.asaas_payment_id,
        status: 'processing',
      };

      if (data.asaas_invoice_url) {
        updates.asaas_invoice_url = data.asaas_invoice_url;
      }

      if (data.payment_method) {
        updates.payment_method = data.payment_method;
      }

      const { data: result, error } = await supabase
        .from('financial_transactions')
        .update(updates)
        .eq('id', data.transaction_id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao processar pagamento:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] });
      toast.success('Pagamento processado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro no processamento do pagamento:', error);
      toast.error('Erro ao processar pagamento: ' + error.message);
    },
  });
}

// Utilitários para formatação
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'refunded':
      return 'bg-purple-100 text-purple-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'paid':
      return 'Pago';
    case 'pending':
      return 'Pendente';
    case 'processing':
      return 'Processando';
    case 'failed':
      return 'Falhou';
    case 'refunded':
      return 'Reembolsado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
};

export const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'pix':
      return 'PIX';
    case 'credit_card':
      return 'Cartão de Crédito';
    case 'boleto':
      return 'Boleto';
    case 'debit_card':
      return 'Cartão de Débito';
    default:
      return method || 'Não informado';
  }
};