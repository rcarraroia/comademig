import { WEBHOOK_TEST_SCENARIOS, SANDBOX_CONFIG } from './sandbox-config'
import { supabase } from '@/integrations/supabase/client'

/**
 * Simulador de webhooks para ambiente de testes
 * Permite simular diferentes cenários de webhook do Asaas
 */

export interface WebhookSimulationOptions {
  paymentId?: string
  eventType?: string
  delay?: number
  customPayload?: any
  simulateFailure?: boolean
  retryCount?: number
}

export interface WebhookSimulationResult {
  success: boolean
  webhookId?: string
  response?: any
  error?: string
  executionTime: number
}

export class WebhookSimulator {
  private baseUrl: string
  private webhookToken: string

  constructor() {
    this.baseUrl = process.env.VITE_SUPABASE_URL || ''
    this.webhookToken = SANDBOX_CONFIG.webhookToken
  }

  /**
   * Simula webhook de pagamento confirmado
   */
  async simulatePaymentConfirmed(
    paymentId: string, 
    options: Partial<WebhookSimulationOptions> = {}
  ): Promise<WebhookSimulationResult> {
    const scenario = WEBHOOK_TEST_SCENARIOS.PAYMENT_CONFIRMED
    
    const payload = {
      ...scenario,
      payment: {
        ...scenario.payment,
        id: paymentId,
        ...options.customPayload
      },
      dateCreated: new Date().toISOString()
    }

    return this.sendWebhook(payload, options)
  }

  /**
   * Simula webhook de pagamento recebido
   */
  async simulatePaymentReceived(
    paymentId: string, 
    options: Partial<WebhookSimulationOptions> = {}
  ): Promise<WebhookSimulationResult> {
    const scenario = WEBHOOK_TEST_SCENARIOS.PAYMENT_RECEIVED
    
    const payload = {
      ...scenario,
      payment: {
        ...scenario.payment,
        id: paymentId,
        ...options.customPayload
      },
      dateCreated: new Date().toISOString()
    }

    return this.sendWebhook(payload, options)
  }

  /**
   * Simula webhook de pagamento vencido
   */
  async simulatePaymentOverdue(
    paymentId: string, 
    options: Partial<WebhookSimulationOptions> = {}
  ): Promise<WebhookSimulationResult> {
    const scenario = WEBHOOK_TEST_SCENARIOS.PAYMENT_OVERDUE
    
    const payload = {
      ...scenario,
      payment: {
        ...scenario.payment,
        id: paymentId,
        ...options.customPayload
      },
      dateCreated: new Date().toISOString()
    }

    return this.sendWebhook(payload, options)
  }

  /**
   * Simula webhook de pagamento estornado
   */
  async simulatePaymentRefunded(
    paymentId: string, 
    options: Partial<WebhookSimulationOptions> = {}
  ): Promise<WebhookSimulationResult> {
    const scenario = WEBHOOK_TEST_SCENARIOS.PAYMENT_REFUNDED
    
    const payload = {
      ...scenario,
      payment: {
        ...scenario.payment,
        id: paymentId,
        ...options.customPayload
      },
      dateCreated: new Date().toISOString()
    }

    return this.sendWebhook(payload, options)
  }

  /**
   * Simula webhook customizado
   */
  async simulateCustomWebhook(
    payload: any, 
    options: Partial<WebhookSimulationOptions> = {}
  ): Promise<WebhookSimulationResult> {
    return this.sendWebhook(payload, options)
  }

  /**
   * Simula múltiplos webhooks em sequência
   */
  async simulateWebhookSequence(
    paymentId: string,
    sequence: string[] = ['PAYMENT_CONFIRMED']
  ): Promise<WebhookSimulationResult[]> {
    const results: WebhookSimulationResult[] = []

    for (let i = 0; i < sequence.length; i++) {
      const eventType = sequence[i]
      let result: WebhookSimulationResult

      // Aguardar entre webhooks para simular realidade
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      switch (eventType) {
        case 'PAYMENT_CONFIRMED':
          result = await this.simulatePaymentConfirmed(paymentId)
          break
        case 'PAYMENT_RECEIVED':
          result = await this.simulatePaymentReceived(paymentId)
          break
        case 'PAYMENT_OVERDUE':
          result = await this.simulatePaymentOverdue(paymentId)
          break
        case 'PAYMENT_REFUNDED':
          result = await this.simulatePaymentRefunded(paymentId)
          break
        default:
          result = {
            success: false,
            error: `Unknown event type: ${eventType}`,
            executionTime: 0
          }
      }

      results.push(result)
    }

    return results
  }

  /**
   * Testa processamento de webhook com retry
   */
  async testWebhookRetry(
    paymentId: string,
    maxRetries: number = 3
  ): Promise<WebhookSimulationResult[]> {
    const results: WebhookSimulationResult[] = []

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const shouldFail = attempt < maxRetries // Falhar nas primeiras tentativas
      
      const result = await this.simulatePaymentConfirmed(paymentId, {
        simulateFailure: shouldFail,
        retryCount: attempt
      })

      results.push(result)

      if (result.success) {
        break
      }

      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    return results
  }

  /**
   * Envia webhook simulado
   */
  private async sendWebhook(
    payload: any, 
    options: Partial<WebhookSimulationOptions> = {}
  ): Promise<WebhookSimulationResult> {
    const startTime = Date.now()

    try {
      // Aplicar delay se especificado
      if (options.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay))
      }

      // Simular falha se solicitado
      if (options.simulateFailure) {
        throw new Error('Simulated webhook failure')
      }

      // Chamar Edge Function de webhook
      const { data, error } = await supabase.functions.invoke('asaas-process-webhook', {
        body: payload,
        headers: {
          'asaas-access-token': this.webhookToken,
          'content-type': 'application/json'
        }
      })

      const executionTime = Date.now() - startTime

      if (error) {
        return {
          success: false,
          error: error.message,
          executionTime
        }
      }

      return {
        success: true,
        response: data,
        executionTime
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      }
    }
  }

  /**
   * Valida estrutura do payload de webhook
   */
  validateWebhookPayload(payload: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!payload.event) {
      errors.push('Missing event field')
    }

    if (!payload.payment) {
      errors.push('Missing payment field')
    } else {
      if (!payload.payment.id) {
        errors.push('Missing payment.id field')
      }
      if (!payload.payment.status) {
        errors.push('Missing payment.status field')
      }
      if (typeof payload.payment.value !== 'number') {
        errors.push('Invalid payment.value field')
      }
    }

    if (!payload.dateCreated) {
      errors.push('Missing dateCreated field')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Gera payload de webhook baseado em template
   */
  generateWebhookPayload(
    eventType: string, 
    paymentId: string, 
    customData: any = {}
  ): any {
    const basePayload = {
      event: eventType,
      dateCreated: new Date().toISOString(),
      payment: {
        id: paymentId,
        status: this.getStatusByEvent(eventType),
        value: 100.00,
        netValue: 96.51,
        ...customData
      }
    }

    // Adicionar campos específicos por evento
    switch (eventType) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        basePayload.payment.paymentDate = new Date().toISOString()
        basePayload.payment.clientPaymentDate = new Date().toISOString()
        break
        
      case 'PAYMENT_OVERDUE':
        basePayload.payment.dueDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        break
        
      case 'PAYMENT_REFUNDED':
        basePayload.payment.refundedValue = basePayload.payment.value
        basePayload.payment.refundDate = new Date().toISOString()
        break
    }

    return basePayload
  }

  /**
   * Obtém status baseado no tipo de evento
   */
  private getStatusByEvent(eventType: string): string {
    const statusMap: Record<string, string> = {
      'PAYMENT_CONFIRMED': 'CONFIRMED',
      'PAYMENT_RECEIVED': 'RECEIVED',
      'PAYMENT_OVERDUE': 'OVERDUE',
      'PAYMENT_REFUNDED': 'REFUNDED',
      'PAYMENT_CANCELLED': 'CANCELLED'
    }

    return statusMap[eventType] || 'PENDING'
  }
}

// Instância singleton
export const webhookSimulator = new WebhookSimulator()

// Funções utilitárias
export async function simulatePaymentFlow(paymentId: string): Promise<WebhookSimulationResult[]> {
  return webhookSimulator.simulateWebhookSequence(paymentId, [
    'PAYMENT_CONFIRMED'
  ])
}

export async function simulateFailedPaymentFlow(paymentId: string): Promise<WebhookSimulationResult[]> {
  return webhookSimulator.simulateWebhookSequence(paymentId, [
    'PAYMENT_OVERDUE'
  ])
}

export async function simulateRefundFlow(paymentId: string): Promise<WebhookSimulationResult[]> {
  return webhookSimulator.simulateWebhookSequence(paymentId, [
    'PAYMENT_CONFIRMED',
    'PAYMENT_REFUNDED'
  ])
}