/**
 * Dashboard de Monitoramento da Ativação Gradual
 * 
 * Interface para monitorar e controlar a ativação gradual do Payment First Flow
 * Requirements: 10.1, 10.4
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { featureFlagService } from '@/lib/services/FeatureFlagService';

interface RolloutMetrics {
  currentPercentage: number;
  totalAttempts: number;
  successfulRegistrations: number;
  failedRegistrations: number;
  successRate: number;
  errorRate: number;
  averageProcessingTime: number;
  isHealthy: boolean;
}

interface TimeSeriesData {
  timestamp: string;
  attempts: number;
  successes: number;
  failures: number;
  avgTime: number;
}

interface ErrorBreakdown {
  errorType: string;
  count: number;
  percentage: number;
}

export default function GradualActivationDashboard() {
  const [metrics, setMetrics] = useState<RolloutMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [errorBreakdown, setErrorBreakdown] = useState<ErrorBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      await Promise.all([
        loadCurrentMetrics(),
        loadTimeSeriesData(),
        loadErrorBreakdown()
      ]);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentMetrics = async () => {
    // Buscar feature flag atual
    const flag = await featureFlagService.getFeatureFlag('payment_first_flow');
    
    if (!flag) {
      setMetrics({
        currentPercentage: 0,
        totalAttempts: 0,
        successfulRegistrations: 0,
        failedRegistrations: 0,
        successRate: 0,
        errorRate: 0,
        averageProcessingTime: 0,
        isHealthy: false
      });
      return;
    }

    // Buscar métricas dos últimos 30 minutos
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: logsData } = await supabase
      .from('payment_first_flow_logs')
      .select('event_type, processing_time, error_type')
      .gte('created_at', thirtyMinutesAgo);

    const logs = logsData || [];
    
    const totalAttempts = logs.filter(log => log.event_type === 'registration_attempt').length;
    const successfulRegistrations = logs.filter(log => log.event_type === 'registration_completed').length;
    const failedRegistrations = logs.filter(log => log.event_type === 'registration_failed').length;
    
    const successRate = totalAttempts > 0 ? (successfulRegistrations / totalAttempts) * 100 : 100;
    const errorRate = totalAttempts > 0 ? (failedRegistrations / totalAttempts) * 100 : 0;
    
    const processingTimes = logs
      .filter(log => log.processing_time)
      .map(log => log.processing_time);
    
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0;

    const isHealthy = successRate >= 95 && errorRate <= 5 && averageProcessingTime <= 30;

    setMetrics({
      currentPercentage: flag.rollout_percentage,
      totalAttempts,
      successfulRegistrations,
      failedRegistrations,
      successRate,
      errorRate,
      averageProcessingTime,
      isHealthy
    });
  };

  const loadTimeSeriesData = async () => {
    // Buscar dados das últimas 4 horas em intervalos de 15 minutos
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    
    const { data: logsData } = await supabase
      .from('payment_first_flow_logs')
      .select('created_at, event_type, processing_time')
      .gte('created_at', fourHoursAgo.toISOString())
      .order('created_at');

    if (!logsData) {
      setTimeSeriesData([]);
      return;
    }

    // Agrupar por intervalos de 15 minutos
    const intervals: Record<string, TimeSeriesData> = {};
    
    logsData.forEach(log => {
      const timestamp = new Date(log.created_at);
      const intervalStart = new Date(
        timestamp.getFullYear(),
        timestamp.getMonth(),
        timestamp.getDate(),
        timestamp.getHours(),
        Math.floor(timestamp.getMinutes() / 15) * 15
      );
      
      const key = intervalStart.toISOString();
      
      if (!intervals[key]) {
        intervals[key] = {
          timestamp: intervalStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          attempts: 0,
          successes: 0,
          failures: 0,
          avgTime: 0
        };
      }
      
      if (log.event_type === 'registration_attempt') {
        intervals[key].attempts++;
      } else if (log.event_type === 'registration_completed') {
        intervals[key].successes++;
      } else if (log.event_type === 'registration_failed') {
        intervals[key].failures++;
      }
      
      if (log.processing_time) {
        intervals[key].avgTime = (intervals[key].avgTime + log.processing_time) / 2;
      }
    });

    const timeSeriesArray = Object.values(intervals).sort((a, b) => 
      a.timestamp.localeCompare(b.timestamp)
    );

    setTimeSeriesData(timeSeriesArray);
  };

  const loadErrorBreakdown = async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: errorData } = await supabase
      .from('payment_first_flow_logs')
      .select('error_type')
      .eq('event_type', 'error')
      .gte('created_at', thirtyMinutesAgo);

    if (!errorData) {
      setErrorBreakdown([]);
      return;
    }

    const errorCounts: Record<string, number> = {};
    errorData.forEach(error => {
      const type = error.error_type || 'unknown';
      errorCounts[type] = (errorCounts[type] || 0) + 1;
    });

    const totalErrors = Object.values(errorCounts).reduce((sum, count) => sum + count, 0);
    
    const breakdown = Object.entries(errorCounts).map(([errorType, count]) => ({
      errorType,
      count,
      percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0
    }));

    setErrorBreakdown(breakdown.sort((a, b) => b.count - a.count));
  };

  const handleUpdateRollout = async (newPercentage: number) => {
    try {
      const flag = await featureFlagService.getFeatureFlag('payment_first_flow');
      if (flag) {
        await featureFlagService.updateRolloutPercentage(flag.id, newPercentage);
        await loadCurrentMetrics();
      }
    } catch (error) {
      console.error('Erro ao atualizar rollout:', error);
    }
  };

  const handleEmergencyRollback = async () => {
    if (!confirm('Tem certeza que deseja fazer rollback de emergência? Isso desabilitará o Payment First Flow imediatamente.')) {
      return;
    }

    try {
      const flag = await featureFlagService.getFeatureFlag('payment_first_flow');
      if (flag) {
        await featureFlagService.emergencyRollback(flag.id, 'Rollback manual via dashboard');
        await loadCurrentMetrics();
      }
    } catch (error) {
      console.error('Erro no rollback de emergência:', error);
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ativação Gradual - Payment First Flow</h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real da ativação gradual do novo fluxo de registro
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rollout Atual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.currentPercentage || 0}%</div>
            <Progress value={metrics?.currentPercentage || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            {metrics?.successRate >= 95 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.successRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.successfulRegistrations || 0} de {metrics?.totalAttempts || 0} tentativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
            {metrics?.errorRate <= 5 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.errorRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.failedRegistrations || 0} falhas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageProcessingTime.toFixed(1) || 0}s</div>
            <p className="text-xs text-muted-foreground">
              Processamento médio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Health Status */}
      <Alert className={metrics?.isHealthy ? 'border-green-500' : 'border-red-500'}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Status do Sistema:</strong> {metrics?.isHealthy ? 'Saudável' : 'Problemas Detectados'}
          {!metrics?.isHealthy && (
            <div className="mt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEmergencyRollback}
              >
                Rollback de Emergência
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>

      {/* Tabs */}
      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="control">Controle</TabsTrigger>
          <TabsTrigger value="errors">Erros</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Registros (Últimas 4 horas)</CardTitle>
              <CardDescription>
                Tentativas, sucessos e falhas ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="attempts" stroke="#8884d8" name="Tentativas" />
                  <Line type="monotone" dataKey="successes" stroke="#82ca9d" name="Sucessos" />
                  <Line type="monotone" dataKey="failures" stroke="#ff7c7c" name="Falhas" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tempo de Processamento</CardTitle>
              <CardDescription>
                Tempo médio de processamento por intervalo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgTime" stroke="#ffc658" name="Tempo Médio (s)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="control" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Rollout</CardTitle>
              <CardDescription>
                Ajuste o percentual de usuários no novo fluxo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[5, 10, 25, 50, 75, 100].map(percentage => (
                  <Button
                    key={percentage}
                    variant={metrics?.currentPercentage === percentage ? "default" : "outline"}
                    onClick={() => handleUpdateRollout(percentage)}
                    disabled={isLoading}
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="destructive"
                  onClick={handleEmergencyRollback}
                  disabled={isLoading}
                >
                  Rollback de Emergência (0%)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Breakdown de Erros (Últimos 30 min)</CardTitle>
              <CardDescription>
                Tipos de erros mais frequentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={errorBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="errorType" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ff7c7c" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  Nenhum erro registrado nos últimos 30 minutos
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      {lastUpdated && (
        <div className="text-sm text-muted-foreground text-center">
          Última atualização: {lastUpdated.toLocaleString('pt-BR')}
        </div>
      )}
    </div>
  );
}