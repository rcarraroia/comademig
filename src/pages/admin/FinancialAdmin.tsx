import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  BarChart3, 
  AlertTriangle, 
  TrendingUp,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import RevenueChart from '@/components/financial/RevenueChart';
import PaymentStatusCards from '@/components/financial/PaymentStatusCards';
import MemberTypeRevenue from '@/components/financial/MemberTypeRevenue';
import OverduePayments from '@/components/financial/OverduePayments';
import { useFinancialMetrics } from '@/hooks/useFinancial';

const FinancialAdmin: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const { data: metrics, refetch } = useFinancialMetrics();

  const handleExportReport = () => {
    if (!metrics) {
      alert('Aguarde o carregamento dos dados');
      return;
    }

    // Preparar dados para exportação
    const reportData = {
      data_geracao: new Date().toLocaleString('pt-BR'),
      resumo_financeiro: {
        receita_total: `R$ ${metrics.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        receita_anual: `R$ ${metrics.annual_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        receita_mensal: `R$ ${metrics.monthly_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        pagamentos_atrasados: `R$ ${metrics.overdue_payments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        taxa_adimplencia: `${metrics.total_revenue > 0 ? (((metrics.total_revenue - metrics.overdue_payments) / metrics.total_revenue) * 100).toFixed(1) : 100}%`
      },
      metodos_pagamento: metrics.payment_methods.map(m => ({
        metodo: m.method === 'pix' ? 'PIX' : 
                m.method === 'credit_card' ? 'Cartão de Crédito' :
                m.method === 'boleto' ? 'Boleto' : m.method,
        receita: `R$ ${m.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        percentual: `${((m.revenue / metrics.total_revenue) * 100).toFixed(1)}%`
      })),
      receita_por_cargo: metrics.member_type_revenue.map(mt => ({
        cargo: mt.member_type,
        receita: `R$ ${mt.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        quantidade_membros: mt.member_count
      }))
    };

    // Converter para JSON formatado
    const jsonString = JSON.stringify(reportData, null, 2);
    
    // Criar blob e fazer download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRefreshData = () => {
    refetch();
  };

  if (!isAdmin()) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Esta página é restrita a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Visão completa das finanças e receitas da convenção
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Alertas importantes */}
      {metrics && metrics.overdue_payments > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Há pagamentos em atraso no valor de{' '}
            <strong>R$ {metrics.overdue_payments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
            Verifique a aba "Inadimplência" para mais detalhes.
          </AlertDescription>
        </Alert>
      )}

      {/* Conteúdo principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Receitas
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Por Cargo
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Inadimplência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Cards de status */}
          <PaymentStatusCards />
          
          {/* Gráfico de receita */}
          <RevenueChart type="area" />
          
          {/* Resumo por cargo */}
          <div className="grid md:grid-cols-2 gap-6">
            <MemberTypeRevenue viewType="table" />
            
            <Card>
              <CardHeader>
                <CardTitle>Resumo Executivo</CardTitle>
                <CardDescription>
                  Principais indicadores financeiros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-green-700 font-medium">Taxa de Adimplência</div>
                        <div className="text-2xl font-bold text-green-600">
                          {metrics.total_revenue > 0 
                            ? (((metrics.total_revenue - metrics.overdue_payments) / metrics.total_revenue) * 100).toFixed(1)
                            : 100
                          }%
                        </div>
                      </div>
                      
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-700 font-medium">Receita Média/Mês</div>
                        <div className="text-2xl font-bold text-blue-600">
                          R$ {(metrics.annual_revenue / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Métodos de Pagamento Preferidos</h4>
                      {metrics.payment_methods.slice(0, 3).map((method, index) => (
                        <div key={method.method} className="flex items-center justify-between text-sm">
                          <span>{method.method === 'pix' ? 'PIX' : 
                                 method.method === 'credit_card' ? 'Cartão de Crédito' :
                                 method.method === 'boleto' ? 'Boleto' : method.method}</span>
                          <span className="font-medium">
                            {((method.revenue / metrics.total_revenue) * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {/* Gráficos de receita */}
          <div className="grid gap-6">
            <RevenueChart type="bar" />
            
            <div className="grid md:grid-cols-2 gap-6">
              <RevenueChart type="line" />
              <RevenueChart type="area" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          {/* Análise por cargo */}
          <div className="grid gap-6">
            <MemberTypeRevenue viewType="pie" />
            
            <div className="grid md:grid-cols-2 gap-6">
              <MemberTypeRevenue viewType="bar" />
              <MemberTypeRevenue viewType="table" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-6">
          {/* Pagamentos em atraso */}
          <OverduePayments />
          
          {/* Ações recomendadas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Recomendadas</CardTitle>
              <CardDescription>
                Estratégias para reduzir inadimplência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Prevenção</h4>
                  <div className="space-y-2 text-sm">
                    <div>• Enviar lembretes 7 dias antes do vencimento</div>
                    <div>• Oferecer desconto para pagamento antecipado</div>
                    <div>• Facilitar métodos de pagamento (PIX, cartão)</div>
                    <div>• Comunicar claramente as datas de vencimento</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Recuperação</h4>
                  <div className="space-y-2 text-sm">
                    <div>• Contato telefônico nos primeiros 5 dias</div>
                    <div>• Negociar parcelamento quando necessário</div>
                    <div>• Oferecer canais de atendimento dedicados</div>
                    <div>• Manter registro de todas as tentativas</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialAdmin;