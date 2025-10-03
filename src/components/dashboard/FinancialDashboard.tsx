import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFinancialDashboard } from '@/hooks/useFinancialDashboard'
import { formatCurrency } from '@/lib/utils'
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Users, 
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  Calendar,
  AlertCircle,
  Download
} from 'lucide-react'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export default function FinancialDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'last' | 'custom'>('current')
  
  const currentMonth = new Date()
  const lastMonth = subMonths(currentMonth, 1)
  
  const startDate = selectedPeriod === 'last' 
    ? startOfMonth(lastMonth) 
    : startOfMonth(currentMonth)
  const endDate = selectedPeriod === 'last' 
    ? endOfMonth(lastMonth) 
    : endOfMonth(currentMonth)

  const { 
    getFinancialStats, 
    getRecentPayments, 
    getPendingPayments, 
    getRecentCommissions,
    getMonthlyRevenue 
  } = useFinancialDashboard()

  const statsQuery = getFinancialStats(startDate, endDate)
  const recentPaymentsQuery = getRecentPayments(10)
  const pendingPaymentsQuery = getPendingPayments()
  const recentCommissionsQuery = getRecentCommissions(10)
  const monthlyRevenueQuery = getMonthlyRevenue(6)

  const stats = statsQuery.data
  const recentPayments = recentPaymentsQuery.data || []
  const pendingPayments = pendingPaymentsQuery.data || []
  const recentCommissions = recentCommissionsQuery.data || []

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      CONFIRMED: { label: 'Confirmado', variant: 'default' as const, icon: CheckCircle },
      RECEIVED: { label: 'Recebido', variant: 'default' as const, icon: CheckCircle },
      PENDING: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      OVERDUE: { label: 'Vencido', variant: 'destructive' as const, icon: AlertCircle },
      CANCELLED: { label: 'Cancelado', variant: 'outline' as const, icon: AlertCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'PIX':
        return <QrCode className="h-4 w-4" />
      case 'CREDIT_CARD':
        return <CreditCard className="h-4 w-4" />
      case 'BOLETO':
        return <FileText className="h-4 w-4" />
      default:
        return <Banknote className="h-4 w-4" />
    }
  }

  const getServiceTypeLabel = (type: string) => {
    const labels = {
      filiacao: 'Filiação',
      certidao: 'Certidão',
      regularizacao: 'Regularização',
      evento: 'Evento',
      taxa_anual: 'Taxa Anual'
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Visão geral das receitas, pagamentos e comissões
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === 'current' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('current')}
          >
            Mês Atual
          </Button>
          <Button
            variant={selectedPeriod === 'last' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('last')}
          >
            Mês Anterior
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.totalRevenue) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod === 'current' ? 'Mês atual' : 'Mês anterior'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.confirmedPayments) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamentos processados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.pendingPayments) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Pagas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.paidCommissions) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Para afiliados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita por Método de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Método</CardTitle>
            <CardDescription>Distribuição por forma de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            {stats && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-green-600" />
                    <span className="text-sm">PIX</span>
                  </div>
                  <span className="font-medium">{formatCurrency(stats.paymentsByMethod.pix)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Cartão de Crédito</span>
                  </div>
                  <span className="font-medium">{formatCurrency(stats.paymentsByMethod.card)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Boleto</span>
                  </div>
                  <span className="font-medium">{formatCurrency(stats.paymentsByMethod.boleto)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receita por Serviço */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Serviço</CardTitle>
            <CardDescription>Distribuição por tipo de serviço</CardDescription>
          </CardHeader>
          <CardContent>
            {stats && (
              <div className="space-y-4">
                {Object.entries(stats.revenueByService).map(([service, value]) => (
                  <div key={service} className="flex items-center justify-between">
                    <span className="text-sm">{getServiceTypeLabel(service)}</span>
                    <span className="font-medium">{formatCurrency(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Detalhes */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Pagamentos Recentes</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos Recentes</CardTitle>
              <CardDescription>Últimos 10 pagamentos processados</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPayments.length > 0 ? (
                <div className="space-y-4">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(payment.payment_method)}
                          <span className="font-medium">{payment.description}</span>
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Valor</p>
                          <p className="font-medium">{formatCurrency(payment.value)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cliente</p>
                          <p className="font-medium">{payment.user_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Serviço</p>
                          <p className="font-medium">{getServiceTypeLabel(payment.service_type)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Data</p>
                          <p className="font-medium">
                            {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum pagamento encontrado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos Pendentes</CardTitle>
              <CardDescription>Pagamentos aguardando confirmação</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPayments.length > 0 ? (
                <div className="space-y-4">
                  {pendingPayments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(payment.payment_method)}
                          <span className="font-medium">{payment.description}</span>
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Valor</p>
                          <p className="font-medium">{formatCurrency(payment.value)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cliente</p>
                          <p className="font-medium">{payment.user_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Serviço</p>
                          <p className="font-medium">{getServiceTypeLabel(payment.service_type)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Criado em</p>
                          <p className="font-medium">
                            {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum pagamento pendente
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Comissões Recentes</CardTitle>
              <CardDescription>Últimas comissões processadas para afiliados</CardDescription>
            </CardHeader>
            <CardContent>
              {recentCommissions.length > 0 ? (
                <div className="space-y-4">
                  {recentCommissions.map((commission) => (
                    <div key={commission.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{commission.affiliate_name}</p>
                          <p className="text-sm text-muted-foreground">{commission.affiliate_email}</p>
                        </div>
                        <Badge variant={commission.status === 'completed' ? 'default' : 'secondary'}>
                          {commission.status === 'completed' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Comissão</p>
                          <p className="font-medium text-green-600">
                            {formatCurrency(commission.commission_value)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Valor Original</p>
                          <p className="font-medium">{formatCurrency(commission.payment_value)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Porcentagem</p>
                          <p className="font-medium">{commission.percentage}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Data</p>
                          <p className="font-medium">
                            {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma comissão encontrada
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}