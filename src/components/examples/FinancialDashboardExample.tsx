import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import FinancialDashboard from '@/components/dashboard/FinancialDashboard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import FinancialFilters from '@/components/dashboard/FinancialFilters'
import { useAuthState } from '@/hooks/useAuthState'
import { BarChart3, TrendingUp, Filter, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function FinancialDashboardExample() {
  const { user } = useAuthState()
  const [activeFilters, setActiveFilters] = useState<any>({})

  const handleFiltersChange = (filters: any) => {
    setActiveFilters(filters)
    console.log('Filtros aplicados:', filters)
    // Aqui você implementaria a lógica para aplicar os filtros aos dados
  }

  const handleExport = () => {
    toast.success('Exportação iniciada! O arquivo será baixado em breve.')
    // Aqui você implementaria a lógica de exportação
    console.log('Exportando dados com filtros:', activeFilters)
  }

  const handleRefresh = () => {
    toast.success('Dados atualizados!')
    // Aqui você implementaria a lógica de refresh
    console.log('Atualizando dados...')
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Faça login para acessar o dashboard financeiro
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Exemplo: Dashboard Financeiro Completo
          </CardTitle>
          <CardDescription>
            Demonstração do sistema completo de monitoramento financeiro com filtros, gráficos e relatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <h4 className="font-medium mb-2">📊 Visão Geral</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Receita total e mensal</li>
                <li>• Pagamentos confirmados e pendentes</li>
                <li>• Comissões de afiliados</li>
                <li>• Distribuição por método de pagamento</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">📈 Gráficos e Análises</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Evolução da receita mensal</li>
                <li>• Comparativo entre períodos</li>
                <li>• Análise de crescimento</li>
                <li>• Distribuição por serviços</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">🔍 Filtros e Relatórios</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Filtros por período e status</li>
                <li>• Exportação de dados</li>
                <li>• Atualização em tempo real</li>
                <li>• Histórico detalhado</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="filters">Filtros</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <FinancialDashboard />
        </TabsContent>

        <TabsContent value="charts">
          <div className="space-y-6">
            <RevenueChart months={6} type="bar" />
            <RevenueChart months={12} type="line" />
          </div>
        </TabsContent>

        <TabsContent value="filters">
          <FinancialFilters
            onFiltersChange={handleFiltersChange}
            onExport={handleExport}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="info">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Funcionalidades do Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">📊 Métricas em Tempo Real</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Receita total do período selecionado</li>
                    <li>• Pagamentos confirmados vs pendentes</li>
                    <li>• Comissões pagas para afiliados</li>
                    <li>• Distribuição por método de pagamento</li>
                    <li>• Análise por tipo de serviço</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">📈 Análises Avançadas</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Gráficos de evolução mensal</li>
                    <li>• Comparativo entre períodos</li>
                    <li>• Cálculo de crescimento percentual</li>
                    <li>• Identificação de tendências</li>
                    <li>• Projeções baseadas em histórico</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">🔍 Filtros Inteligentes</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Filtro por período personalizado</li>
                    <li>• Status de pagamento</li>
                    <li>• Método de pagamento</li>
                    <li>• Tipo de serviço</li>
                    <li>• Faixa de valores</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Benefícios para o Negócio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">💰 Controle Financeiro</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Visibilidade completa da receita</li>
                    <li>• Monitoramento de pagamentos pendentes</li>
                    <li>• Controle de comissões de afiliados</li>
                    <li>• Identificação de problemas rapidamente</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">📊 Tomada de Decisão</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Dados em tempo real para decisões rápidas</li>
                    <li>• Análise de performance por serviço</li>
                    <li>• Identificação de oportunidades</li>
                    <li>• Planejamento baseado em dados</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">⚡ Eficiência Operacional</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Automatização de relatórios</li>
                    <li>• Redução de trabalho manual</li>
                    <li>• Alertas para situações críticas</li>
                    <li>• Exportação facilitada de dados</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">🎯 Gestão de Afiliados</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Transparência nas comissões</li>
                    <li>• Histórico completo de pagamentos</li>
                    <li>• Análise de performance por afiliado</li>
                    <li>• Motivação através de dados claros</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Informações Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle>Implementação Técnica</CardTitle>
          <CardDescription>
            Detalhes sobre a arquitetura e funcionalidades implementadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">🔧 Componentes Criados</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <code>useFinancialDashboard</code> - Hook para dados financeiros</li>
                <li>• <code>FinancialDashboard</code> - Dashboard principal</li>
                <li>• <code>RevenueChart</code> - Gráficos de receita</li>
                <li>• <code>FinancialFilters</code> - Sistema de filtros</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">📊 Funcionalidades</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Atualização automática a cada 30 segundos</li>
                <li>• Gráficos interativos com Recharts</li>
                <li>• Filtros avançados com múltiplos critérios</li>
                <li>• Exportação de dados (preparado)</li>
                <li>• Interface responsiva e intuitiva</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}