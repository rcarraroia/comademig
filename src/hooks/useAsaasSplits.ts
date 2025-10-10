import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

// Tipos de beneficiários do split
export type RecipientType = 'comademig' | 'renum' | 'affiliate';

// Tipos de serviço/receita
export type ServiceType = 'filiacao' | 'servicos' | 'publicidade' | 'eventos' | 'outros';

// Status do split
export type SplitStatus = 'PENDING' | 'PROCESSED' | 'CANCELLED' | 'ERROR';

interface CreateSplitRequest {
  cobrancaId: string
  serviceType: ServiceType
  affiliateId?: string
  totalValue: number
}

interface ProcessSplitsRequest {
  cobrancaId: string
  paymentValue: number
  serviceType: ServiceType
  affiliateId?: string
}

interface SplitConfig {
  id: string
  cobranca_id: string
  affiliate_id: string | null
  recipient_type: RecipientType | null
  recipient_name: string | null
  service_type: ServiceType | null
  percentage: number | null
  fixed_value: number | null
  commission_amount: number | null
  total_value: number | null
  wallet_id: string | null
  asaas_split_id: string | null
  status: SplitStatus
  processed_at: string | null
  error_message: string | null
  refusal_reason: string | null
  retry_count: number | null
  created_at: string
  updated_at: string
}

interface AffiliateCommission {
  id: string
  affiliate_id: string
  payment_id: string
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  created_at: string
}

export function useAsaasSplits() {
  const queryClient = useQueryClient()

  // Configurar splits triplos para cobrança (COMADEMIG, RENUM, Afiliado)
  const configureSplit = useMutation({
    mutationFn: async (data: CreateSplitRequest) => {
      console.log('Configuring triple split:', data)

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
      toast.success('Divisão de pagamento configurada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['asaas-splits'] })
      queryClient.invalidateQueries({ queryKey: ['affiliate-commissions'] })
    },
    onError: (error) => {
      console.error('Split configuration error:', error)
      toast.error(error.message || 'Erro ao configurar divisão de pagamento')
    }
  })

  // Processar splits triplos quando pagamento é confirmado
  const processSplits = useMutation({
    mutationFn: async (data: ProcessSplitsRequest) => {
      console.log('Processing triple splits:', data)

      const { data: result, error } = await supabase.functions.invoke('asaas-process-splits', {
        body: data
      })

      if (error) {
        console.error('Error processing splits:', error)
        throw new Error(error.message || 'Erro ao processar divisão de pagamento')
      }

      if (!result.success) {
        throw new Error(result.error || 'Erro ao processar divisão de pagamento')
      }

      return result
    },
    onSuccess: (data) => {
      if (data.processed) {
        const splits = data.data?.splits || [];
        const totalProcessed = splits.reduce((sum: number, split: any) => sum + (split.amount || 0), 0);
        toast.success(`Divisão processada: R$ ${totalProcessed.toFixed(2)} distribuídos`)
      }
      queryClient.invalidateQueries({ queryKey: ['asaas-splits'] })
      queryClient.invalidateQueries({ queryKey: ['affiliate-commissions'] })
    },
    onError: (error) => {
      console.error('Split processing error:', error)
      toast.error(error.message || 'Erro ao processar divisão de pagamento')
    }
  })

  // Buscar splits por cobrança
  const getSplitsByCobranca = (cobrancaId: string) => {
    return useQuery({
      queryKey: ['asaas-splits', cobrancaId],
      queryFn: async (): Promise<SplitConfig[]> => {
        const { data, error } = await supabase
          .from('asaas_splits')
          .select('*')
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
          .from('affiliate_commissions')
          .select('*')
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
          .from('affiliate_commissions')
          .select('amount, status')
          .eq('affiliate_id', affiliateId)

        if (error) {
          console.error('Error fetching commission stats:', error)
          throw new Error('Erro ao buscar estatísticas')
        }

        const stats = {
          total: 0,
          pending: 0,
          paid: 0,
          cancelled: 0,
          count: data?.length || 0
        }

        data?.forEach((commission) => {
          stats.total += commission.amount
          if (commission.status === 'pending') {
            stats.pending += commission.amount
          } else if (commission.status === 'paid') {
            stats.paid += commission.amount
          } else if (commission.status === 'cancelled') {
            stats.cancelled += commission.amount
          }
        })

        return stats
      },
      enabled: !!affiliateId
    })
  }

  // Buscar splits por tipo de beneficiário
  const getSplitsByRecipient = (recipientType: RecipientType, limit = 50) => {
    return useQuery({
      queryKey: ['asaas-splits-by-recipient', recipientType, limit],
      queryFn: async (): Promise<SplitConfig[]> => {
        const { data, error } = await supabase
          .from('asaas_splits')
          .select('*')
          .eq('recipient_type', recipientType)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) {
          console.error('Error fetching splits by recipient:', error)
          throw new Error('Erro ao buscar splits por beneficiário')
        }

        return (data || []) as SplitConfig[]
      }
    })
  }

  // Buscar splits por tipo de serviço
  const getSplitsByService = (serviceType: ServiceType, limit = 50) => {
    return useQuery({
      queryKey: ['asaas-splits-by-service', serviceType, limit],
      queryFn: async (): Promise<SplitConfig[]> => {
        const { data, error } = await supabase
          .from('asaas_splits')
          .select('*')
          .eq('service_type', serviceType)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) {
          console.error('Error fetching splits by service:', error)
          throw new Error('Erro ao buscar splits por tipo de serviço')
        }

        return (data || []) as SplitConfig[]
      }
    })
  }

  // Buscar estatísticas gerais de splits
  const getSplitStats = () => {
    return useQuery({
      queryKey: ['split-stats'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('asaas_splits')
          .select('recipient_type, commission_amount, status, service_type')

        if (error) {
          console.error('Error fetching split stats:', error)
          throw new Error('Erro ao buscar estatísticas de splits')
        }

        const stats = {
          total: 0,
          byRecipient: {
            comademig: 0,
            renum: 0,
            affiliate: 0
          },
          byStatus: {
            PENDING: 0,
            PROCESSED: 0,
            CANCELLED: 0,
            ERROR: 0
          },
          byService: {} as Record<ServiceType, number>,
          count: data?.length || 0
        }

        data?.forEach((split) => {
          const amount = split.commission_amount || 0
          stats.total += amount

          // Por beneficiário
          if (split.recipient_type && split.recipient_type in stats.byRecipient) {
            stats.byRecipient[split.recipient_type as keyof typeof stats.byRecipient] += amount
          }

          // Por status
          if (split.status && split.status in stats.byStatus) {
            stats.byStatus[split.status as keyof typeof stats.byStatus] += amount
          }

          // Por tipo de serviço
          if (split.service_type) {
            if (!stats.byService[split.service_type as ServiceType]) {
              stats.byService[split.service_type as ServiceType] = 0
            }
            stats.byService[split.service_type as ServiceType] += amount
          }
        })

        return stats
      }
    })
  }

  // Reprocessar split com erro
  const retrySplit = useMutation({
    mutationFn: async (splitId: string) => {
      console.log('Retrying split:', splitId)

      const { data: result, error } = await supabase.functions.invoke('asaas-retry-split', {
        body: { splitId }
      })

      if (error) {
        console.error('Error retrying split:', error)
        throw new Error(error.message || 'Erro ao reprocessar split')
      }

      if (!result.success) {
        throw new Error(result.error || 'Erro ao reprocessar split')
      }

      return result
    },
    onSuccess: () => {
      toast.success('Split reprocessado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['asaas-splits'] })
    },
    onError: (error) => {
      console.error('Retry split error:', error)
      toast.error(error.message || 'Erro ao reprocessar split')
    }
  })

  return {
    // Mutations
    configureSplit,
    processSplits,
    retrySplit,
    
    // Queries
    getSplitsByCobranca,
    getSplitsByRecipient,
    getSplitsByService,
    getAffiliateCommissions,
    getCommissionStats,
    getSplitStats,
    
    // Loading states
    isConfiguring: configureSplit.isPending,
    isProcessing: processSplits.isPending,
    isRetrying: retrySplit.isPending
  }
}