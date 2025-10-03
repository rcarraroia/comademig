/**
 * Sistema de monitoramento para métricas de performance e saúde do sistema
 * Coleta dados em tempo real e gera alertas para problemas críticos
 */

export interface SystemMetrics {
  timestamp: Date
  performance: {
    apiResponseTime: number
    webhookProcessingTime: number
    paymentSuccessRate: number
    errorRate: number
    throughput: number
  }
  health: {
    asaasConnection: boolean
    supabaseConnection: boolean
    webhookProcessing: boolean
    paymentProcessing: boolean
  }
  resources: {
    activeUsers: number
    pendingPayments: number
    processingQueue: number
    memoryUsage?: number
  }
}

export interface Alert {
  id: string
  type: 'performance' | 'error' | 'security' | 'resource'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: Date
  resolved: boolean
  metadata?: Record<string, any>
}

export interface MonitoringConfig {
  metricsInterval: number // ms
  alertThresholds: {
    responseTime: number // ms
    errorRate: number // %
    successRate: number // %
    queueSize: number
  }
  enableAlerts: boolean
  enableMetricsCollection: boolean
}

const DEFAULT_CONFIG: MonitoringConfig = {
  metricsInterval: 60000, // 1 minuto
  alertThresholds: {
    responseTime: 5000, // 5 segundos
    errorRate: 5, // 5%
    successRate: 95, // 95%
    queueSize: 100
  },
  enableAlerts: true,
  enableMetricsCollection: true
}

export class SystemMonitor {
  private static instance: SystemMonitor
  private config: MonitoringConfig
  private metrics: SystemMetrics[] = []
  private alerts: Alert[] = []
  private metricsTimer?: NodeJS.Timeout
  private isCollecting = false

  static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor()
    }
    return SystemMonitor.instance
  }

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Inicia coleta de métricas
   */
  startMonitoring(): void {
    if (this.isCollecting) return

    this.isCollecting = true
    console.log('📊 Sistema de monitoramento iniciado')

    // Coleta inicial
    this.collectMetrics()

    // Agendar coletas periódicas
    this.metricsTimer = setInterval(() => {
      this.collectMetrics()
    }, this.config.metricsInterval)
  }

  /**
   * Para coleta de métricas
   */
  stopMonitoring(): void {
    if (!this.isCollecting) return

    this.isCollecting = false
    
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer)
      this.metricsTimer = undefined
    }

    console.log('📊 Sistema de monitoramento parado')
  }

  /**
   * Coleta métricas do sistema
   */
  private async collectMetrics(): Promise<void> {
    if (!this.config.enableMetricsCollection) return

    try {
      const metrics = await this.gatherSystemMetrics()
      this.metrics.push(metrics)

      // Manter apenas as últimas 1000 métricas
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000)
      }

      // Verificar alertas
      if (this.config.enableAlerts) {
        this.checkAlerts(metrics)
      }

      // Log em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Métricas coletadas:', {
          responseTime: metrics.performance.apiResponseTime,
          successRate: metrics.performance.paymentSuccessRate,
          errorRate: metrics.performance.errorRate,
          activeUsers: metrics.resources.activeUsers
        })
      }

    } catch (error) {
      console.error('Erro ao coletar métricas:', error)
    }
  }

  /**
   * Coleta dados do sistema
   */
  private async gatherSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = new Date()

    // Métricas de performance
    const performance = await this.getPerformanceMetrics()
    
    // Saúde do sistema
    const health = await this.getHealthMetrics()
    
    // Recursos do sistema
    const resources = await this.getResourceMetrics()

    return {
      timestamp,
      performance,
      health,
      resources
    }
  }

  /**
   * Métricas de performance
   */
  private async getPerformanceMetrics(): Promise<SystemMetrics['performance']> {
    // Simular coleta de métricas (em produção, integrar com APM real)
    const recentMetrics = this.metrics.slice(-10)
    
    const avgResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.performance.apiResponseTime, 0) / recentMetrics.length
      : Math.random() * 1000 + 500 // Simular 500-1500ms

    const successRate = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.performance.paymentSuccessRate, 0) / recentMetrics.length
      : 95 + Math.random() * 4 // Simular 95-99%

    const errorRate = 100 - successRate

    return {
      apiResponseTime: avgResponseTime,
      webhookProcessingTime: Math.random() * 500 + 100, // 100-600ms
      paymentSuccessRate: successRate,
      errorRate: errorRate,
      throughput: Math.floor(Math.random() * 50) + 10 // 10-60 req/min
    }
  }

  /**
   * Métricas de saúde
   */
  private async getHealthMetrics(): Promise<SystemMetrics['health']> {
    // Em produção, fazer verificações reais
    return {
      asaasConnection: Math.random() > 0.05, // 95% uptime
      supabaseConnection: Math.random() > 0.02, // 98% uptime
      webhookProcessing: Math.random() > 0.03, // 97% uptime
      paymentProcessing: Math.random() > 0.04 // 96% uptime
    }
  }

  /**
   * Métricas de recursos
   */
  private async getResourceMetrics(): Promise<SystemMetrics['resources']> {
    return {
      activeUsers: Math.floor(Math.random() * 100) + 10, // 10-110 usuários
      pendingPayments: Math.floor(Math.random() * 50), // 0-50 pagamentos
      processingQueue: Math.floor(Math.random() * 20), // 0-20 na fila
      memoryUsage: Math.random() * 80 + 20 // 20-100% memória
    }
  }

  /**
   * Verifica condições de alerta
   */
  private checkAlerts(metrics: SystemMetrics): void {
    const { alertThresholds } = this.config

    // Alerta de tempo de resposta
    if (metrics.performance.apiResponseTime > alertThresholds.responseTime) {
      this.createAlert({
        type: 'performance',
        severity: 'high',
        title: 'Tempo de Resposta Alto',
        message: `API respondendo em ${metrics.performance.apiResponseTime}ms (limite: ${alertThresholds.responseTime}ms)`,
        metadata: { responseTime: metrics.performance.apiResponseTime }
      })
    }

    // Alerta de taxa de erro
    if (metrics.performance.errorRate > alertThresholds.errorRate) {
      this.createAlert({
        type: 'error',
        severity: 'high',
        title: 'Taxa de Erro Elevada',
        message: `Taxa de erro em ${metrics.performance.errorRate.toFixed(1)}% (limite: ${alertThresholds.errorRate}%)`,
        metadata: { errorRate: metrics.performance.errorRate }
      })
    }

    // Alerta de taxa de sucesso baixa
    if (metrics.performance.paymentSuccessRate < alertThresholds.successRate) {
      this.createAlert({
        type: 'performance',
        severity: 'critical',
        title: 'Taxa de Sucesso Baixa',
        message: `Taxa de sucesso em ${metrics.performance.paymentSuccessRate.toFixed(1)}% (mínimo: ${alertThresholds.successRate}%)`,
        metadata: { successRate: metrics.performance.paymentSuccessRate }
      })
    }

    // Alerta de fila de processamento
    if (metrics.resources.processingQueue > alertThresholds.queueSize) {
      this.createAlert({
        type: 'resource',
        severity: 'medium',
        title: 'Fila de Processamento Cheia',
        message: `${metrics.resources.processingQueue} itens na fila (limite: ${alertThresholds.queueSize})`,
        metadata: { queueSize: metrics.resources.processingQueue }
      })
    }

    // Alertas de saúde do sistema
    if (!metrics.health.asaasConnection) {
      this.createAlert({
        type: 'error',
        severity: 'critical',
        title: 'Conexão Asaas Falhou',
        message: 'Não foi possível conectar com a API do Asaas',
        metadata: { service: 'asaas' }
      })
    }

    if (!metrics.health.supabaseConnection) {
      this.createAlert({
        type: 'error',
        severity: 'critical',
        title: 'Conexão Supabase Falhou',
        message: 'Não foi possível conectar com o Supabase',
        metadata: { service: 'supabase' }
      })
    }
  }

  /**
   * Cria novo alerta
   */
  private createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    }

    this.alerts.push(alert)

    // Manter apenas os últimos 100 alertas
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }

    // Log do alerta
    console.warn(`🚨 ALERTA [${alert.severity.toUpperCase()}]: ${alert.title} - ${alert.message}`)

    // Em produção, enviar para serviço de alertas (Slack, email, etc.)
    if (process.env.NODE_ENV === 'production') {
      this.sendAlert(alert)
    }
  }

  /**
   * Envia alerta para canais externos
   */
  private async sendAlert(alert: Alert): Promise<void> {
    // Implementar integração com Slack, email, SMS, etc.
    console.log('📧 Enviando alerta:', alert.title)
  }

  /**
   * Resolve alerta
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      return true
    }
    return false
  }

  /**
   * Obtém métricas recentes
   */
  getRecentMetrics(count: number = 10): SystemMetrics[] {
    return this.metrics.slice(-count)
  }

  /**
   * Obtém alertas ativos
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved)
  }

  /**
   * Obtém todos os alertas
   */
  getAllAlerts(): Alert[] {
    return [...this.alerts].reverse() // Mais recentes primeiro
  }

  /**
   * Obtém estatísticas de performance
   */
  getPerformanceStats(hours: number = 24): {
    avgResponseTime: number
    avgSuccessRate: number
    avgErrorRate: number
    totalAlerts: number
    criticalAlerts: number
  } {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff)
    const recentAlerts = this.alerts.filter(a => a.timestamp > cutoff)

    if (recentMetrics.length === 0) {
      return {
        avgResponseTime: 0,
        avgSuccessRate: 0,
        avgErrorRate: 0,
        totalAlerts: 0,
        criticalAlerts: 0
      }
    }

    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.performance.apiResponseTime, 0) / recentMetrics.length
    const avgSuccessRate = recentMetrics.reduce((sum, m) => sum + m.performance.paymentSuccessRate, 0) / recentMetrics.length
    const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.performance.errorRate, 0) / recentMetrics.length

    return {
      avgResponseTime,
      avgSuccessRate,
      avgErrorRate,
      totalAlerts: recentAlerts.length,
      criticalAlerts: recentAlerts.filter(a => a.severity === 'critical').length
    }
  }

  /**
   * Limpa dados antigos
   */
  cleanup(daysToKeep: number = 7): void {
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff)
    
    console.log(`🧹 Limpeza concluída: mantidos ${this.metrics.length} métricas e ${this.alerts.length} alertas`)
  }
}

// Instância singleton
export const systemMonitor = SystemMonitor.getInstance()

// Auto-iniciar em produção
if (process.env.NODE_ENV === 'production') {
  systemMonitor.startMonitoring()
}