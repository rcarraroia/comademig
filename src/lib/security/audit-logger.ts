import { supabase } from '@/integrations/supabase/client'

/**
 * Sistema de auditoria para registrar todas as operações críticas
 * Implementa logging estruturado com diferentes níveis de severidade
 */

export enum AuditEventType {
  // Autenticação e Autorização
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGE = 'password_change',
  PERMISSION_DENIED = 'permission_denied',

  // Pagamentos
  PAYMENT_CREATED = 'payment_created',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_REFUNDED = 'payment_refunded',
  PAYMENT_CANCELLED = 'payment_cancelled',

  // Webhooks
  WEBHOOK_RECEIVED = 'webhook_received',
  WEBHOOK_PROCESSED = 'webhook_processed',
  WEBHOOK_FAILED = 'webhook_failed',
  WEBHOOK_SECURITY_VIOLATION = 'webhook_security_violation',

  // Dados Sensíveis
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  SENSITIVE_DATA_EXPORT = 'sensitive_data_export',
  DATA_ENCRYPTION = 'data_encryption',
  DATA_DECRYPTION = 'data_decryption',

  // Administração
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  ROLE_CHANGED = 'role_changed',
  SYSTEM_CONFIG_CHANGED = 'system_config_changed',

  // Segurança
  SECURITY_VIOLATION = 'security_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  API_KEY_USED = 'api_key_used',

  // Sistema
  SYSTEM_ERROR = 'system_error',
  SYSTEM_STARTUP = 'system_startup',
  SYSTEM_SHUTDOWN = 'system_shutdown',
  BACKUP_CREATED = 'backup_created'
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface AuditEvent {
  id?: string
  event_type: AuditEventType
  severity: AuditSeverity
  user_id?: string
  session_id?: string
  ip_address?: string
  user_agent?: string
  resource_type?: string
  resource_id?: string
  action: string
  details: Record<string, any>
  metadata?: Record<string, any>
  timestamp: string
  success: boolean
  error_message?: string
}

export interface AuditQuery {
  eventTypes?: AuditEventType[]
  severity?: AuditSeverity[]
  userId?: string
  resourceType?: string
  resourceId?: string
  startDate?: Date
  endDate?: Date
  success?: boolean
  limit?: number
  offset?: number
}

export class AuditLogger {
  private static instance: AuditLogger
  private batchSize = 10
  private batchTimeout = 5000 // 5 segundos
  private eventBatch: AuditEvent[] = []
  private batchTimer?: NodeJS.Timeout

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  /**
   * Registra evento de auditoria
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date().toISOString()
    }

    // Log no console para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔍 Audit Log [${event.severity.toUpperCase()}]`)
      console.log('Event:', event.event_type)
      console.log('Action:', event.action)
      console.log('User:', event.user_id || 'Anonymous')
      console.log('Success:', event.success)
      console.log('Details:', event.details)
      if (event.error_message) {
        console.error('Error:', event.error_message)
      }
      console.groupEnd()
    }

    // Adicionar ao batch para envio
    this.eventBatch.push(auditEvent)

    // Enviar imediatamente se for crítico
    if (event.severity === AuditSeverity.CRITICAL) {
      await this.flushBatch()
    } else {
      this.scheduleBatchFlush()
    }
  }

  /**
   * Agendar envio do batch
   */
  private scheduleBatchFlush(): void {
    if (this.eventBatch.length >= this.batchSize) {
      this.flushBatch()
      return
    }

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushBatch()
      }, this.batchTimeout)
    }
  }

  /**
   * Enviar batch de eventos
   */
  private async flushBatch(): Promise<void> {
    if (this.eventBatch.length === 0) return

    const eventsToSend = [...this.eventBatch]
    this.eventBatch = []

    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = undefined
    }

    try {
      const { error } = await supabase
        .from('audit_logs' as any)
        .insert(eventsToSend)

      if (error) {
        console.error('Error saving audit logs:', error)
        // Em caso de erro, tentar salvar localmente ou em fallback
        this.handleAuditFailure(eventsToSend, error)
      }
    } catch (error) {
      console.error('Critical error in audit logging:', error)
      this.handleAuditFailure(eventsToSend, error)
    }
  }

  /**
   * Tratar falha no sistema de auditoria
   */
  private handleAuditFailure(events: AuditEvent[], error: any): void {
    // Salvar em localStorage como fallback
    try {
      const existingLogs = localStorage.getItem('audit_logs_fallback')
      const logs = existingLogs ? JSON.parse(existingLogs) : []
      logs.push(...events)
      
      // Manter apenas os últimos 100 eventos no localStorage
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100)
      }
      
      localStorage.setItem('audit_logs_fallback', JSON.stringify(logs))
    } catch (localError) {
      console.error('Failed to save audit logs to localStorage:', localError)
    }
  }

  /**
   * Buscar eventos de auditoria
   */
  async queryEvents(query: AuditQuery = {}): Promise<AuditEvent[]> {
    try {
      let supabaseQuery = supabase
        .from('audit_logs' as any)
        .select('*')

      // Aplicar filtros
      if (query.eventTypes && query.eventTypes.length > 0) {
        supabaseQuery = supabaseQuery.in('event_type', query.eventTypes)
      }

      if (query.severity && query.severity.length > 0) {
        supabaseQuery = supabaseQuery.in('severity', query.severity)
      }

      if (query.userId) {
        supabaseQuery = supabaseQuery.eq('user_id', query.userId)
      }

      if (query.resourceType) {
        supabaseQuery = supabaseQuery.eq('resource_type', query.resourceType)
      }

      if (query.resourceId) {
        supabaseQuery = supabaseQuery.eq('resource_id', query.resourceId)
      }

      if (query.startDate) {
        supabaseQuery = supabaseQuery.gte('timestamp', query.startDate.toISOString())
      }

      if (query.endDate) {
        supabaseQuery = supabaseQuery.lte('timestamp', query.endDate.toISOString())
      }

      if (query.success !== undefined) {
        supabaseQuery = supabaseQuery.eq('success', query.success)
      }

      // Ordenar por timestamp decrescente
      supabaseQuery = supabaseQuery.order('timestamp', { ascending: false })

      // Aplicar paginação
      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit)
      }

      if (query.offset) {
        supabaseQuery = supabaseQuery.range(query.offset, query.offset + (query.limit || 50) - 1)
      }

      const { data, error } = await supabaseQuery

      if (error) {
        console.error('Error querying audit logs:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in audit query:', error)
      return []
    }
  }

  /**
   * Obter estatísticas de auditoria
   */
  async getAuditStats(days: number = 30): Promise<{
    totalEvents: number
    eventsByType: Record<string, number>
    eventsBySeverity: Record<string, number>
    successRate: number
    criticalEvents: number
  }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const events = await this.queryEvents({
        startDate,
        limit: 10000 // Limite alto para estatísticas
      })

      const stats = {
        totalEvents: events.length,
        eventsByType: {} as Record<string, number>,
        eventsBySeverity: {} as Record<string, number>,
        successRate: 0,
        criticalEvents: 0
      }

      let successCount = 0

      events.forEach(event => {
        // Contar por tipo
        stats.eventsByType[event.event_type] = (stats.eventsByType[event.event_type] || 0) + 1

        // Contar por severidade
        stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1

        // Contar sucessos
        if (event.success) {
          successCount++
        }

        // Contar eventos críticos
        if (event.severity === AuditSeverity.CRITICAL) {
          stats.criticalEvents++
        }
      })

      // Calcular taxa de sucesso
      stats.successRate = events.length > 0 ? (successCount / events.length) * 100 : 100

      return stats
    } catch (error) {
      console.error('Error getting audit stats:', error)
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        successRate: 0,
        criticalEvents: 0
      }
    }
  }

  /**
   * Limpar logs antigos
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const { data, error } = await supabase
        .from('audit_logs' as any)
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('id')

      if (error) {
        console.error('Error cleaning up audit logs:', error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error('Error in audit cleanup:', error)
      return 0
    }
  }
}

// Instância singleton
export const auditLogger = AuditLogger.getInstance()

// Funções utilitárias para eventos comuns
export const AuditHelpers = {
  // Pagamentos
  logPaymentCreated: (paymentId: string, userId: string, amount: number, method: string) =>
    auditLogger.logEvent({
      event_type: AuditEventType.PAYMENT_CREATED,
      severity: AuditSeverity.INFO,
      user_id: userId,
      resource_type: 'payment',
      resource_id: paymentId,
      action: 'create_payment',
      success: true,
      details: { amount, method }
    }),

  logPaymentConfirmed: (paymentId: string, userId: string, amount: number) =>
    auditLogger.logEvent({
      event_type: AuditEventType.PAYMENT_CONFIRMED,
      severity: AuditSeverity.INFO,
      user_id: userId,
      resource_type: 'payment',
      resource_id: paymentId,
      action: 'confirm_payment',
      success: true,
      details: { amount }
    }),

  logPaymentFailed: (paymentId: string, userId: string, error: string) =>
    auditLogger.logEvent({
      event_type: AuditEventType.PAYMENT_FAILED,
      severity: AuditSeverity.WARNING,
      user_id: userId,
      resource_type: 'payment',
      resource_id: paymentId,
      action: 'process_payment',
      success: false,
      error_message: error,
      details: { error }
    }),

  // Webhooks
  logWebhookReceived: (webhookId: string, eventType: string, success: boolean, error?: string) =>
    auditLogger.logEvent({
      event_type: AuditEventType.WEBHOOK_RECEIVED,
      severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      resource_type: 'webhook',
      resource_id: webhookId,
      action: 'process_webhook',
      success,
      error_message: error,
      details: { eventType }
    }),

  logSecurityViolation: (userId: string, violation: string, details: any) =>
    auditLogger.logEvent({
      event_type: AuditEventType.SECURITY_VIOLATION,
      severity: AuditSeverity.CRITICAL,
      user_id: userId,
      action: 'security_violation',
      success: false,
      error_message: violation,
      details
    }),

  // Dados sensíveis
  logSensitiveDataAccess: (userId: string, dataType: string, resourceId: string) =>
    auditLogger.logEvent({
      event_type: AuditEventType.SENSITIVE_DATA_ACCESS,
      severity: AuditSeverity.WARNING,
      user_id: userId,
      resource_type: dataType,
      resource_id: resourceId,
      action: 'access_sensitive_data',
      success: true,
      details: { dataType }
    }),

  // Sistema
  logSystemError: (error: string, details: any) =>
    auditLogger.logEvent({
      event_type: AuditEventType.SYSTEM_ERROR,
      severity: AuditSeverity.ERROR,
      action: 'system_error',
      success: false,
      error_message: error,
      details
    })
}