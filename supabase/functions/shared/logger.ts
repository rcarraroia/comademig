/**
 * Sistema de Logs Centralizado
 * 
 * Função compartilhada para registrar logs em system_logs
 * Usado por Edge Functions para monitoramento e debugging
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Tipos
export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical'
export type LogSource = 'edge_function' | 'webhook' | 'frontend' | 'backend'

export interface LogEventParams {
  level: LogLevel
  source: LogSource
  functionName?: string
  message: string
  details?: any
  error?: Error
  userId?: string
  sessionId?: string
  requestId?: string
  metadata?: any
}

/**
 * Cliente Supabase com service_role para inserir logs
 * (bypassa RLS)
 */
function getSupabaseAdmin() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados')
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * Registrar evento no sistema de logs
 * 
 * @param params - Parâmetros do log
 * @returns Promise<boolean> - true se sucesso, false se falhou
 * 
 * @example
 * ```typescript
 * await logEvent({
 *   level: 'info',
 *   source: 'edge_function',
 *   functionName: 'asaas-webhook',
 *   message: 'Webhook recebido',
 *   details: { event: 'PAYMENT_CREATED' }
 * })
 * ```
 */
export async function logEvent(params: LogEventParams): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      console.error('[Logger] Cliente Supabase não disponível')
      return false
    }

    // Preparar dados do log
    const logData = {
      level: params.level,
      source: params.source,
      function_name: params.functionName || null,
      message: params.message,
      details: params.details ? sanitizeData(params.details) : {},
      error_message: params.error?.message || null,
      error_stack: params.error?.stack || null,
      user_id: params.userId || null,
      session_id: params.sessionId || null,
      request_id: params.requestId || null,
      metadata: params.metadata ? sanitizeData(params.metadata) : {}
    }

    // Inserir no banco
    const { error } = await supabase
      .from('system_logs')
      .insert([logData])

    if (error) {
      console.error('[Logger] Erro ao inserir log:', error)
      return false
    }

    // Log no console também (para Supabase Logs)
    const logPrefix = `[${params.level.toUpperCase()}]`
    const logMessage = `${logPrefix} ${params.functionName || params.source}: ${params.message}`
    
    switch (params.level) {
      case 'debug':
        console.debug(logMessage, params.details)
        break
      case 'info':
        console.log(logMessage, params.details)
        break
      case 'warning':
        console.warn(logMessage, params.details)
        break
      case 'error':
      case 'critical':
        console.error(logMessage, params.error || params.details)
        break
    }

    return true

  } catch (error) {
    // Não deixar erro de logging quebrar a função principal
    console.error('[Logger] Exceção ao registrar log:', error)
    return false
  }
}

/**
 * Atalho para registrar erro
 * 
 * @example
 * ```typescript
 * try {
 *   // código
 * } catch (error) {
 *   await logError({
 *     source: 'edge_function',
 *     functionName: 'asaas-webhook',
 *     message: 'Erro ao processar webhook',
 *     error: error as Error,
 *     details: { payload }
 *   })
 * }
 * ```
 */
export async function logError(params: Omit<LogEventParams, 'level'>): Promise<boolean> {
  return logEvent({
    ...params,
    level: 'error'
  })
}

/**
 * Atalho para registrar info
 */
export async function logInfo(params: Omit<LogEventParams, 'level'>): Promise<boolean> {
  return logEvent({
    ...params,
    level: 'info'
  })
}

/**
 * Atalho para registrar warning
 */
export async function logWarning(params: Omit<LogEventParams, 'level'>): Promise<boolean> {
  return logEvent({
    ...params,
    level: 'warning'
  })
}

/**
 * Atalho para registrar debug
 */
export async function logDebug(params: Omit<LogEventParams, 'level'>): Promise<boolean> {
  return logEvent({
    ...params,
    level: 'debug'
  })
}

/**
 * Atalho para registrar crítico
 */
export async function logCritical(params: Omit<LogEventParams, 'level'>): Promise<boolean> {
  return logEvent({
    ...params,
    level: 'critical'
  })
}

/**
 * Sanitizar dados antes de logar
 * Remove informações sensíveis
 */
function sanitizeData(data: any): any {
  if (!data) return data

  // Se for string, verificar se contém dados sensíveis
  if (typeof data === 'string') {
    return sanitizeString(data)
  }

  // Se for array, sanitizar cada item
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item))
  }

  // Se for objeto, sanitizar cada propriedade
  if (typeof data === 'object') {
    const sanitized: any = {}
    
    for (const [key, value] of Object.entries(data)) {
      // Remover campos sensíveis
      const lowerKey = key.toLowerCase()
      
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('key') ||
        lowerKey.includes('authorization') ||
        lowerKey === 'cpf' ||
        lowerKey === 'rg' ||
        lowerKey === 'credit_card' ||
        lowerKey === 'card_number' ||
        lowerKey === 'cvv' ||
        lowerKey === 'ccv'
      ) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitizeData(value)
      }
    }
    
    return sanitized
  }

  return data
}

/**
 * Sanitizar string
 */
function sanitizeString(str: string): string {
  // Remover possíveis tokens/keys
  return str
    .replace(/Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/gi, 'Bearer [REDACTED]')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF]')
    .replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '[CARD]')
}

/**
 * Wrapper para executar função com logging automático
 * 
 * @example
 * ```typescript
 * export const handler = withLogging(
 *   'asaas-webhook',
 *   async (req) => {
 *     // código da função
 *     return new Response('ok')
 *   }
 * )
 * ```
 */
export function withLogging<T extends (...args: any[]) => Promise<Response>>(
  functionName: string,
  handler: T
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now()

    try {
      // Log de início
      await logInfo({
        source: 'edge_function',
        functionName,
        message: `Função iniciada`,
        metadata: {
          timestamp: new Date().toISOString()
        }
      })

      // Executar função
      const response = await handler(...args)

      // Log de sucesso
      const duration = Date.now() - startTime
      await logInfo({
        source: 'edge_function',
        functionName,
        message: `Função concluída com sucesso`,
        metadata: {
          duration_ms: duration,
          status: response.status
        }
      })

      return response

    } catch (error) {
      // Log de erro
      const duration = Date.now() - startTime
      await logError({
        source: 'edge_function',
        functionName,
        message: `Erro na execução da função`,
        error: error as Error,
        metadata: {
          duration_ms: duration
        }
      })

      throw error
    }
  }) as T
}

/**
 * Log específico para criação de assinatura
 * 
 * @example
 * ```typescript
 * await logSubscriptionCreated({
 *   subscriptionId: 'sub_123',
 *   userId: 'user_456',
 *   value: 100.00,
 *   cycle: 'MONTHLY',
 *   billingType: 'CREDIT_CARD',
 *   hasAffiliate: true,
 *   affiliateCode: 'REF123'
 * })
 * ```
 */
export async function logSubscriptionCreated(params: {
  subscriptionId: string
  userId: string
  value: number
  cycle: string
  billingType: string
  hasAffiliate: boolean
  affiliateCode?: string
  initialPaymentId?: string
}): Promise<boolean> {
  return logInfo({
    source: 'edge_function',
    functionName: 'asaas-create-subscription',
    message: 'Assinatura criada com sucesso',
    userId: params.userId,
    details: {
      subscription_id: params.subscriptionId,
      initial_payment_id: params.initialPaymentId,
      value: params.value,
      cycle: params.cycle,
      billing_type: params.billingType,
      has_affiliate: params.hasAffiliate,
      affiliate_code: params.affiliateCode
    }
  })
}

/**
 * Log específico para configuração de split
 * 
 * @example
 * ```typescript
 * await logSplitConfiguration({
 *   subscriptionId: 'sub_123',
 *   splits: [
 *     { recipient: 'RENUM', percentage: 40, walletId: 'wallet_1' },
 *     { recipient: 'COMADEMIG', percentage: 40, walletId: 'wallet_2' },
 *     { recipient: 'Afiliado', percentage: 20, walletId: 'wallet_3' }
 *   ]
 * })
 * ```
 */
export async function logSplitConfiguration(params: {
  subscriptionId: string
  paymentId?: string
  splits: Array<{
    recipient: string
    percentage: number
    walletId: string
  }>
}): Promise<boolean> {
  return logInfo({
    source: 'edge_function',
    functionName: 'asaas-create-subscription',
    message: 'Split configurado',
    details: {
      subscription_id: params.subscriptionId,
      payment_id: params.paymentId,
      splits: params.splits,
      total_percentage: params.splits.reduce((sum, s) => sum + s.percentage, 0)
    }
  })
}

/**
 * Log específico para webhook recebido
 * 
 * @example
 * ```typescript
 * await logWebhookReceived({
 *   eventType: 'PAYMENT_RECEIVED',
 *   eventId: 'evt_123',
 *   paymentId: 'pay_456'
 * })
 * ```
 */
export async function logWebhookReceived(params: {
  eventType: string
  eventId: string
  paymentId?: string
  subscriptionId?: string
}): Promise<boolean> {
  return logInfo({
    source: 'webhook',
    functionName: 'asaas-webhook',
    message: `Webhook recebido: ${params.eventType}`,
    details: {
      event_type: params.eventType,
      event_id: params.eventId,
      payment_id: params.paymentId,
      subscription_id: params.subscriptionId
    }
  })
}

/**
 * Log específico para processamento de webhook
 * 
 * @example
 * ```typescript
 * await logWebhookProcessed({
 *   eventType: 'PAYMENT_RECEIVED',
 *   eventId: 'evt_123',
 *   success: true,
 *   action: 'Atualizado status para active'
 * })
 * ```
 */
export async function logWebhookProcessed(params: {
  eventType: string
  eventId: string
  success: boolean
  action?: string
  error?: Error
}): Promise<boolean> {
  if (params.success) {
    return logInfo({
      source: 'webhook',
      functionName: 'asaas-webhook',
      message: `Webhook processado: ${params.eventType}`,
      details: {
        event_type: params.eventType,
        event_id: params.eventId,
        action: params.action
      }
    })
  } else {
    return logError({
      source: 'webhook',
      functionName: 'asaas-webhook',
      message: `Erro ao processar webhook: ${params.eventType}`,
      error: params.error,
      details: {
        event_type: params.eventType,
        event_id: params.eventId
      }
    })
  }
}
