/**
 * Dashboard de Monitoramento do Payment First Flow
 * 
 * Interface administrativa para visualizar métricas, logs e alertas
 * Requirements: 8.3, 8.4
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Users,
  CreditCard,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { paymentFirstFlowLogger, PaymentFirstFlowMetrics } from '@/lib/services/PaymentFirstFlowLogger';

interface DashboardStats {
  totalRegistrations: number;
  successfulRegistrations: number;
  failedRegistrations: number;
  successRate: number;
  avgProcessingTime: number;
  activeAlerts: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PaymentFirstFlowMonitoring: React.FC = () => {
  const [dateRange, setDateRange] = useState('24h');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 segundos
  const queryClient = useQueryClient();

  // Query para métricas
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['payment-first-flow-metrics', dateRange],
    queryFn: async () => {
      const endDate = new Date().toISOString().split('T')[0];
      let startDate: string;
      
      switch (dateRange) {
        case '24h':
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        default:
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      return await paymentFirstFlowLogger.getMetrics({
        startDate,
        endDate,
        groupByHour: dateRange === '24h'
      });
    },
    refetchInterval: refreshInterval
  });

  // Query para alertas ativos
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['payment-first-flow-alerts'],
    queryFn: () => paymentFirstFlowLogger.getActiveAlerts(),
    refetchInterval: refreshInterval
  });

  // Mutation para resolver alertas
  const resolveAlertMutation = useMutation({
    mutationFn: (alertId: string) => paymentFirstFlowLogger.resolveAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-first-flow-alerts'] });
      toast.success('Alerta resolvido com sucesso');
    },
    onError: () => {
      toast.error('Erro ao resolver alerta');
    }
  });

  // Mutation para recalcular métricas
  const recalculateMetricsMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      await paymentFirstFlowLogger.calculateMetrics(today);
      await paymentFirstFlowLogger.calculateMetrics(today, new Date().getHours());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-first-flow-metrics'] });
      toast.success('Métricas recalculadas com sucesso');
    },
    onError: () => {
      toast.error('Erro ao recalcular métricas');
    }
  });

  // Calcular estatísticas do dashboard
  const dashboardStats: DashboardStats = React.useMemo(() => {
    if (!metrics || metrics.length === 0) {
      return {
        totalRegistrations: 0,
        successfulRegistrations: 0,
        failedRegistrations: 0,
        successRate: 0,
        avgProcessingTime: 0,
        activeAlerts: alerts?.length || 0
      };
    }

    const totals = metrics.reduce((acc, metric) => ({
      totalRegistrations: acc.totalRegistrations + metric.total_registrations,
      successfulRegistrations: acc.successfulRegistrations + metric.successful_registrations,
      failedRegistrations: acc.failedRegistrations + metric.failed_registrations,
      avgProcessingTime: acc.avgProcessingTime + (metric.avg_processing_time_ms || 0)
    }), {
      totalRegistrations: 0,
      successfulRegistrations: 0,
      failedRegistrations: 0,
      avgProcessingTime: 0
    });

    const successRate = totals.totalRegistrations > 0 
      ? (totals.successfulRegistrations / totals.totalRegistrations) * 100 
      : 0;

    const avgProcessingTime = metrics.length > 0 
      ? totals.avgProcessingTime / metrics.length 
      : 0;

    return {
      ...totals,
      successRate,
      avgProcessingTime,
      activeAlerts: alerts?.length || 0
    };
  }, [metrics, alerts]);

  // Preparar dados para gráficos
  const chartData = React.useMemo(() => {
    if (!metrics) return [];
    
    return metrics.map(metric => ({
      time: dateRange === '24h' 
        ? `${metric.hour}:00` 
        : new Date(metric.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      total: metric.total_registrations,
      successful: metric.successful_registrations,
      failed: metric.failed_registrations,
      successRate: metric.success_rate,
      avgTime: metric.avg_processing_time_ms ? metric.avg_processing_time_ms / 1000 : 0
    }));
  }, [metrics, dateRange]);

  // Dados para gráfico de pizza dos tipos de erro
  const errorData = React.useMemo(() => {
    if (!metrics) return [];
    
    const totals = metrics.reduce((acc, metric) => ({
      paymentFailures: acc.paymentFailures + metric.payment_failures,
      accountCreationFailures: acc.accountCreationFailures + metric.account_creation_failures,
      fallbackActivations: acc.fallbackActivations + metric.fallback_activations
    }), {
      paymentFailures: 0,
      accountCreationFailures: 0,
      fallbackActivations: 0
    });

    return [
      { name: 'Falhas de Pagamento', value: totals.paymentFailures },
      { name: 'Falhas de Criação de Conta', value: totals.accountCreationFailures },
      { name: 'Ativações de Fallback', value: totals.fallbackActivations }
    ].filter(item => item.value > 0);
  }, [metrics]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <Activity className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Monitoramento Payment First Flow</h1>
          <p className="text-muted-foreground">
            Acompanhe métricas, logs e alertas do novo sistema de filiação
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => recalculateMetricsMutation.mutate()}
            disabled={recalculateMetricsMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculateMetricsMutation.isPending ? 'animate-spin' : ''}`} />
            Recalcular
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.successfulRegistrations} bem-sucedidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            {dashboardStats.successRate >= 90 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.failedRegistrations} falhas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(dashboardStats.avgProcessingTime / 1000).toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">
              Processamento médio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${dashboardStats.activeAlerts > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Ativos */}
      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Alertas Ativos
            </CardTitle>
            <CardDescription>
              Alertas que requerem atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Alert key={alert.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {getSeverityIcon(alert.severity)}
                      <div>
                        <AlertTitle className="flex items-center gap-2">
                          {alert.title}
                          <Badge variant={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="mt-1">
                          {alert.description}
                        </AlertDescription>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveAlertMutation.mutate(alert.id)}
                      disabled={resolveAlertMutation.isPending}
                    >
                      Resolver
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Análise de Erros</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Registros por Período</CardTitle>
                <CardDescription>
                  Total de registros e taxa de sucesso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#8884d8" 
                      name="Total"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="successful" 
                      stroke="#82ca9d" 
                      name="Sucesso"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="failed" 
                      stroke="#ff7c7c" 
                      name="Falhas"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taxa de Sucesso</CardTitle>
                <CardDescription>
                  Percentual de registros bem-sucedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Taxa de Sucesso']} />
                    <Line 
                      type="monotone" 
                      dataKey="successRate" 
                      stroke="#00C49F" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tempo de Processamento</CardTitle>
              <CardDescription>
                Tempo médio de processamento por período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}s`, 'Tempo Médio']} />
                  <Bar dataKey="avgTime" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Erros</CardTitle>
                <CardDescription>
                  Tipos de erros mais comuns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={errorData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {errorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo de Erros</CardTitle>
                <CardDescription>
                  Estatísticas detalhadas por tipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {errorData.map((error, index) => (
                    <div key={error.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{error.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{error.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentFirstFlowMonitoring;