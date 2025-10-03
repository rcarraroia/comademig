import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import MonitoringDashboard from '@/components/monitoring/MonitoringDashboard'
import { ProductionValidator } from '@/lib/deployment/production-config'
import { systemMonitor } from '@/lib/monitoring/system-monitor'
import { 
  Activity, 
  Server, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Rocket,
  Shield,
  Zap,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

export default function MonitoringExample() {
  const [readinessReport, setReadinessReport] = useState<any>(null)
  const [connectivityTest, setConnectivityTest] = useState<any>(null)
  const [isTestingConnectivity, setIsTestingConnectivity] = useState(false)

  const generateReadinessReport = () => {
    const report = ProductionValidator.generateReadinessReport()
    setReadinessReport(report)
    
    if (report.ready) {
      toast.success('Sistema pronto para produção!')
    } else {
      toast.warning(`Sistema ${report.score}% pronto - verifique os requisitos`)
    }
  }

  const testConnectivity = async () => {
    setIsTestingConnectivity(true)
    try {
      const result = await ProductionValidator.checkExternalServices()
      setConnectivityTest(result)
      
      if (result.asaas && result.supabase) {
        toast.success('Conectividade com todos os serviços OK!')
      } else {
        toast.error('Problemas de conectividade detectados')
      }
    } catch (error) {
      toast.error('Erro ao testar conectividade')
    } finally {
      setIsTestingConnectivity(false)
    }
  }

  const startMonitoring = () => {
    systemMonitor.startMonitoring()
    toast.success('Monitoramento iniciado!')
  }

  const stopMonitoring = () => {
    systemMonitor.stopMonitoring()
    toast.info('Monitoramento parado')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Exemplo: Sistema de Monitoramento e Deploy
          </CardTitle>
          <CardDescription>
            Sistema completo de monitoramento, métricas de performance e validação para deploy em produção
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <h4 className="font-medium mb-2">📊 Monitoramento em Tempo Real</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Métricas de performance da API</li>
                <li>• Taxa de sucesso de pagamentos</li>
                <li>• Tempo de resposta de webhooks</li>
                <li>• Saúde dos serviços externos</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">🚨 Sistema de Alertas</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Alertas por severidade</li>
                <li>• Thresholds configuráveis</li>
                <li>• Notificações automáticas</li>
                <li>• Resolução de alertas</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">🔍 Validação de Deploy</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Checklist de prontidão</li>
                <li>• Validação de configurações</li>
                <li>• Teste de conectividade</li>
                <li>• Relatório de score</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">📈 Métricas Avançadas</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Gráficos de tendência</li>
                <li>• Análise de performance</li>
                <li>• Estatísticas históricas</li>
                <li>• Dashboards interativos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          <TabsTrigger value="readiness">Prontidão</TabsTrigger>
          <TabsTrigger value="connectivity">Conectividade</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring">
          <MonitoringDashboard />
        </TabsContent>

        <TabsContent value="readiness">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Verificação de Prontidão</CardTitle>
                <CardDescription>
                  Verifique se o sistema está pronto para deploy em produção
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={generateReadinessReport} className="w-full">
                  <Rocket className="h-4 w-4 mr-2" />
                  Gerar Relatório de Prontidão
                </Button>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Verificações Incluídas:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Variáveis de ambiente de produção</li>
                    <li>• Configuração de segurança</li>
                    <li>• Políticas RLS do banco de dados</li>
                    <li>• Configuração de webhooks</li>
                    <li>• Testes de integração</li>
                    <li>• Monitoramento e alertas</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Relatório de Prontidão</CardTitle>
                <CardDescription>
                  Status atual da prontidão para produção
                </CardDescription>
              </CardHeader>
              <CardContent>
                {readinessReport ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${readinessReport.ready ? 'text-green-600' : 'text-red-600'}`}>
                        {readinessReport.score}%
                      </div>
                      <p className="text-muted-foreground">
                        {readinessReport.ready ? 'Pronto para produção' : 'Não pronto para produção'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 border rounded">
                        <div className="text-2xl font-bold text-green-600">
                          {readinessReport.summary.completedRequiredItems}
                        </div>
                        <div className="text-sm text-muted-foreground">Obrigatórios OK</div>
                      </div>
                      <div className="p-3 border rounded">
                        <div className="text-2xl font-bold text-red-600">
                          {readinessReport.validation.errors.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Erros Críticos</div>
                      </div>
                    </div>

                    {readinessReport.validation.errors.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <h4 className="font-medium text-red-800 mb-2">Erros a Corrigir:</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {readinessReport.validation.errors.slice(0, 3).map((error: string, index: number) => (
                            <li key={index}>• {error}</li>
                          ))}
                          {readinessReport.validation.errors.length > 3 && (
                            <li>• ... e mais {readinessReport.validation.errors.length - 3} erros</li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-medium">Checklist por Categoria:</h4>
                      {readinessReport.checklist.map((category: any) => {
                        const completed = category.items.filter((item: any) => item.completed).length
                        const total = category.items.length
                        const percentage = Math.round((completed / total) * 100)
                        
                        return (
                          <div key={category.category} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{category.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{completed}/{total}</span>
                              <Badge variant={percentage === 100 ? 'default' : 'secondary'}>
                                {percentage}%
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Execute a verificação para ver o relatório</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="connectivity">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Teste de Conectividade</CardTitle>
                <CardDescription>
                  Teste a conectividade com serviços externos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={testConnectivity}
                  disabled={isTestingConnectivity}
                  className="w-full"
                >
                  {isTestingConnectivity ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      Testando Conectividade...
                    </>
                  ) : (
                    <>
                      <Server className="h-4 w-4 mr-2" />
                      Testar Conectividade
                    </>
                  )}
                </Button>

                <div className="p-4 bg-gray-50 border rounded-lg">
                  <h4 className="font-medium mb-2">Serviços Testados:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• API Asaas (autenticação e conectividade)</li>
                    <li>• Supabase (banco de dados e auth)</li>
                    <li>• Edge Functions (processamento)</li>
                    <li>• Webhooks (recebimento)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultado dos Testes</CardTitle>
                <CardDescription>
                  Status da conectividade com cada serviço
                </CardDescription>
              </CardHeader>
              <CardContent>
                {connectivityTest ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Server className="h-5 w-5" />
                        <span>API Asaas</span>
                      </div>
                      {connectivityTest.asaas ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Server className="h-5 w-5" />
                        <span>Supabase</span>
                      </div>
                      {connectivityTest.supabase ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>

                    {connectivityTest.errors.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <h4 className="font-medium text-red-800 mb-2">Erros Encontrados:</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {connectivityTest.errors.map((error: string, index: number) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="text-center">
                      <Badge 
                        variant={connectivityTest.asaas && connectivityTest.supabase ? 'default' : 'destructive'}
                        className="text-sm"
                      >
                        {connectivityTest.asaas && connectivityTest.supabase 
                          ? 'Todos os Serviços OK' 
                          : 'Problemas de Conectividade'
                        }
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Execute o teste para ver os resultados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="info">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Implementação Técnica</CardTitle>
                <CardDescription>
                  Detalhes sobre o sistema de monitoramento e deploy implementado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">🔧 Componentes Criados</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <code>SystemMonitor</code> - Coleta de métricas em tempo real</li>
                      <li>• <code>ProductionValidator</code> - Validação de prontidão</li>
                      <li>• <code>MonitoringDashboard</code> - Interface de monitoramento</li>
                      <li>• <code>AlertSystem</code> - Sistema de alertas automáticos</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">📊 Métricas Coletadas</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Tempo de resposta da API (ms)</li>
                      <li>• Taxa de sucesso de pagamentos (%)</li>
                      <li>• Taxa de erro do sistema (%)</li>
                      <li>• Throughput de requisições (req/min)</li>
                      <li>• Saúde dos serviços externos</li>
                      <li>• Utilização de recursos</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Checklist de Deploy para Produção</CardTitle>
                <CardDescription>
                  Itens essenciais para deploy seguro em produção
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Segurança
                    </h4>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        HTTPS configurado
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Tokens de webhook seguros
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Criptografia de dados sensíveis
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Políticas RLS ativas
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Performance
                    </h4>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Índices de banco otimizados
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Cache de permissões
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Retry automático configurado
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Monitoramento ativo
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Monitoramento
                    </h4>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Métricas em tempo real
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Alertas automáticos
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Logs de auditoria
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Dashboard de saúde
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Contingência
                    </h4>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Backup automático
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Plano de rollback
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Recuperação de falhas
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Métodos alternativos
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Controles de Monitoramento</CardTitle>
                <CardDescription>
                  Controle o sistema de monitoramento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button onClick={startMonitoring} variant="default">
                    <Activity className="h-4 w-4 mr-2" />
                    Iniciar Monitoramento
                  </Button>
                  <Button onClick={stopMonitoring} variant="outline">
                    <XCircle className="h-4 w-4 mr-2" />
                    Parar Monitoramento
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}