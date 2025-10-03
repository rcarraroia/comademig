import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface CreateSplitRequest {
  cobrancaId: string
  affiliateId: string
  percentage: number
  description?: string
}

interface ProcessSplitsRequest {
  cobrancaId: string
  paymentValue: number
  affiliateId?: string
}

interface SplitConfig {
  id: string
  cobranca_id: string
  affiliate_id: string
  percentage: number
  status: 'active' | 'processed' | 'cancelled' | 'error'
  commission_value?: number
  transfer_id?: string
  processed_at?: string
  notes?: string
  created_at: string
}

interface AffiliateCommission {
  id: string
  affiliate_id: string
  cobranca_id: string
  split_id: string
  commission_value: number
  payment_value: number
  percentage: number
  transfer_id: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}

export function useAsaasSplits() {
  const queryClient = useQueryClient()

  // Configurar split para cobrança
  const configureSplit = useMutation({
    mutationFn: async (data: CreateSplitRequest) => {
      console.log('Configuring split:', data)

      const { data: result, error } = await supabase.functions.invoke('asaas-configure-split', {
        body: data
      })

      if (error) {
        console.error('Error configuring split:', error)
        throw new Error(error.message || 'Erro ao configurar split')
      }

      if (!result.success) {
        throw new Error(result.error || 'Erro ao configurar split')
      }

      return result.data
    },
    onSuccess: (data) => {
      toast.success('Split configurado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['asaas-splits'] })
      queryClient.invalidateQueries({ queryKey: ['affiliate-commissions'] })
    },
    onError: (error) => {
      console.error('Split configuration error:', error)
      toast.error(error.message || 'Erro ao configurar split')
    }
  })

  // Processar splits quando pagamento é confirmado
  const processSplits = useMutation({
    mutationFn: async (data: ProcessSplitsRequest) => {
      console.log('Processing splits:', data)

      const { data: result, error } = await supabase.functions.invoke('asaas-process-splits', {
        body: data
      })

      if (error) {
        console.error('Error processing splits:', error)
        throw new Error(error.message || 'Erro ao processar splits')
      }

      if (!result.success) {
        throw new Error(result.error || 'Erro ao processar splits')
      }

      return result
    },
    onSuccess: (data) => {
      if (data.processed) {
        toast.success(`Comissão de R$ ${data.data?.commissionValue?.toFixed(2)} processada!`)
      }
      queryClient.invalidateQueries({ queryKey: ['asaas-splits'] })
      queryClient.invalidateQueries({ queryKey: ['affiliate-commissions'] })
    },
    onError: (error) => {
      console.error('Split processing error:', error)
      toast.error(error.message || 'Erro ao processar splits')
    }
  })

  // Buscar splits por cobrança
  const getSplitsByCobranca = (cobrancaId: string) => {
    return useQuery({
      queryKey: ['asaas-splits', cobrancaId],
      queryFn: async (): Promise<SplitConfig[]> => {
        const { data, error } = await supabase
          .from('asaas_splits' as any)
          .select(`
            *,
            affiliate:profiles!affiliate_id(
              id,
              full_name,
              email
            )
          `)
          .eq('cobranca_id', cobrancaId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching splits:', error)
          throw new Error('Erro ao buscar splits')
        }

        return (data || []) as SplitConfig[]
      },
      enabled: !!cobrancaId
    })
  }

  // Buscar comissões do afiliado
  const getAffiliateCommissions = (affiliateId: string) => {
    return useQuery({
      queryKey: ['affiliate-commissions', affiliateId],
      queryFn: async (): Promise<AffiliateCommission[]> => {
        const { data, error } = await supabase
          .from('affiliate_commissions' as any)
          .select(`
            *,
            cobranca:asaas_cobrancas!cobranca_id(
              id,
              external_id,
              description,
              value
            )
          `)
          .eq('affiliate_id', affiliateId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching affiliate commissions:', error)
          throw new Error('Erro ao buscar comissões')
        }

        return (data || []) as AffiliateCommission[]
      },
      enabled: !!affiliateId
    })
  }

  // Buscar estatísticas de comissões
  const getCommissionStats = (affiliateId: string) => {
    return useQuery({
      queryKey: ['commission-stats', affiliateId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('affiliate_commissions' as any)
          .select('commission_value, status')
          .eq('affiliate_id', affiliateId)

        if (error) {
          console.error('Error fetching commission stats:', error)
          throw new Error('Erro ao buscar estatísticas')
        }

        const stats = {
          total: 0,
          pending: 0,
          completed: 0,
          count: data?.length || 0
        }

        data?.forEach((commission: any) => {
          stats.total += commission.commission_value
          if (commission.status === 'pending') {
            stats.pending += commission.commission_value
          } else if (commission.status === 'completed') {
            stats.completed += commission.commission_value
          }
        })

        return stats
      },
      enabled: !!affiliateId
    })
  }

  return {
    configureSplit,
    processSplits,
    getSplitsByCobranca,
    getAffiliateCommissions,
    getCommissionStats,
    isConfiguring: configureSplit.isPending,
    isProcessing: processSplits.isPending
  }
}