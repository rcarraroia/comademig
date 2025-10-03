import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { asaasClient } from '@/lib/asaas/client'
import { asaasErrorHandler, AsaasErrorType, ErrorSeverity } from '@/lib/asaas/error-handler'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface RecoveryAction {
  id: string
  type: 'retry_payment' | 'resend_webhook' | 'refresh_data' | 'alternative_method'
  description: string
  priority: 'low' | 'medium' | 'high'
  automated: boolean
  lastAttempt?: Date
  attempts: number
  maxAttempts: number
}

interface SystemHealth {
  asaasConnection: boolean
  supabaseConnection: boolean
  webhookProcessing: boolean
  paymentProcessing: boolean
  lastCheck: Date
}

export function useErrorRecovery() {
  const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>([])
  const [isRecovering, setIsRecovering] = useState(false)
  const queryClient = useQueryClient()

  // Monitorar saúde do sistema
  const { data: systemHealth, refetch: checkSystemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: async (): Promise<SystemHealth> => {
      const health: SystemHealth = {
        asaasConnection: false,
        supabaseConnection: false,
        webhookProcessing: false,
        paymentProcessing: false,
        lastCheck: new Date()
      }

      try {
        // Testar conexão Asaas
        const asaasTest = await asaasClient.testConnection()
        health.asaasConnection = asaasTest.success

        // Testar conexão Supabase
        const { error: supabaseError } = await supabase
          .from('profiles' as any)
          .select('id')
          .limit(1)
        health.supabaseConnection = !supabaseError

        // Verificar processamento de webhooks (últimos 5 minutos)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        const { data: recentWebhooks, error: webhookError } = await supabase
          .from('asaas_webhooks' as any)
          .select('processed')
          .gte('created_at', fiveMinutesAgo.toISOString())

        if (!webhookError && recentWebhooks) {
          const processedCount = recentWebhooks.filter(w => w.processed).length
          const totalCount = recentWebhooks.length
          health.webhookProcessing = totalCount === 0 || (processedCount / totalCount) > 0.8
        }

        // Verificar processamento de pagamentos (últimos 10 minutos)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
        const { data: recentPayments, error: paymentError } = await supabase
          .from('asaas_cobrancas' as any)
          .select('status')
          .gte('created_at', tenMinutesAgo.toISOString())

        if (!paymentError && recentPayments) {
          const failedCount = recentPayments.filter(p => 
            p.status === 'CANCELLED' || p.status === 'REFUNDED'
          ).length
          const totalCount = recentPayments.length
          health.paymentProcessing = totalCount === 0 || (failedCount / totalCount) < 0.2
        }

      } catch (error) {
        console.error('Error checking system health:', error)
      }

      return health
    },
    refetchInterval: 60000, // Verificar a cada minuto
    refetchIntervalInBackground: true
  })

  // Detectar problemas e sugerir ações de recuperação
  const detectProblems = useCallback(() => {
    const errorStats = asaasErrorHandler.getErrorStats()
    const newActions: RecoveryAction[] = []

    // Problemas de conexão com Asaas
    if (!systemHealth?.asaasConnection) {
      newActions.push({
        id: 'asaas-connection',
        type: 'refresh_data',
        description: 'Reconectar com API Asaas',
        priority: 'high',
        automated: true,
        attempts: 0,
        maxAttempts: 3
      })
    }

    // Muitos erros de rate limit
    if (errorStats.byType[AsaasErrorType.RATE_LIMIT] > 5) {
      newActions.push({
        id: 'rate-limit-backoff',
        type: 'retry_payment',
        description: 'Implementar backoff para rate limiting',
        priority: 'medium',
        automated: true,
        attempts: 0,
        maxAttempts: 1
      })
    }

    // Erros críticos de autenticação
    if (errorStats.bySeverity[ErrorSeverity.CRITICAL] > 0) {
      newActions.push({
        id: 'auth-refresh',
        type: 'refresh_data',
        description: 'Verificar credenciais de autenticação',
        priority: 'high',
        automated: false,
        attempts: 0,
        maxAttempts: 1
      })
    }

    // Problemas de processamento de webhooks
    if (!systemHealth?.webhookProcessing) {
      newActions.push({
        id: 'webhook-recovery',
        type: 'resend_webhook',
        description: 'Reprocessar webhooks pendentes',
        priority: 'medium',
        automated: true,
        attempts: 0,
        maxAttempts: 2
      })
    }

    // Muitos erros de validação (possível problema nos dados)
    if (errorStats.byType[AsaasErrorType.VALIDATION] > 10) {
      newActions.push({
        id: 'data-validation',
        type: 'refresh_data',
        description: 'Verificar integridade dos dados',
        priority: 'medium',
        automated: false,
        attempts: 0,
        maxAttempts: 1
      })
    }

    // Problemas de pagamento - sugerir métodos alternativos
    if (errorStats.byType[AsaasErrorType.BUSINESS_RULE] > 5) {
      newActions.push({
        id: 'alternative-payment',
        type: 'alternative_method',
        description: 'Sugerir métodos de pagamento alternativos',
        priority: 'low',
        automated: false,
        attempts: 0,
        maxAttempts: 1
      })
    }

    setRecoveryActions(newActions)
  }, [systemHealth])

  // Executar ação de recuperação
  const executeRecoveryAction = useCallback(async (actionId: string) => {
    const action = recoveryActions.find(a => a.id === actionId)
    if (!action || action.attempts >= action.maxAttempts) {
      return false
    }

    setIsRecovering(true)

    try {
      let success = false

      switch (action.type) {
        case 'refresh_data':
          // Invalidar todas as queries para forçar refresh
          await queryClient.invalidateQueries()
          await checkSystemHealth()
          success = true
          break

        case 'retry_payment':
          // Implementar lógica de retry para pagamentos falhados
          success = await retryFailedPayments()
          break

        case 'resend_webhook':
          // Reprocessar webhooks pendentes
          success = await reprocessPendingWebhooks()
          break

        case 'alternative_method':
          // Notificar usuários sobre métodos alternativos
          toast.info('Considere usar PIX para pagamentos mais rápidos e com desconto!')
          success = true
          break
      }

      // Atualizar status da ação
      setRecoveryActions(prev => prev.map(a => 
        a.id === actionId 
          ? { 
              ...a, 
              attempts: a.attempts + 1, 
              lastAttempt: new Date() 
            }
          : a
      ))

      if (success) {
        toast.success(`Ação de recuperação executada: ${action.description}`)
        
        // Remover ação se foi bem-sucedida
        setRecoveryActions(prev => prev.filter(a => a.id !== actionId))
      }

      return success

    } catch (error) {
      console.error('Error executing recovery action:', error)
      toast.error(`Falha na recuperação: ${action.description}`)
      return false
    } finally {
      setIsRecovering(false)
    }
  }, [recoveryActions, queryClient, checkSystemHealth])

  // Executar recuperação automática
  const executeAutomaticRecovery = useCallback(async () => {
    const automaticActions = recoveryActions.filter(a => 
      a.automated && a.attempts < a.maxAttempts
    )

    for (const action of automaticActions) {
      // Aguardar entre ações para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 2000))
      await executeRecoveryAction(action.id)
    }
  }, [recoveryActions, executeRecoveryAction])

  // Retry de pagamentos falhados
  const retryFailedPayments = async (): Promise<boolean> => {
    try {
      // Buscar pagamentos com erro nos últimos 30 minutos
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      
      const { data: failedPayments, error } = await supabase
        .from('asaas_cobrancas' as any)
        .select('*')
        .in('status', ['PENDING', 'OVERDUE'])
        .gte('created_at', thirtyMinutesAgo.toISOString())
        .limit(5) // Limitar para não sobrecarregar

      if (error || !failedPayments?.length) {
        return false
      }

      // Tentar reprocessar cada pagamento
      let successCount = 0
      for (const payment of failedPayments) {
        try {
          // Verificar status atual no Asaas
          const result = await asaasClient.get(`/payments/${payment.asaas_id}`)
          
          if (result.success && result.data) {
            // Atualizar status local se mudou
            if (result.data.status !== payment.status) {
              await supabase
                .from('asaas_cobrancas' as any)
                .update({ status: result.data.status })
                .eq('id', payment.id)
              
              successCount++
            }
          }
        } catch (error) {
          console.error(`Error retrying payment ${payment.id}:`, error)
        }
      }

      return successCount > 0

    } catch (error) {
      console.error('Error in retryFailedPayments:', error)
      return false
    }
  }

  // Reprocessar webhooks pendentes
  const reprocessPendingWebhooks = async (): Promise<boolean> => {
    try {
      // Buscar webhooks não processados dos últimos 60 minutos
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      
      const { data: pendingWebhooks, error } = await supabase
        .from('asaas_webhooks' as any)
        .select('*')
        .eq('processed', false)
        .gte('created_at', oneHourAgo.toISOString())
        .limit(10) // Limitar para não sobrecarregar

      if (error || !pendingWebhooks?.length) {
        return false
      }

      // Tentar reprocessar cada webhook
      let successCount = 0
      for (const webhook of pendingWebhooks) {
        try {
          // Chamar Edge Function para reprocessar
          const { error: processError } = await supabase.functions.invoke('asaas-process-webhook', {
            body: webhook.payload
          })

          if (!processError) {
            successCount++
          }
        } catch (error) {
          console.error(`Error reprocessing webhook ${webhook.id}:`, error)
        }
      }

      return successCount > 0

    } catch (error) {
      console.error('Error in reprocessPendingWebhooks:', error)
      return false
    }
  }

  // Detectar problemas quando há mudanças no sistema
  useEffect(() => {
    if (systemHealth) {
      detectProblems()
    }
  }, [systemHealth, detectProblems])

  // Executar recuperação automática quando há ações disponíveis
  useEffect(() => {
    const automaticActions = recoveryActions.filter(a => 
      a.automated && a.attempts < a.maxAttempts
    )

    if (automaticActions.length > 0 && !isRecovering) {
      // Aguardar 5 segundos antes de executar para evitar loops
      const timer = setTimeout(executeAutomaticRecovery, 5000)
      return () => clearTimeout(timer)
    }
  }, [recoveryActions, isRecovering, executeAutomaticRecovery])

  return {
    systemHealth,
    recoveryActions,
    isRecovering,
    executeRecoveryAction,
    executeAutomaticRecovery,
    checkSystemHealth,
    retryFailedPayments,
    reprocessPendingWebhooks
  }
}