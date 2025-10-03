import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { systemMonitor } from '@/lib/monitoring/system-monitor'
import { ProductionValidator } from '@/lib/deployment/production-config'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Users,
  Server,
  RefreshCw,
  Bell,
  BellOff
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [readinessReport, setReadinessReport] = useState<any>(null)

  useEffect(() => {
    // Carregar dados iniciais
    loadMonitoringData()
    
    // Gerar relatório de prontidão
    const report = ProductionValidator.generateReadinessReport()
    setReadinessReport(report)

    // Atualizar dados a cada 30 segundos
    const interval = setInterval(loadMonitoringData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadMonitoringData = () => {
    const recentMetrics = systemMonitor.getRecentMetrics(20)
    const activeAlerts = systemMonitor.getActiveAlerts()
    
    setMetrics(recentMetrics)
    setAlerts(activeAlerts)
  }

  const toggleMonitoring = () => {
    if (isMonitoring) {
      systemMonitor.stopMonitoring()
    } else {
      systemMonitor.startMonitoring()
    }
    setIsMonitoring(!isMonitoring)
  }

  const resolveAlert = (alertId: string) => {
    systemMonitor.resolveAlert(alertId)
    loadMonitoringData()
  }

  const getHealthIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'secondary' as const,
      medium: 'default' as const,
      high: 'destructive' as const,
      critical: 'destructive' as const
    }

    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'secondary'}>
        {severity.toUpperCase()}
      </Badge>
    )
  }

  const formatChartData = () => {
    return metrics.map((metric, index) => ({
      time: index,
      responseTime: metric.performance.apiResponseTime,
      successRate: metric.performance.paymentSuccessRate,
      errorRate: metric.performance.errorRate,
      throughput: metric.performance.throughput
    }))
  }

  const latestMetric = metrics[metrics.length - 1]
  const performanceStats = systemMonitor.getPerformanceStats(24)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Monitoramento</h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real do sistema e métricas de performance
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            size="sm"
            onClick={toggleMonitoring}
          >
            {isMonitoring ? (
              <>
                <BellOff className="h-4 w-4 mr-2" />
                Parar Monitoramento
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Iniciar Monitoramento
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadMonitoringData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas em Tempo Real */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestMetric ? `${latestMetric.performance.apiResponseTime.toFixed(0)}ms` : '0ms'}
            </div>
            <p className="text-xs text-muted-foreground">
              Média: {performanceStats.avgResponseTime.toFixed(0)}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {latestMetric ? `${latestMetric.performance.paymentSuccessRate.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Média: {performanceStats.avgSuccessRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {latestMetric ? `${latestMetric.performance.errorRate.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Média: {performanceStats.avgErrorRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestMetric ? latestMetric.resources.activeUsers : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Fila: {latestMetric ? latestMetric.resources.processingQueue : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="health">Saúde do Sistema</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="readiness">Prontidão</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tempo de Resposta</CardTitle>
                <CardDescription>Tempo de resposta da API em milissegundos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="responseTime" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taxa de Sucesso vs Erro</CardTitle>
                <CardDescription>Porcentagem de operações bem-sucedidas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formatChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="successRate" 
                        stackId="1"
                        stroke="#22c55e" 
                        fill="#22c55e"
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="errorRate" 
                        stackId="2"
                        stroke="#ef4444" 
                        fill="#ef4444"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status dos Serviços</CardTitle>
                <CardDescription>Conectividade com serviços externos</CardDescription>
              </CardHeader>
              <CardContent>
                {latestMetric ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Server className="h-5 w-5" />
                        <span>API Asaas</span>
                      </div>
                      {getHealthIcon(latestMetric.health.asaasConnection)}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Server className="h-5 w-5" />
                        <span>Supabase</span>
                      </div>
                      {getHealthIcon(latestMetric.health.supabaseConnection)}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5" />
                        <span>Processamento de Webhooks</span>
                      </div>
                      {getHealthIcon(latestMetric.health.webhookProcessing)}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5" />
                        <span>Processamento de Pagamentos</span>
                      </div>
                      {getHealthIcon(latestMetric.health.paymentProcessing)}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum dado de saúde disponível
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recursos do Sistema</CardTitle>
                <CardDescription>Utilização de recursos em tempo real</CardDescription>
              </CardHeader>
              <CardContent>
                {latestMetric ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Usuários Ativos</span>
                        <span className="font-medium">{latestMetric.resources.activeUsers}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((latestMetric.resources.activeUsers / 100) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Pagamentos Pendentes</span>
                        <span className="font-medium">{latestMetric.resources.pendingPayments}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((latestMetric.resources.pendingPayments / 50) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Fila de Processamento</span>
                        <span className="font-medium">{latestMetric.resources.processingQueue}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((latestMetric.resources.processingQueue / 20) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {latestMetric.resources.memoryUsage && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Uso de Memória</span>
                          <span className="font-medium">{latestMetric.resources.memoryUsage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${latestMetric.resources.memoryUsage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum dado de recursos disponível
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Ativos</CardTitle>
              <CardDescription>
                Alertas que requerem atenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{alert.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(alert.severity)}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolver
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.message}
                      </p>
                      
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum alerta ativo</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    O sistema está funcionando normalmente
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="readiness">
          <Card>
            <CardHeader>
              <CardTitle>Prontidão para Produção</CardTitle>
              <CardDescription>
                Verificação de configurações e requisitos para deploy
              </CardDescription>
            </CardHeader>
            <CardContent>
              {readinessReport ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${readinessReport.ready ? 'text-green-600' : 'text-red-600'}`}>
                      {readinessReport.score}%
                    </div>
                    <p className="text-muted-foreground">
                      {readinessReport.ready ? 'Pronto para produção' : 'Não pronto para produção'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold">{readinessReport.summary.completedItems}</div>
                      <div className="text-sm text-muted-foreground">Itens Completos</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold">{readinessReport.summary.totalItems}</div>
                      <div className="text-sm text-muted-foreground">Total de Itens</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold text-red-600">{readinessReport.validation.errors.length}</div>
                      <div className="text-sm text-muted-foreground">Erros</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold text-yellow-600">{readinessReport.validation.warnings.length}</div>
                      <div className="text-sm text-muted-foreground">Avisos</div>
                    </div>
                  </div>

                  {readinessReport.validation.errors.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Erros Críticos</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {readinessReport.validation.errors.map((error: string, index: number) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {readinessReport.validation.warnings.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">Avisos</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {readinessReport.validation.warnings.map((warning: string, index: number) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Carregando relatório de prontidão...
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}