import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import SecurityDashboard from '@/components/admin/SecurityDashboard'
import { webhookValidator } from '@/lib/security/webhook-validator'
import { dataEncryption, sensitiveDataManager } from '@/lib/security/encryption'
import { auditLogger, AuditEventType, AuditSeverity, AuditHelpers } from '@/lib/security/audit-logger'
import { accessController, UserRole, Permission } from '@/lib/security/access-control'
import { 
  Shield, 
  Key, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Users,
  FileText,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'

export default function SecurityExample() {
  const [testData, setTestData] = useState({
    webhookPayload: '{"event":"PAYMENT_CONFIRMED","payment":{"id":"pay_123","value":100}}',
    webhookToken: 'test-webhook-token-123',
    sensitiveText: 'CPF: 123.456.789-00, Cartão: 1234 5678 9012 3456',
    encryptedData: '',
    decryptedData: '',
    userId: 'user-123',
    targetPermission: Permission.READ_PAYMENT
  })

  const [encryptionResult, setEncryptionResult] = useState<any>(null)
  const [webhookResult, setWebhookResult] = useState<any>(null)
  const [permissionResult, setPermissionResult] = useState<any>(null)

  // Teste de validação de webhook
  const testWebhookValidation = () => {
    const headers = {
      'asaas-access-token': testData.webhookToken,
      'content-type': 'application/json'
    }

    const result = webhookValidator.validateWebhook(testData.webhookPayload, headers)
    setWebhookResult(result)

    if (result.isValid) {
      toast.success('Webhook validado com sucesso!')
    } else {
      toast.error(`Falha na validação: ${result.error}`)
    }
  }

  // Teste de criptografia
  const testEncryption = () => {
    try {
      const encrypted = dataEncryption.encrypt(testData.sensitiveText)
      setEncryptionResult(encrypted)
      setTestData(prev => ({ 
        ...prev, 
        encryptedData: `${encrypted.encrypted}:${encrypted.iv}:${encrypted.tag}` 
      }))
      toast.success('Dados criptografados com sucesso!')
    } catch (error) {
      toast.error('Erro na criptografia')
    }
  }

  // Teste de descriptografia
  const testDecryption = () => {
    if (!encryptionResult) {
      toast.error('Primeiro criptografe alguns dados')
      return
    }

    try {
      const result = dataEncryption.decrypt(
        encryptionResult.encrypted,
        encryptionResult.iv,
        encryptionResult.tag
      )

      if (result.success) {
        setTestData(prev => ({ ...prev, decryptedData: result.data || '' }))
        toast.success('Dados descriptografados com sucesso!')
      } else {
        toast.error(`Erro na descriptografia: ${result.error}`)
      }
    } catch (error) {
      toast.error('Erro na descriptografia')
    }
  }

  // Teste de criptografia de dados sensíveis
  const testSensitiveDataEncryption = () => {
    try {
      const cardData = {
        number: '1234567890123456',
        holderName: 'João Silva',
        expiryMonth: '12',
        expiryYear: '2025'
      }

      const encrypted = sensitiveDataManager.encryptCreditCardData(cardData)
      toast.success('Dados do cartão criptografados (número mascarado)')
      
      // Mostrar resultado
      console.log('Dados criptografados:', encrypted)
    } catch (error) {
      toast.error('Erro ao criptografar dados do cartão')
    }
  }

  // Teste de auditoria
  const testAuditLogging = async () => {
    try {
      // Log de evento de pagamento
      await AuditHelpers.logPaymentCreated('pay_123', testData.userId, 150.00, 'PIX')
      
      // Log de acesso a dados sensíveis
      await AuditHelpers.logSensitiveDataAccess(testData.userId, 'credit_card', 'card_123')
      
      // Log de violação de segurança (exemplo)
      await AuditHelpers.logSecurityViolation(testData.userId, 'Tentativa de acesso não autorizado', {
        resource: 'admin_panel',
        ip: '192.168.1.100'
      })

      toast.success('Eventos de auditoria registrados!')
    } catch (error) {
      toast.error('Erro ao registrar eventos de auditoria')
    }
  }

  // Teste de controle de acesso
  const testAccessControl = async () => {
    try {
      const hasPermission = await accessController.hasPermission(
        testData.userId, 
        testData.targetPermission
      )

      setPermissionResult({
        userId: testData.userId,
        permission: testData.targetPermission,
        granted: hasPermission
      })

      if (hasPermission) {
        toast.success('Permissão concedida!')
      } else {
        toast.warning('Permissão negada!')
      }
    } catch (error) {
      toast.error('Erro ao verificar permissão')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Exemplo: Sistema de Segurança e Auditoria Completo
          </CardTitle>
          <CardDescription>
            Demonstração completa do sistema de segurança, criptografia, auditoria e controle de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <h4 className="font-medium mb-2">🔐 Validação de Webhooks</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Validação de token de autenticação</li>
                <li>• Verificação de assinatura HMAC</li>
                <li>• Proteção contra replay attacks</li>
                <li>• Comparação segura de tokens</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">🔒 Criptografia de Dados</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Criptografia AES-256-GCM</li>
                <li>• Mascaramento de dados sensíveis</li>
                <li>• Chaves derivadas com PBKDF2</li>
                <li>• Tokens seguros gerados</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">📋 Sistema de Auditoria</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Log estruturado de eventos</li>
                <li>• Classificação por severidade</li>
                <li>• Batch processing otimizado</li>
                <li>• Fallback para localStorage</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">👥 Controle de Acesso</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Sistema RBAC completo</li>
                <li>• Permissões granulares</li>
                <li>• Cache de permissões</li>
                <li>• Restrições por IP e horário</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="webhook" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          <TabsTrigger value="encryption">Criptografia</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="access">Acesso</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="webhook">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Teste de Validação de Webhook</CardTitle>
                <CardDescription>
                  Teste a validação de segurança de webhooks do Asaas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="webhook-payload">Payload do Webhook</Label>
                  <textarea
                    id="webhook-payload"
                    className="w-full h-24 p-2 border rounded"
                    value={testData.webhookPayload}
                    onChange={(e) => setTestData(prev => ({ 
                      ...prev, 
                      webhookPayload: e.target.value 
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="webhook-token">Token de Autenticação</Label>
                  <Input
                    id="webhook-token"
                    value={testData.webhookToken}
                    onChange={(e) => setTestData(prev => ({ 
                      ...prev, 
                      webhookToken: e.target.value 
                    }))}
                  />
                </div>

                <Button onClick={testWebhookValidation} className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Validar Webhook
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultado da Validação</CardTitle>
              </CardHeader>
              <CardContent>
                {webhookResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {webhookResult.isValid ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">
                        {webhookResult.isValid ? 'Válido' : 'Inválido'}
                      </span>
                    </div>

                    {webhookResult.error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-800">{webhookResult.error}</p>
                      </div>
                    )}

                    {webhookResult.timestamp && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Timestamp: {new Date(webhookResult.timestamp).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Execute o teste para ver o resultado</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="encryption">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Teste de Criptografia</CardTitle>
                <CardDescription>
                  Teste a criptografia e descriptografia de dados sensíveis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sensitive-text">Dados Sensíveis</Label>
                  <textarea
                    id="sensitive-text"
                    className="w-full h-20 p-2 border rounded"
                    value={testData.sensitiveText}
                    onChange={(e) => setTestData(prev => ({ 
                      ...prev, 
                      sensitiveText: e.target.value 
                    }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={testEncryption} className="flex-1">
                    <Lock className="h-4 w-4 mr-2" />
                    Criptografar
                  </Button>
                  <Button onClick={testDecryption} variant="outline" className="flex-1">
                    <Unlock className="h-4 w-4 mr-2" />
                    Descriptografar
                  </Button>
                </div>

                <Button onClick={testSensitiveDataEncryption} variant="outline" className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Testar Dados de Cartão
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultado da Criptografia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {testData.encryptedData && (
                  <div>
                    <Label>Dados Criptografados</Label>
                    <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                      {testData.encryptedData}
                    </div>
                  </div>
                )}

                {testData.decryptedData && (
                  <div>
                    <Label>Dados Descriptografados</Label>
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                      {testData.decryptedData}
                    </div>
                  </div>
                )}

                {encryptionResult && (
                  <div className="space-y-2">
                    <Label>Detalhes Técnicos</Label>
                    <div className="text-xs space-y-1">
                      <p><strong>IV:</strong> {encryptionResult.iv}</p>
                      <p><strong>Tag:</strong> {encryptionResult.tag}</p>
                      <p><strong>Algoritmo:</strong> AES-256-GCM</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Sistema de Auditoria</CardTitle>
              <CardDescription>
                Teste o registro e consulta de eventos de auditoria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="user-id">ID do Usuário</Label>
                <Input
                  id="user-id"
                  value={testData.userId}
                  onChange={(e) => setTestData(prev => ({ 
                    ...prev, 
                    userId: e.target.value 
                  }))}
                />
              </div>

              <Button onClick={testAuditLogging} className="w-full">
                <Activity className="h-4 w-4 mr-2" />
                Registrar Eventos de Teste
              </Button>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-medium text-blue-800 mb-2">Eventos que serão registrados:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Criação de pagamento PIX de R$ 150,00</li>
                  <li>• Acesso a dados sensíveis de cartão</li>
                  <li>• Violação de segurança (exemplo)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Teste de Controle de Acesso</CardTitle>
                <CardDescription>
                  Teste a verificação de permissões do sistema RBAC
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="test-user-id">ID do Usuário</Label>
                  <Input
                    id="test-user-id"
                    value={testData.userId}
                    onChange={(e) => setTestData(prev => ({ 
                      ...prev, 
                      userId: e.target.value 
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="permission">Permissão a Testar</Label>
                  <select
                    id="permission"
                    className="w-full p-2 border rounded"
                    value={testData.targetPermission}
                    onChange={(e) => setTestData(prev => ({ 
                      ...prev, 
                      targetPermission: e.target.value as Permission 
                    }))}
                  >
                    {Object.values(Permission).map(permission => (
                      <option key={permission} value={permission}>
                        {permission}
                      </option>
                    ))}
                  </select>
                </div>

                <Button onClick={testAccessControl} className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Verificar Permissão
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultado da Verificação</CardTitle>
              </CardHeader>
              <CardContent>
                {permissionResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {permissionResult.granted ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">
                        {permissionResult.granted ? 'Permissão Concedida' : 'Permissão Negada'}
                      </span>
                    </div>

                    <div className="text-sm space-y-1">
                      <p><strong>Usuário:</strong> {permissionResult.userId}</p>
                      <p><strong>Permissão:</strong> {permissionResult.permission}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Execute o teste para ver o resultado</p>
                )}

                <Separator className="my-4" />

                <div>
                  <h4 className="font-medium mb-2">Roles Disponíveis</h4>
                  <div className="space-y-2">
                    {Object.values(UserRole).map(role => (
                      <div key={role} className="flex items-center justify-between text-sm">
                        <span>{role}</span>
                        <Badge variant="outline">
                          {accessController.getPermissionsByRole(role).length} permissões
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <SecurityDashboard />
        </TabsContent>
      </Tabs>

      {/* Informações Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle>Implementação Técnica</CardTitle>
          <CardDescription>
            Detalhes sobre a arquitetura de segurança implementada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">🔧 Componentes Criados</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <code>WebhookValidator</code> - Validação de webhooks</li>
                <li>• <code>DataEncryption</code> - Criptografia AES-256-GCM</li>
                <li>• <code>SensitiveDataManager</code> - Dados sensíveis</li>
                <li>• <code>AuditLogger</code> - Sistema de auditoria</li>
                <li>• <code>AccessController</code> - Controle de acesso RBAC</li>
                <li>• <code>SecurityDashboard</code> - Interface de monitoramento</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">🛡️ Recursos de Segurança</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Validação de assinatura HMAC SHA-256</li>
                <li>• Proteção contra timing attacks</li>
                <li>• Criptografia com chaves derivadas PBKDF2</li>
                <li>• Mascaramento automático de dados sensíveis</li>
                <li>• Auditoria com batch processing</li>
                <li>• Cache de permissões com timeout</li>
                <li>• Restrições por IP e horário</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}