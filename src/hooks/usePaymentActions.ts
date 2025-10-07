import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { getAsaasAPI } from '@/utils/asaasApi'
import { toast } from 'sonner'

interface RefundPaymentParams {
  paymentId: string
  amount?: number
  description?: string
}

interface CancelPaymentParams {
  paymentId: string
  reason?: string
}

interface ResendPaymentParams {
  paymentId: string
  newDueDate?: string
}

export function usePaymentActions() {
  const queryClient = useQueryClient()
  const asaasAPI = getAsaasAPI()

  // Reembolsar pagamento
  const refundPayment = useMutation({
    mutationFn: async ({ paymentId, amount, description }: RefundPaymentParams) => {
      // Buscar dados do pagamento no banco
      const { data: cobranca, error: fetchError } = await supabase
        .from('asaas_cobrancas')
        .select('*')
        .eq('asaas_payment_id', paymentId)
        .single()

      if (fetchError) {
        throw new Error('Pagamento não encontrado')
      }

      // Processar reembolso via API do Asaas
      const refundData = await asaasAPI.request(`/payments/${paymentId}/refund`, {
        method: 'POST',
        body: JSON.stringify({
          value: amount || cobranca.value,
          description: description || 'Reembolso solicitado pelo sistema'
        })
      })

      // Atualizar status no banco
      const { error: updateError } = await supabase
        .from('asaas_cobrancas')
        .update({
          status: 'REFUNDED',
          updated_at: new Date().toISOString()
        })
        .eq('asaas_payment_id', paymentId)

      if (updateError) {
        throw updateError
      }

      // Registrar transação de reembolso
      const { error: transactionError } = await supabase
        .from('financial_transactions')
        .insert({
          user_id: cobranca.user_id,
          asaas_payment_id: paymentId,
          transaction_type: 'refund',
          amount: -(amount || cobranca.value),
          status: 'completed',
          description: description || 'Reembolso processado',
          payment_method: cobranca.billing_type,
          metadata: {
            original_payment_id: paymentId,
            refund_reason: description,
            refund_amount: amount || cobranca.value
          }
        })

      if (transactionError) {
        console.error('Erro ao registrar transação de reembolso:', transactionError)
      }

      return refundData
    },
    onSuccess: () => {
      toast.success('Reembolso processado com sucesso')
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['asaas-cobrancas'] })
    },
    onError: (error) => {
      console.error('Erro ao processar reembolso:', error)
      toast.error('Erro ao processar reembolso')
    }
  })

  // Cancelar pagamento
  const cancelPayment = useMutation({
    mutationFn: async ({ paymentId, reason }: CancelPaymentParams) => {
      // Cancelar via API do Asaas
      await asaasAPI.deletePayment(paymentId)

      // Atualizar status no banco
      const { error: updateError } = await supabase
        .from('asaas_cobrancas')
        .update({
          status: 'CANCELLED',
          updated_at: new Date().toISOString()
        })
        .eq('asaas_payment_id', paymentId)

      if (updateError) {
        throw updateError
      }

      // Registrar log de auditoria
      const { error: auditError } = await supabase
        .from('user_activity_log')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'payment_cancelled',
          table_name: 'asaas_cobrancas',
          record_id: paymentId,
          old_values: {},
          new_values: { status: 'CANCELLED', reason },
          metadata: {
            payment_id: paymentId,
            cancellation_reason: reason
          }
        })

      if (auditError) {
        console.error('Erro ao registrar log de auditoria:', auditError)
      }

      return { success: true }
    },
    onSuccess: () => {
      toast.success('Pagamento cancelado com sucesso')
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['asaas-cobrancas'] })
    },
    onError: (error) => {
      console.error('Erro ao cancelar pagamento:', error)
      toast.error('Erro ao cancelar pagamento')
    }
  })

  // Reenviar cobrança
  const resendPayment = useMutation({
    mutationFn: async ({ paymentId, newDueDate }: ResendPaymentParams) => {
      // Buscar dados do pagamento
      const { data: cobranca, error: fetchError } = await supabase
        .from('asaas_cobrancas')
        .select('*')
        .eq('asaas_payment_id', paymentId)
        .single()

      if (fetchError) {
        throw new Error('Pagamento não encontrado')
      }

      // Atualizar data de vencimento se fornecida
      if (newDueDate) {
        await asaasAPI.updatePayment(paymentId, {
          dueDate: newDueDate
        })

        // Atualizar no banco local
        const { error: updateError } = await supabase
          .from('asaas_cobrancas')
          .update({
            due_date: newDueDate,
            updated_at: new Date().toISOString()
          })
          .eq('asaas_payment_id', paymentId)

        if (updateError) {
          throw updateError
        }
      }

      // Reenviar notificação via API do Asaas (se disponível)
      try {
        await asaasAPI.request(`/payments/${paymentId}/sendByEmail`, {
          method: 'POST'
        })
      } catch (error) {
        console.warn('Erro ao reenviar por email:', error)
      }

      return { success: true }
    },
    onSuccess: () => {
      toast.success('Cobrança reenviada com sucesso')
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['asaas-cobrancas'] })
    },
    onError: (error) => {
      console.error('Erro ao reenviar cobrança:', error)
      toast.error('Erro ao reenviar cobrança')
    }
  })

  // Gerar segunda via
  const generateSecondCopy = useMutation({
    mutationFn: async (paymentId: string) => {
      // Buscar URL da fatura via API
      const invoiceData = await asaasAPI.getPaymentInvoiceUrl(paymentId)
      
      if (!invoiceData.invoiceUrl) {
        throw new Error('URL da fatura não disponível')
      }

      // Abrir em nova aba
      window.open(invoiceData.invoiceUrl, '_blank')

      return invoiceData
    },
    onSuccess: () => {
      toast.success('Segunda via gerada com sucesso')
    },
    onError: (error) => {
      console.error('Erro ao gerar segunda via:', error)
      toast.error('Erro ao gerar segunda via')
    }
  })

  // Verificar status do pagamento
  const checkPaymentStatus = useMutation({
    mutationFn: async (paymentId: string) => {
      // Buscar status atualizado via API
      const statusData = await asaasAPI.getPaymentStatus(paymentId)
      
      // Atualizar no banco local
      const { error: updateError } = await supabase
        .from('asaas_cobrancas')
        .update({
          status: statusData.status,
          updated_at: new Date().toISOString()
        })
        .eq('asaas_payment_id', paymentId)

      if (updateError) {
        throw updateError
      }

      return statusData
    },
    onSuccess: (data) => {
      toast.success(`Status atualizado: ${data.status}`)
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['asaas-cobrancas'] })
    },
    onError: (error) => {
      console.error('Erro ao verificar status:', error)
      toast.error('Erro ao verificar status do pagamento')
    }
  })

  return {
    refundPayment,
    cancelPayment,
    resendPayment,
    generateSecondCopy,
    checkPaymentStatus,
    isLoading: refundPayment.isPending || 
               cancelPayment.isPending || 
               resendPayment.isPending || 
               generateSecondCopy.isPending || 
               checkPaymentStatus.isPending
  }
}