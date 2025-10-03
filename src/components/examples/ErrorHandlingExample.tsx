import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import ErrorMonitoring from '@/components/admin/ErrorMonitoring'
import AlternativePaymentSuggestions from '@/components/payments/AlternativePaymentSuggestions'
import { useErrorRecovery } from '@/hooks/useErrorRecovery'
import { asaasClient } from '@/lib/asaas/client'
import { handleAsaasError, withAsaasRetry } from '@/lib/asaas/error-handler'
import { 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Zap,
  Shield,
  TrendingUp,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

export default function ErrorHandlingExample() {
  const [isTestingErrors, setIsTestingErrors] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])
  const [showAlternatives, setShowAlternatives] = useState(false)
  
  const { 
    systemHealth, 
    recoveryActions, 
    isRecovering,
    executeRecoveryAction,
    checkSystemHealth 
  } = useErrorRecovery()

  // Simular diferentes tipos de erro para demonstração
  const simulateError = async (errorType: string) => {
    setIsTestingErrors(true)
    
    try {
      let error: any
      
      switch (errorType) {
        case 'network':
          error = new Error('Network timeout')
          error.request = { timeout: true }
          break
          
        case 'validation':
          error = {
            response: {
              status: 400,
              data: {
                errors: [{
                  code: 'invalid_cpf',
                  description: 'CPF inválido'
                }]
              }
            }
          }
          break
          
        case 'authentication':
          error = {
            response: {
              status: 401,
              data: {
                errors: [{
                  code: 'invalid_api_key',
                  description: 'Chave de API inválida'
                }]
              }
            }
          }
          break
          
        case 'rate_limit':
          error = {
            response: {
              status: 429,
              data: {
                errors: [{
                  code: 'rate_limit_exceeded',
                  description: 'Muitas requisições'
                }]
              }
            }
          }
          break
          
        case 'server_error':
          error = {
            response: {
              status: 500,
              data: {
                errors: [{
                  code: 'internal_server_error',
                  description: 'Erro interno do servidor'
                }]
              }
            }
          }
          break
          
        default:
          error = new Error('Erro desconhecido')
      }

      // Processar erro com o sistema de tratamento
      const processedError = handleAsaasError(error, {
        function: 'ErrorHandlingExample.simulateError',
        userId: 'demo-user'
      })

      setTestResults(prev => [...prev, {
        type: errorType,
        error: processedError,
        timestamp: new Date()
      }])

    } catch (error) {
      console.error('Error in simulation:', error)
    } finally {
      setIsTestingErrors(false)
    }
  }

  // Testar retry automático
  const testRetryMechanism = async () => {
    setIsTestingErrors(true)
    
    try {
      let attemptCount = 0
      
      const result = await withAsaasRetry(async () => {
        attemptCount++
        
        if (attemptCount < 3) {
          // Simular falha nas primeiras tentativas
          const error = {
            response: {
              status: 503,
              data: {
                errors: [{
                  code: 'service_unavailable',
                  description: 'Serviço temporariamente indisponível'
                }]
              }
            }
          }
          throw error
        }
        
        // Sucesso na terceira tentativa
        return { success: true, data: { message: 'Sucesso após retry!' } }
      }, {
        function: 'ErrorHandlingExample.testRetry'
      })

      toast.success(`Retry bem-sucedido após ${attemptCount} tentativas!`)
      
      setTestResults(prev => [...prev, {
        type: 'retry_success',
        attempts: attemptCount,
        result,
        timestamp: new Date()
      }])

    } catch (error) {
      toast.error('Falha no teste de retry')
    } finally {
      setIsTestingErrors(false)
    }
  }

  // Testar conexão real com Asaas
  const testRealConnection = async () => {
    setIsTestingErrors(true)
    
    try {
      const result = await asaasClient.testConnection()
      
      setTestResults(prev => [...prev, {
        type: 'real_connection',
        result,
        timestamp: new Date()
      }])

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }

    } catch (error) {
      toast.error('Erro ao testar conexão')
    } finally {
      setIsTestingErrors(false)
    }
  }

  const handleMethodSelect = (methodId: string) => {
    toast.success(`Método selecionado: ${methodId}`)
    setShowAlternatives(false)
  }

  const getHealthStatus = (isHealthy: boolean) => {
    return isHealthy ? (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Saudável
      </Badge>
    ) : (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Problema
      </Badge>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Exemplo: Sistema de Tratamento Robusto de Erros
          </CardTitle>
          <CardDescription>
            Demonstração completa do sistema de classificação, retry automático e recuperação de erros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <h4 className="font-medium mb-2">🔍 Classificação Inteligente</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Identificação automática do tipo de erro</li>
                <li>• Classificação por severidade</li>
                <li>• Mensagens amigáveis para usuários</li>
                <li>• Contexto detalhado para desenvolvedores</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">🔄 Retry Automático</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Backoff exponencial inteligente</li>
                <li>• Retry apenas para erros temporários</li>
                <li>• Configuração flexível por operação</li>
                <li>• Prevenção de loops infinitos</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">⚡ Recuperação Automática</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Detecção proativa de problemas</li>
                <li>• Sugestões de métodos alternativos</li>
                <li>• Reprocessamento automático</li>
                <li>• Monitoramento de saúde do sistema</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="testing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="testing">Testes</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          <TabsTrigger value="recovery">Recuperação</TabsTrigger>
          <TabsTrigger value="alternatives">Alternativas</TabsTrigger>
          <TabsTrigger value="health">Saúde</TabsTrigger>
        </TabsList>

        <TabsContent value="testing">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Simulação de Erros</CardTitle>
                <CardDescription>
                  Teste diferentes tipos de erro para ver como são tratados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => simulateError('network')}
                  disabled={isTestingErrors}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Erro de Rede
                </Button>
                
                <Button
                  onClick={() => simulateError('validation')}
                  disabled={isTestingErrors}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Erro de Validação
                </Button>
                
                <Button
                  onClick={() => simulateError('authentication')}
                  disabled={isTestingErrors}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Erro de Autenticação
                </Button>
                
                <Button
                  onClick={() => simulateError('rate_limit')}
                  disabled={isTestingErrors}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Rate Limit
                </Button>
                
                <Button
                  onClick={() => simulateError('server_error')}
                  disabled={isTestingErrors}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Erro de Servidor
                </Button>

                <Separator />

                <Button
                  onClick={testRetryMechanism}
                  disabled={isTestingErrors}
                  className="w-full"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isTestingErrors ? 'animate-spin' : ''}`} />
                  Testar Retry Automático
                </Button>

                <Button
                  onClick={testRealConnection}
                  disabled={isTestingErrors}
                  variant="secondary"
                  className="w-full"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Testar Conexão Real
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultados dos Testes</CardTitle>
                <CardDescription>
                  Histórico dos testes executados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testResults.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {testResults.slice(-10).reverse().map((result, index) => (
                      <div key={index} className="border rounded p-3 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{result.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {result.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        
                        {result.error && (
                          <div>
                            <p className="font-medium">{result.error.code}</p>
                            <p className="text-muted-foreground">{result.error.userMessage}</p>
                            <p className="text-xs mt-1">
                              Severidade: {result.error.severity} | 
                              Retryable: {result.error.retryable ? 'Sim' : 'Não'}
                            </p>
                          </div>
                        )}
                        
                        {result.attempts && (
                          <p>Tentativas: {result.attempts}</p>
                        )}
                        
                        {result.result && (
                          <p className="text-green-600">
                            {result.result.message || 'Sucesso'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum teste executado ainda
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring">
          <ErrorMonitoring />
        </TabsContent>

        <TabsContent value="recovery">
          <Card>
            <CardHeader>
              <CardTitle>Sistema de Recuperação Automática</CardTitle>
              <CardDescription>
                Ações de recuperação disponíveis e status do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recoveryActions.length > 0 ? (
                <div className="space-y-4">
                  {recoveryActions.map((action) => (
                    <div key={action.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{action.description}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            action.priority === 'high' ? 'destructive' :
                            action.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {action.priority}
                          </Badge>
                          {action.automated && (
                            <Badge variant="outline">Automático</Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        Tentativas: {action.attempts}/{action.maxAttempts}
                      </p>
                      
                      <Button
                        onClick={() => executeRecoveryAction(action.id)}
                        disabled={isRecovering || action.attempts >= action.maxAttempts}
                        size="sm"
                      >
                        {isRecovering ? 'Executando...' : 'Executar Ação'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma ação de recuperação necessária
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    O sistema está funcionando normalmente
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alternatives">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento Alternativos</CardTitle>
              <CardDescription>
                Demonstração de sugestões quando há falhas no pagamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showAlternatives ? (
                <div className="text-center py-8">
                  <Button onClick={() => setShowAlternatives(true)}>
                    Simular Falha no Pagamento
                  </Button>
                </div>
              ) : (
                <AlternativePaymentSuggestions
                  failedMethod="credit_card"
                  errorType="credit_card_declined"
                  onMethodSelect={handleMethodSelect}
                  currentValue={150.00}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>Saúde do Sistema</CardTitle>
              <CardDescription>
                Status em tempo real dos componentes do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemHealth ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Conexão Asaas</span>
                    {getHealthStatus(systemHealth.asaasConnection)}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Conexão Supabase</span>
                    {getHealthStatus(systemHealth.supabaseConnection)}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Processamento de Webhooks</span>
                    {getHealthStatus(systemHealth.webhookProcessing)}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Processamento de Pagamentos</span>
                    {getHealthStatus(systemHealth.paymentProcessing)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                  <p className="text-muted-foreground">Verificando saúde do sistema...</p>
                </div>
              )}
              
              <div className="mt-6 text-center">
                <Button onClick={() => checkSystemHealth()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}