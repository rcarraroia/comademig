import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { asaasErrorHandler, AsaasErrorType, ErrorSeverity } from '@/lib/asaas/error-handler'
import { asaasClient } from '@/lib/asaas/client'
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  XCircle, 
  RefreshCw, 
  Trash2,
  TrendingUp,
  Clock,
  Shield,
  Zap
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ErrorMonitoring() {
  const [errorStats, setErrorStats] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshStats = () => {
    setErrorStats(asaasErrorHandler.getErrorStats())
  }

  const handleClearErrors = () => {
    asaasErrorHandler.clearErrorLog()
    asaasClient.clearErrorLog()
    refreshStats()
  }

  const handleTestConnection = async () => {
    setIsRefreshing(true)
    try {
      await asaasClient.testConnection()
    } catch (error) {
      // Erro será tratado automaticamente pelo sistema
    } finally {
      setIsRefreshing(false)
      refreshStats()
    }
  }

  useEffect(() => {
    refreshStats()
    
    // Atualizar estatísticas a cada 30 segundos
    const interval = setInterval(refreshStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return <Info className="h-4 w-4 text-blue-500" />
      case ErrorSeverity.MEDIUM:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case ErrorSeverity.HIGH:
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case ErrorSeverity.CRITICAL:
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getSeverityBadge = (severity: ErrorSeverity) => {
    const config = {
      [ErrorSeverity.LOW]: { variant: 'secondary' as const, label: 'Baixa' },
      [ErrorSeverity.MEDIUM]: { variant: 'default' as const, label: 'Média' },
      [ErrorSeverity.HIGH]: { variant: 'destructive' as const, label: 'Alta' },
      [ErrorSeverity.CRITICAL]: { variant: 'destructive' as const, label: 'Crítica' }
    }

    const { variant, label } = config[severity] || config[ErrorSeverity.LOW]

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getSeverityIcon(severity)}
        {label}
      </Badge>
    )
  }

  const getTypeIcon = (type: AsaasErrorType) => {
    switch (type) {
      case AsaasErrorType.AUTHENTICATION:
        return <Shield className="h-4 w-4" />
      case AsaasErrorType.VALIDATION:
        return <AlertTriangle className="h-4 w-4" />
      case AsaasErrorType.NETWORK:
        return <Zap className="h-4 w-4" />
      case AsaasErrorType.RATE_LIMIT:
        return <Clock className="h-4 w-4" />
      case AsaasErrorType.SERVER_ERROR:
        return <XCircle className="h-4 w-4" />
      case AsaasErrorType.BUSINESS_RULE:
        return <Info className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: AsaasErrorType) => {
    const labels = {
      [AsaasErrorType.AUTHENTICATION]: 'Autenticação',
      [AsaasErrorType.VALIDATION]: 'Validação',
      [AsaasErrorType.NETWORK]: 'Rede',
      [AsaasErrorType.RATE_LIMIT]: 'Rate Limit',
      [AsaasErrorType.SERVER_ERROR]: 'Servidor',
      [AsaasErrorType.BUSINESS_RULE]: 'Regra de Negócio',
      [AsaasErrorType.UNKNOWN]: 'Desconhecido'
    }
    return labels[type] || 'Desconhecido'
  }

  if (!errorStats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-muted-foreground">Carregando estatísticas de erros...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Monitoramento de Erros</h1>
          <p className="text-muted-foreground">
            Acompanhe erros da API Asaas e sistema de pagamentos
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Testar Conexão
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStats}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearErrors}
            disabled={errorStats.total === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Log
          </Button>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Erros</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Registrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros Críticos</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {errorStats.bySeverity[ErrorSeverity.CRITICAL] || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção imediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros de Rede</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {errorStats.byType[AsaasErrorType.NETWORK] || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Problemas de conectividade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros de Validação</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {errorStats.byType[AsaasErrorType.VALIDATION] || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Dados inválidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Erros Recentes</TabsTrigger>
          <TabsTrigger value="by-type">Por Tipo</TabsTrigger>
          <TabsTrigger value="by-severity">Por Severidade</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Erros Recentes</CardTitle>
              <CardDescription>
                Últimos 10 erros registrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorStats.recent.length > 0 ? (
                <div className="space-y-4">
                  {errorStats.recent.map((error: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(error.type)}
                          <span className="font-medium">{error.code}</span>
                        </div>
                        {getSeverityBadge(error.severity)}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {error.userMessage}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="text-muted-foreground">Tipo</p>
                          <p className="font-medium">{getTypeLabel(error.type)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Retryable</p>
                          <p className="font-medium">{error.retryable ? 'Sim' : 'Não'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Função</p>
                          <p className="font-medium">{error.context?.function || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Quando</p>
                          <p className="font-medium">
                            {formatDistanceToNow(new Date(error.timestamp), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                        </div>
                      </div>

                      {error.context && Object.keys(error.context).length > 1 && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <p className="text-muted-foreground mb-1">Contexto:</p>
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(error.context, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum erro registrado</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Isso é uma boa notícia! O sistema está funcionando sem problemas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-type">
          <Card>
            <CardHeader>
              <CardTitle>Erros por Tipo</CardTitle>
              <CardDescription>
                Distribuição de erros por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(errorStats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(type as AsaasErrorType)}
                      <span className="font-medium">{getTypeLabel(type as AsaasErrorType)}</span>
                    </div>
                    <Badge variant="secondary">{count as number}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-severity">
          <Card>
            <CardHeader>
              <CardTitle>Erros por Severidade</CardTitle>
              <CardDescription>
                Distribuição de erros por nível de criticidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(errorStats.bySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(severity as ErrorSeverity)}
                      <span className="font-medium">
                        {severity === ErrorSeverity.LOW && 'Baixa'}
                        {severity === ErrorSeverity.MEDIUM && 'Média'}
                        {severity === ErrorSeverity.HIGH && 'Alta'}
                        {severity === ErrorSeverity.CRITICAL && 'Crítica'}
                      </span>
                    </div>
                    <Badge 
                      variant={
                        severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH 
                          ? 'destructive' 
                          : 'secondary'
                      }
                    >
                      {count as number}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}