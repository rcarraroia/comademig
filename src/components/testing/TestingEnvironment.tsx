import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SANDBOX_CONFIG, getTestDataByScenario, TEST_VALUES, generateRandomTestData } from '@/lib/testing/sandbox-config'
import { webhookSimulator } from '@/lib/testing/webhook-simulator'
import { runIntegrationTests } from '@/lib/testing/integration-tests'
import { 
  TestTube, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  CreditCard,
  FileText,
  QrCode,
  Users,
  AlertTriangle,
  Download,
  Copy
} from 'lucide-react'
import { toast } from 'sonner'

export default function TestingEnvironment() {
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [webhookResults, setWebhookResults] = useState<any[]>([])
  const [selectedScenario, setSelectedScenario] = useState('success')
  const [customPaymentId, setCustomPaymentId] = useState('pay_test_' + Date.now())

  const runAllTests = async () => {
    setIsRunningTests(true)
    try {
      const results = await runIntegrationTests()
      setTestResults(results)
      
      if (results.failedTests === 0) {
        toast.success(`Todos os ${results.totalTests} testes passaram!`)
      } else {
        toast.warning(`${results.passedTests}/${results.totalTests} testes passaram`)
      }
    } catch (error) {
      toast.error('Erro ao executar testes')
    } finally {
      setIsRunningTests(false)
    }
  }

  const simulateWebhook = async (eventType: string) => {
    try {
      let result
      
      switch (eventType) {
        case 'PAYMENT_CONFIRMED':
          result = await webhookSimulator.simulatePaymentConfirmed(customPaymentId)
          break
        case 'PAYMENT_RECEIVED':
          result = await webhookSimulator.simulatePaymentReceived(customPaymentId)
          break
        case 'PAYMENT_OVERDUE':
          result = await webhookSimulator.simulatePaymentOverdue(customPaymentId)
          break
        case 'PAYMENT_REFUNDED':
          result = await webhookSimulator.simulatePaymentRefunded(customPaymentId)
          break
        default:
          throw new Error('Tipo de evento não suportado')
      }

      setWebhookResults(prev => [{
        eventType,
        paymentId: customPaymentId,
        result,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]) // Manter apenas os últimos 10

      if (result.success) {
        toast.success(`Webhook ${eventType} simulado com sucesso!`)
      } else {
        toast.error(`Falha na simulação: ${result.error}`)
      }
    } catch (error) {
      toast.error('Erro ao simular webhook')
    }
  }

  const copyTestData = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    toast.success('Dados copiados para a área de transferência')
  }

  const generateNewPaymentId = () => {
    setCustomPaymentId('pay_test_' + Date.now())
  }

  const testData = getTestDataByScenario(selectedScenario)
  const randomData = generateRandomTestData()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Ambiente de Testes - Sandbox Asaas
          </CardTitle>
          <CardDescription>
            Ambiente completo para testes de integração com dados simulados e webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h4 className="font-medium mb-2">🧪 Testes Automatizados</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Testes de Edge Functions</li>
                <li>• Fluxos completos de pagamento</li>
                <li>• Cenários de falha e recuperação</li>
                <li>• Validação de webhooks</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">📋 Dados de Teste</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• CPFs e cartões válidos para sandbox</li>
                <li>• Cenários de sucesso e falha</li>
                <li>• Valores pré-configurados</li>
                <li>• Endereços e telefones de teste</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">🔄 Simulação de Webhooks</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Eventos de pagamento confirmado</li>
                <li>• Pagamentos vencidos e estornados</li>
                <li>• Teste de retry automático</li>
                <li>• Validação de payload</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">📊 Relatórios</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Resultados detalhados de testes</li>
                <li>• Tempo de execução</li>
                <li>• Taxa de sucesso</li>
                <li>• Logs de erro detalhados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tests">Testes Automatizados</TabsTrigger>
          <TabsTrigger value="webhooks">Simulação de Webhooks</TabsTrigger>
          <TabsTrigger value="data">Dados de Teste</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
        </TabsList>

        <TabsContent value="tests">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Executar Testes de Integração</CardTitle>
                <CardDescription>
                  Execute todos os testes automatizados do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={runAllTests}
                  disabled={isRunningTests}
                  className="w-full"
                  size="lg"
                >
                  {isRunningTests ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Executando Testes...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Executar Todos os Testes
                    </>
                  )}
                </Button>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Testes Incluídos:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Criação de clientes (sucesso e falha)</li>
                    <li>• Pagamentos PIX com QR Code</li>
                    <li>• Processamento de cartão (aprovado/recusado)</li>
                    <li>• Geração de boletos bancários</li>
                    <li>• Processamento de webhooks</li>
                    <li>• Configuração de splits</li>
                    <li>• Fluxos completos de pagamento</li>
                    <li>• Cenários de falha e retry</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultados dos Testes</CardTitle>
                <CardDescription>
                  Relatório detalhado da execução dos testes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testResults ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <div className="text-2xl font-bold text-green-600">
                          {testResults.passedTests}
                        </div>
                        <div className="text-sm text-green-700">Passou</div>
                      </div>
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <div className="text-2xl font-bold text-red-600">
                          {testResults.failedTests}
                        </div>
                        <div className="text-sm text-red-700">Falhou</div>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <div className="text-2xl font-bold text-blue-600">
                          {testResults.totalDuration}ms
                        </div>
                        <div className="text-sm text-blue-700">Tempo Total</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {testResults.tests.map((test: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            {test.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">{test.testName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{test.duration}ms</Badge>
                            {test.error && (
                              <Badge variant="destructive" className="text-xs">
                                Erro
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Execute os testes para ver os resultados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="webhooks">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Simulador de Webhooks</CardTitle>
                <CardDescription>
                  Simule diferentes eventos de webhook do Asaas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="payment-id">ID do Pagamento</Label>
                  <div className="flex gap-2">
                    <Input
                      id="payment-id"
                      value={customPaymentId}
                      onChange={(e) => setCustomPaymentId(e.target.value)}
                    />
                    <Button variant="outline" onClick={generateNewPaymentId}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => simulateWebhook('PAYMENT_CONFIRMED')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Confirmado
                  </Button>
                  
                  <Button 
                    onClick={() => simulateWebhook('PAYMENT_RECEIVED')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Zap className="h-4 w-4 text-blue-500" />
                    Recebido
                  </Button>
                  
                  <Button 
                    onClick={() => simulateWebhook('PAYMENT_OVERDUE')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4 text-yellow-500" />
                    Vencido
                  </Button>
                  
                  <Button 
                    onClick={() => simulateWebhook('PAYMENT_REFUNDED')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                    Estornado
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Webhooks</CardTitle>
                <CardDescription>
                  Últimos webhooks simulados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {webhookResults.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {webhookResults.map((webhook, index) => (
                      <div key={index} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={webhook.result.success ? 'default' : 'destructive'}>
                            {webhook.eventType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {webhook.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <p><strong>Payment ID:</strong> {webhook.paymentId}</p>
                          <p><strong>Status:</strong> {webhook.result.success ? 'Sucesso' : 'Falha'}</p>
                          <p><strong>Tempo:</strong> {webhook.result.executionTime}ms</p>
                          {webhook.result.error && (
                            <p className="text-red-600"><strong>Erro:</strong> {webhook.result.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum webhook simulado ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados de Teste por Cenário</CardTitle>
                <CardDescription>
                  Dados pré-configurados para diferentes cenários de teste
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="scenario">Cenário de Teste</Label>
                  <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="success">Sucesso</SelectItem>
                      <SelectItem value="validation_error">Erro de Validação</SelectItem>
                      <SelectItem value="payment_failure">Falha no Pagamento</SelectItem>
                      <SelectItem value="timeout">Timeout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Cliente de Teste</h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyTestData(testData.customer)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded text-sm space-y-1">
                      <p><strong>Nome:</strong> {testData.customer.name}</p>
                      <p><strong>Email:</strong> {testData.customer.email}</p>
                      <p><strong>CPF:</strong> {testData.customer.cpfCnpj}</p>
                      <p><strong>Telefone:</strong> {testData.customer.phone}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Cartão de Teste</h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyTestData(SANDBOX_CONFIG.testData.creditCards.find(c => c.scenario === selectedScenario))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {SANDBOX_CONFIG.testData.creditCards
                      .filter(c => c.scenario === selectedScenario)
                      .map((card, index) => (
                        <div key={index} className="p-3 bg-muted rounded text-sm space-y-1">
                          <p><strong>Número:</strong> {card.number}</p>
                          <p><strong>Nome:</strong> {card.holderName}</p>
                          <p><strong>Validade:</strong> {card.expiryMonth}/{card.expiryYear}</p>
                          <p><strong>CVV:</strong> {card.cvv}</p>
                          <p><strong>Bandeira:</strong> {card.brand}</p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valores e Configurações</CardTitle>
                <CardDescription>
                  Valores de teste e configurações do sandbox
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Valores Aprovados</h4>
                  <div className="flex flex-wrap gap-2">
                    {TEST_VALUES.APPROVED_VALUES.map((value, index) => (
                      <Badge key={index} variant="outline" className="text-green-600">
                        R$ {value.toFixed(2)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Valores Recusados</h4>
                  <div className="flex flex-wrap gap-2">
                    {TEST_VALUES.DECLINED_VALUES.map((value, index) => (
                      <Badge key={index} variant="outline" className="text-red-600">
                        R$ {value.toFixed(2)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Chaves PIX de Teste</h4>
                  <div className="space-y-1">
                    {SANDBOX_CONFIG.testData.pixKeys.slice(0, 4).map((key, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm font-mono">
                        {key}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Configuração do Sandbox</h4>
                  <div className="p-3 bg-muted rounded text-sm space-y-1">
                    <p><strong>Ambiente:</strong> {SANDBOX_CONFIG.environment}</p>
                    <p><strong>Base URL:</strong> {SANDBOX_CONFIG.baseUrl}</p>
                    <p><strong>Webhook Token:</strong> {SANDBOX_CONFIG.webhookToken.substring(0, 20)}...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Ambiente de Testes</CardTitle>
              <CardDescription>
                Configurações e instruções para o ambiente sandbox
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Variáveis de Ambiente</h4>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 bg-muted rounded font-mono">
                      VITE_ASAAS_ENVIRONMENT=sandbox
                    </div>
                    <div className="p-2 bg-muted rounded font-mono">
                      VITE_ASAAS_API_KEY=sandbox_key
                    </div>
                    <div className="p-2 bg-muted rounded font-mono">
                      VITE_ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
                    </div>
                    <div className="p-2 bg-muted rounded font-mono">
                      VITE_ASAAS_WEBHOOK_TOKEN=sandbox_token
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Instruções de Uso</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Configure as variáveis de ambiente para sandbox</li>
                    <li>• Use apenas os dados de teste fornecidos</li>
                    <li>• Execute os testes automatizados regularmente</li>
                    <li>• Simule webhooks para testar fluxos completos</li>
                    <li>• Monitore os logs de erro durante os testes</li>
                    <li>• Valide todos os cenários antes do deploy</li>
                  </ul>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Cenários de Teste Disponíveis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-green-600 mb-2">Cenários de Sucesso</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Pagamentos PIX aprovados</li>
                      <li>• Cartões de crédito aprovados</li>
                      <li>• Boletos gerados com sucesso</li>
                      <li>• Webhooks processados corretamente</li>
                      <li>• Splits configurados e processados</li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium text-red-600 mb-2">Cenários de Falha</h5>
                    <ul className="text-sm space-y-1">
                      <li>• Dados inválidos (CPF, email, etc.)</li>
                      <li>• Cartões recusados ou vencidos</li>
                      <li>• Timeouts de rede</li>
                      <li>• Webhooks com falha</li>
                      <li>• Valores fora dos limites</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}