import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { auditLogger, AuditEventType, AuditSeverity } from '@/lib/security/audit-logger'
import { accessController, UserRole, Permission } from '@/lib/security/access-control'
import { webhookValidator } from '@/lib/security/webhook-validator'
import { generateSecureToken } from '@/lib/security/encryption'
import { 
  Shield, 
  Key, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Download,
  Users,
  Lock,
  Unlock,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function SecurityDashboard() {
  const [auditStats, setAuditStats] = useState<any>(null)
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [securitySettings, setSecuritySettings] = useState({
    webhookToken: '',
    encryptionEnabled: true,
    auditRetentionDays: 90,
    maxLoginAttempts: 5,
    sessionTimeout: 30
  })
  const [showWebhookToken, setShowWebhookToken] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadSecurityData()
  }, [])

  const loadSecurityData = async () => {
    setIsLoading(true)
    try {
      // Carregar estatísticas de auditoria
      const stats = await auditLogger.getAuditStats(30)
      setAuditStats(stats)

      // Carregar eventos recentes
      const events = await auditLogger.queryEvents({
        limit: 20,
        severity: [AuditSeverity.WARNING, AuditSeverity.ERROR, AuditSeverity.CRITICAL]
      })
      setRecentEvents(events)

    } catch (error) {
      console.error('Error loading security data:', error)
      toast.error('Erro ao carregar dados de segurança')
    } finally {
      setIsLoading(false)
    }
  }

  const generateNewWebhookToken = () => {
    const newToken = generateSecureToken(32)
    setSecuritySettings(prev => ({ ...prev, webhookToken: newToken }))
    toast.success('Novo token gerado! Lembre-se de atualizar a configuração no Asaas.')
  }

  const copyTokenToClipboard = () => {
    navigator.clipboard.writeText(securitySettings.webhookToken)
    toast.success('Token copiado para a área de transferência')
  }

  const testWebhookSecurity = () => {
    const testPayload = JSON.stringify({ test: true, timestamp: Date.now() })
    const testHeaders = {
      'asaas-access-token': securitySettings.webhookToken,
      'content-type': 'application/json'
    }

    const result = webhookValidator.validateWebhook(testPayload, testHeaders)
    
    if (result.isValid) {
      toast.success('Validação de webhook bem-sucedida!')
    } else {
      toast.error(`Falha na validação: ${result.error}`)
    }
  }

  const exportAuditLogs = async () => {
    try {
      const events = await auditLogger.queryEvents({
        limit: 1000,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 dias
      })

      const csvContent = [
        'Timestamp,Event Type,Severity,User ID,Action,Success,Error Message',
        ...events.map(event => 
          `${event.timestamp},${event.event_type},${event.severity},${event.user_id || ''},${event.action},${event.success},${event.error_message || ''}`
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Logs de auditoria exportados com sucesso!')
    } catch (error) {
      toast.error('Erro ao exportar logs de auditoria')
    }
  }

  const getSeverityIcon = (severity: AuditSeverity) => {
    switch (severity) {
      case AuditSeverity.INFO:
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case AuditSeverity.WARNING:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case AuditSeverity.ERROR:
        return <XCircle className="h-4 w-4 text-red-500" />
      case AuditSeverity.CRITICAL:
        return <Shield className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityBadge = (severity: AuditSeverity) => {
    const variants = {
      [AuditSeverity.INFO]: 'secondary' as const,
      [AuditSeverity.WARNING]: 'default' as const,
      [AuditSeverity.ERROR]: 'destructive' as const,
      [AuditSeverity.CRITICAL]: 'destructive' as const
    }

    return (
      <Badge variant={variants[severity]} className="flex items-center gap-1">
        {getSeverityIcon(severity)}
        {severity.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Segurança</h1>
          <p className="text-muted-foreground">
            Monitoramento de segurança, auditoria e controle de acesso
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSecurityData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAuditLogs}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Logs
          </Button>
        </div>
      </div>

      {/* Resumo de Segurança */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos de Auditoria</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditStats?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Críticos</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {auditStats?.criticalEvents || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {auditStats?.successRate?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Operações bem-sucedidas
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
              {Object.keys(auditStats?.eventsByType || {}).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Com atividade recente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Detalhes */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Eventos Recentes</TabsTrigger>
          <TabsTrigger value="webhook">Segurança de Webhook</TabsTrigger>
          <TabsTrigger value="permissions">Controle de Acesso</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Eventos de Segurança Recentes</CardTitle>
              <CardDescription>
                Eventos críticos, erros e avisos dos últimos dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentEvents.length > 0 ? (
                <div className="space-y-4">
                  {recentEvents.map((event, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{event.event_type}</span>
                        </div>
                        {getSeverityBadge(event.severity)}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {event.action}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="text-muted-foreground">Usuário</p>
                          <p className="font-medium">{event.user_id || 'Sistema'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Sucesso</p>
                          <p className="font-medium">{event.success ? 'Sim' : 'Não'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">IP</p>
                          <p className="font-medium">{event.ip_address || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Quando</p>
                          <p className="font-medium">
                            {formatDistanceToNow(new Date(event.timestamp), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                        </div>
                      </div>

                      {event.error_message && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                          <p className="text-red-800">{event.error_message}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum evento de segurança recente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook">
          <Card>
            <CardHeader>
              <CardTitle>Segurança de Webhooks</CardTitle>
              <CardDescription>
                Configuração e validação de segurança para webhooks do Asaas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="webhook-token">Token de Webhook</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input
                        id="webhook-token"
                        type={showWebhookToken ? 'text' : 'password'}
                        value={securitySettings.webhookToken}
                        onChange={(e) => setSecuritySettings(prev => ({ 
                          ...prev, 
                          webhookToken: e.target.value 
                        }))}
                        placeholder="Token de autenticação do webhook"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowWebhookToken(!showWebhookToken)}
                      >
                        {showWebhookToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={copyTokenToClipboard}
                      disabled={!securitySettings.webhookToken}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={generateNewWebhookToken} variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Gerar Novo Token
                  </Button>
                  <Button onClick={testWebhookSecurity} variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Testar Validação
                  </Button>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Importante</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Configure este token no painel do Asaas para validação de webhooks</li>
                    <li>• Mantenha o token seguro e não o compartilhe</li>
                    <li>• Regenere o token periodicamente por segurança</li>
                    <li>• Teste a validação após qualquer alteração</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Acesso</CardTitle>
              <CardDescription>
                Gerenciamento de roles e permissões do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Roles Disponíveis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.values(UserRole).map((role) => (
                      <div key={role} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{role}</span>
                          <Badge variant="outline">
                            {accessController.getPermissionsByRole(role).length} permissões
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {role === UserRole.SUPER_ADMIN && 'Acesso total ao sistema'}
                          {role === UserRole.ADMIN && 'Administração geral'}
                          {role === UserRole.MODERATOR && 'Moderação e suporte'}
                          {role === UserRole.AFFILIATE && 'Gestão de afiliados'}
                          {role === UserRole.MEMBER && 'Usuário padrão'}
                          {role === UserRole.GUEST && 'Acesso limitado'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Permissões Críticas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      Permission.MANAGE_SYSTEM_CONFIG,
                      Permission.ACCESS_SENSITIVE_DATA,
                      Permission.MANAGE_ROLES,
                      Permission.EXPORT_AUDIT_LOGS,
                      Permission.REFUND_PAYMENT,
                      Permission.DELETE_USER
                    ].map((permission) => (
                      <div key={permission} className="flex items-center gap-2 p-2 border rounded">
                        <Lock className="h-4 w-4 text-red-500" />
                        <span className="text-sm">{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Configurações gerais de segurança do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="retention-days">Retenção de Logs (dias)</Label>
                    <Input
                      id="retention-days"
                      type="number"
                      min="30"
                      max="365"
                      value={securitySettings.auditRetentionDays}
                      onChange={(e) => setSecuritySettings(prev => ({ 
                        ...prev, 
                        auditRetentionDays: parseInt(e.target.value) 
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="max-login-attempts">Máximo de Tentativas de Login</Label>
                    <Input
                      id="max-login-attempts"
                      type="number"
                      min="3"
                      max="10"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings(prev => ({ 
                        ...prev, 
                        maxLoginAttempts: parseInt(e.target.value) 
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="session-timeout">Timeout de Sessão (minutos)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      min="15"
                      max="480"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings(prev => ({ 
                        ...prev, 
                        sessionTimeout: parseInt(e.target.value) 
                      }))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="encryption-enabled"
                      checked={securitySettings.encryptionEnabled}
                      onChange={(e) => setSecuritySettings(prev => ({ 
                        ...prev, 
                        encryptionEnabled: e.target.checked 
                      }))}
                    />
                    <Label htmlFor="encryption-enabled">Criptografia de Dados Habilitada</Label>
                  </div>
                </div>
              </div>

              <Button className="w-full">
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}