import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Users,
  Database,
  AlertTriangle,
  Shield,
  Clock,
  Calendar,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { 
  useAuditStats, 
  formatAction, 
  getActionColor, 
  formatTableName 
} from '@/hooks/useAudit';

interface AuditDashboardProps {
  className?: string;
}

const AuditDashboard: React.FC<AuditDashboardProps> = ({ 
  className = '' 
}) => {
  const [dateRange, setDateRange] = useState<{ from: string; to: string } | undefined>();

  const { data: stats, isLoading, error, refetch } = useAuditStats(dateRange);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando estatísticas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar estatísticas: {(error as Error).message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Auditoria</h2>
          <p className="text-muted-foreground">
            Visão geral das atividades e segurança do sistema
          </p>
        </div>
        
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Atividades</p>
                <p className="text-2xl font-bold">{stats.total_activities.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hoje</p>
                <p className="text-2xl font-bold">{stats.activities_today}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Esta Semana</p>
                <p className="text-2xl font-bold">{stats.activities_this_week}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Este Mês</p>
                <p className="text-2xl font-bold">{stats.activities_this_month}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Usuários mais ativos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários Mais Ativos
            </CardTitle>
            <CardDescription>
              Usuários com mais atividades registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.most_active_users.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma atividade de usuário registrada
                </p>
              ) : (
                stats.most_active_users.slice(0, 10).map((user, index) => (
                  <div key={user.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium">{user.user_name}</span>
                    </div>
                    <Badge variant="outline">
                      {user.activity_count} atividades
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabelas mais modificadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Tabelas Mais Modificadas
            </CardTitle>
            <CardDescription>
              Entidades com mais alterações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.most_modified_tables.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma modificação registrada
                </p>
              ) : (
                stats.most_modified_tables.slice(0, 10).map((table, index) => (
                  <div key={table.table_name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium">{formatTableName(table.table_name)}</span>
                    </div>
                    <Badge variant="outline">
                      {table.modification_count} modificações
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por ação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribuição por Tipo de Ação
            </CardTitle>
            <CardDescription>
              Breakdown das operações realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.action_distribution.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma ação registrada
                </p>
              ) : (
                stats.action_distribution.map((action) => {
                  const percentage = stats.total_activities > 0 
                    ? (action.count / stats.total_activities) * 100 
                    : 0;
                  
                  return (
                    <div key={action.action} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getActionColor(action.action)}>
                          {formatAction(action.action)}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {action.count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            action.action === 'INSERT' ? 'bg-green-600' :
                            action.action === 'UPDATE' ? 'bg-blue-600' :
                            action.action === 'DELETE' ? 'bg-red-600' : 'bg-gray-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alertas de segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Alertas de Segurança
            </CardTitle>
            <CardDescription>
              Atividades que requerem atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Verificar se há muitas exclusões */}
              {stats.action_distribution.find(a => a.action === 'DELETE')?.count > 10 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Alto número de exclusões detectado ({stats.action_distribution.find(a => a.action === 'DELETE')?.count} registros)
                  </AlertDescription>
                </Alert>
              )}

              {/* Verificar atividade hoje */}
              {stats.activities_today === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhuma atividade registrada hoje
                  </AlertDescription>
                </Alert>
              )}

              {/* Verificar se há atividade excessiva */}
              {stats.activities_today > 100 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Atividade muito alta hoje ({stats.activities_today} ações)
                  </AlertDescription>
                </Alert>
              )}

              {/* Se não há alertas */}
              {stats.action_distribution.find(a => a.action === 'DELETE')?.count <= 10 &&
               stats.activities_today > 0 &&
               stats.activities_today <= 100 && (
                <div className="text-center py-4">
                  <Shield className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-green-600 font-medium">Sistema Seguro</p>
                  <p className="text-sm text-gray-600">Nenhum alerta de segurança</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de atividade por período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resumo de Atividade
          </CardTitle>
          <CardDescription>
            Comparativo de atividades por período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.activities_today}
              </div>
              <div className="text-sm text-gray-600">Hoje</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.activities_this_week > 0 
                  ? `${((stats.activities_today / stats.activities_this_week) * 100).toFixed(1)}% da semana`
                  : 'Primeira atividade da semana'
                }
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.activities_this_week}
              </div>
              <div className="text-sm text-gray-600">Esta Semana</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.activities_this_month > 0 
                  ? `${((stats.activities_this_week / stats.activities_this_month) * 100).toFixed(1)}% do mês`
                  : 'Primeira semana do mês'
                }
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.activities_this_month}
              </div>
              <div className="text-sm text-gray-600">Este Mês</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.total_activities > 0 
                  ? `${((stats.activities_this_month / stats.total_activities) * 100).toFixed(1)}% do total`
                  : 'Primeiro mês com atividade'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditDashboard;