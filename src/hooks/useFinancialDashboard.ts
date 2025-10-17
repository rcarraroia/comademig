import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

interface FinancialStats {
  totalRevenue: number
  monthlyRevenue: number
  pendingPayments: number
  confirmedPayments: number
  totalCommissions: number
  pendingCommissions: number
  paidCommissions: number
  paymentsByMethod: {
    pix: number
    card: number
    boleto: number
  }
  revenueByService: {
    filiacao: number
    certidao: number
    regularizacao: number
    evento: number
    taxa_anual: number
  }
}

interface PaymentSummary {
  id: string
  asaas_id: string
  description: string
  value: number
  status: string
  service_type: string
  payment_method: string
  created_at: string
  data_pagamento?: string
  user_name?: string
  user_email?: string
}

interface CommissionSummary {
  id: string
  affiliate_name: string
  affiliate_email: string
  commission_value: number
  payment_value: number
  percentage: number
  status: string
  created_at: string
  cobranca_description?: string
}

export function useFinancialDashboard(userId?: string) {
  // Estatísticas gerais
  const getFinancialStats = (startDate?: Date, endDate?: Date) => {
    const start = startDate || startOfMonth(new Date())
    const end = endDate || endOfMonth(new Date())

    return useQuery({
      queryKey: ['financial-stats', start.toISOString(), end.toISOString(), userId],
      queryFn: async (): Promise<FinancialStats> => {
        // Buscar cobranças no período (filtrar por usuário se especificado)
        let query = supabase
          .from('asaas_cobrancas' as any)
          .select(`
            *,
            user:profiles!user_id(nome_completo, email)
          `)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())

        // Filtrar por usuário se não for admin
        if (userId) {
          query = query.eq('user_id', userId)
        }

        const { data: cobrancas, error: cobrancasError } = await query

        if (cobrancasError) {
          console.error('Error fetching cobrancas:', cobrancasError)
          throw new Error('Erro ao buscar dados financeiros')
        }

        // Buscar comissões no período
        const { data: commissions, error: commissionsError } = await supabase
          .from('affiliate_commissions' as any)
          .select('*')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())

        if (commissionsError) {
          console.error('Error fetching commissions:', commissionsError)
        }

        // Calcular estatísticas
        const stats: FinancialStats = {
          totalRevenue: 0,
          monthlyRevenue: 0,
          pendingPayments: 0,
          confirmedPayments: 0,
          totalCommissions: 0,
          pendingCommissions: 0,
          paidCommissions: 0,
          paymentsByMethod: {
            pix: 0,
            card: 0,
            boleto: 0
          },
          revenueByService: {
            filiacao: 0,
            certidao: 0,
            regularizacao: 0,
            evento: 0,
            taxa_anual: 0
          }
        }

        // Processar cobranças
        cobrancas?.forEach((cobranca: any) => {
          const value = cobranca.value || 0

          if (cobranca.status === 'CONFIRMED' || cobranca.status === 'RECEIVED') {
            stats.totalRevenue += value
            stats.confirmedPayments += value

            // Por método de pagamento
            if (cobranca.payment_method === 'PIX') {
              stats.paymentsByMethod.pix += value
            } else if (cobranca.payment_method === 'CREDIT_CARD') {
              stats.paymentsByMethod.card += value
            } else if (cobranca.payment_method === 'BOLETO') {
              stats.paymentsByMethod.boleto += value
            }

            // Por tipo de serviço
            const serviceType = cobranca.service_type
            if (serviceType && stats.revenueByService[serviceType as keyof typeof stats.revenueByService] !== undefined) {
              stats.revenueByService[serviceType as keyof typeof stats.revenueByService] += value
            }
          } else if (cobranca.status === 'PENDING') {
            stats.pendingPayments += value
          }
        })

        stats.monthlyRevenue = stats.totalRevenue

        // Processar comissões
        commissions?.forEach((commission: any) => {
          const value = commission.commission_value || 0
          stats.totalCommissions += value

          if (commission.status === 'pending') {
            stats.pendingCommissions += value
          } else if (commission.status === 'completed') {
            stats.paidCommissions += value
          }
        })

        return stats
      },
      refetchInterval: 30000 // Atualizar a cada 30 segundos
    })
  }

  // Pagamentos recentes
  const getRecentPayments = (limit: number = 10) => {
    return useQuery({
      queryKey: ['recent-payments', limit, userId],
      queryFn: async (): Promise<PaymentSummary[]> => {
        let query = supabase
          .from('asaas_cobrancas' as any)
          .select(`
            *,
            user:profiles!user_id(nome_completo, email)
          `)
          .order('created_at', { ascending: false })
          .limit(limit)

        // Filtrar por usuário se especificado
        if (userId) {
          query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
          console.error('Error fetching recent payments:', error)
          throw new Error('Erro ao buscar pagamentos recentes')
        }

        return (data || []).map((item: any) => ({
          id: item.id,
          asaas_id: item.asaas_id,
          description: item.description,
          value: item.value,
          status: item.status,
          service_type: item.service_type,
          payment_method: item.payment_method,
          created_at: item.created_at,
          data_pagamento: item.data_pagamento,
          user_name: item.user?.nome_completo,
          user_email: item.user?.email
        }))
      },
      refetchInterval: 15000 // Atualizar a cada 15 segundos
    })
  }

  // Pagamentos pendentes
  const getPendingPayments = () => {
    return useQuery({
      queryKey: ['pending-payments', userId],
      queryFn: async (): Promise<PaymentSummary[]> => {
        let query = supabase
          .from('asaas_cobrancas' as any)
          .select(`
            *,
            user:profiles!user_id(nome_completo, email)
          `)
          .eq('status', 'PENDING')
          .order('created_at', { ascending: false })

        // Filtrar por usuário se especificado
        if (userId) {
          query = query.eq('user_id', userId)
        }

        const { data, error } = await query

        if (error) {
          console.error('Error fetching pending payments:', error)
          throw new Error('Erro ao buscar pagamentos pendentes')
        }

        return (data || []).map((item: any) => ({
          id: item.id,
          asaas_id: item.asaas_id,
          description: item.description,
          value: item.value,
          status: item.status,
          service_type: item.service_type,
          payment_method: item.payment_method,
          created_at: item.created_at,
          data_pagamento: item.data_pagamento,
          user_name: item.user?.nome_completo,
          user_email: item.user?.email
        }))
      },
      refetchInterval: 30000 // Atualizar a cada 30 segundos
    })
  }

  // Comissões recentes
  const getRecentCommissions = (limit: number = 10) => {
    return useQuery({
      queryKey: ['recent-commissions', limit],
      queryFn: async (): Promise<CommissionSummary[]> => {
        const { data, error } = await supabase
          .from('affiliate_commissions' as any)
          .select(`
            *,
            affiliate:profiles!affiliate_id(nome_completo, email),
            cobranca:asaas_cobrancas!cobranca_id(description)
          `)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) {
          console.error('Error fetching recent commissions:', error)
          throw new Error('Erro ao buscar comissões recentes')
        }

        return (data || []).map((item: any) => ({
          id: item.id,
          affiliate_name: item.affiliate?.nome_completo || 'N/A',
          affiliate_email: item.affiliate?.email || 'N/A',
          commission_value: item.commission_value,
          payment_value: item.payment_value,
          percentage: item.percentage,
          status: item.status,
          created_at: item.created_at,
          cobranca_description: item.cobranca?.description
        }))
      },
      refetchInterval: 30000 // Atualizar a cada 30 segundos
    })
  }

  // Dados para gráficos - receita por mês
  const getMonthlyRevenue = (months: number = 6) => {
    return useQuery({
      queryKey: ['monthly-revenue', months],
      queryFn: async () => {
        const monthlyData = []
        
        for (let i = months - 1; i >= 0; i--) {
          const date = subMonths(new Date(), i)
          const start = startOfMonth(date)
          const end = endOfMonth(date)

          const { data, error } = await supabase
            .from('asaas_cobrancas' as any)
            .select('value')
            .in('status', ['CONFIRMED', 'RECEIVED'])
            .gte('data_pagamento', start.toISOString())
            .lte('data_pagamento', end.toISOString())

          if (error) {
            console.error('Error fetching monthly revenue:', error)
            monthlyData.push({
              month: format(date, 'MMM/yyyy'),
              revenue: 0
            })
          } else {
            const totalRevenue = (data || []).reduce((sum: number, item: any) => sum + (item.value || 0), 0)
            monthlyData.push({
              month: format(date, 'MMM/yyyy'),
              revenue: totalRevenue
            })
          }
        }

        return monthlyData
      }
    })
  }

  return {
    getFinancialStats,
    getRecentPayments,
    getPendingPayments,
    getRecentCommissions,
    getMonthlyRevenue
  }
}