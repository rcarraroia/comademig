import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAsaasSplits } from '@/hooks/useAsaasSplits'
import { useAuthState } from '@/hooks/useAuthState'
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function CommissionDashboard() {
  const { user } = useAuthState()
  const { getAffiliateCommissions, getCommissionStats } = useAsaasSplits()

  const commissionsQuery = getAffiliateCommissions(user?.id || '')
  const statsQuery = getCommissionStats(user?.id || '')

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      completed: { label: 'Pago', variant: 'default' as const, icon: CheckCircle },
      failed: { label: 'Falhou', variant: 'destructive' as const, icon: AlertCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Faça login para ver suas comissões
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Comissões</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsQuery.data ? formatCurrency(statsQuery.data.total) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {statsQuery.data?.count || 0} comissões registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsQuery.data ? formatCurrency(statsQuery.data.pending) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando processamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pago</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsQuery.data ? formatCurrency(statsQuery.data.completed) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Já transferido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Comissões */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
          <CardDescription>
            Suas comissões de afiliado registradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissionsQuery.isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando comissões...</p>
            </div>
          ) : commissionsQuery.data && commissionsQuery.data.length > 0 ? (
            <div className="space-y-4">
              {commissionsQuery.data.map((commission: any) => (
                <div key={commission.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">
                        {commission.cobranca?.description || `Cobrança ${commission.cobranca_id}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ID: {commission.cobranca?.external_id || commission.cobranca_id}
                      </p>
                    </div>
                    {getStatusBadge(commission.status)}
                  </div>

                  <Separator className="my-2" />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Valor do Pagamento</p>
                      <p className="font-medium">
                        {formatCurrency(commission.payment_value)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Porcentagem</p>
                      <p className="font-medium">{commission.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Comissão</p>
                      <p className="font-medium text-green-600">
                        {formatCurrency(commission.commission_value)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data</p>
                      <p className="font-medium">
                        {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {commission.transfer_id && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      <p className="text-muted-foreground">Transfer ID:</p>
                      <p className="font-mono">{commission.transfer_id}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma comissão encontrada ainda
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Suas comissões aparecerão aqui quando você indicar novos membros
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}