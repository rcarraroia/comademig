import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Clock, 
  Activity,
  AlertCircle,
  Loader2,
  Calendar,
  Database
} from 'lucide-react';
import { 
  useUserActivityTimeline, 
  formatAction, 
  getActionColor, 
  formatTableName, 
  getRelativeTime 
} from '@/hooks/useAudit';

interface UserActivityTimelineProps {
  userId: string;
  userName?: string;
  limit?: number;
  className?: string;
}

const UserActivityTimeline: React.FC<UserActivityTimelineProps> = ({ 
  userId, 
  userName,
  limit = 20,
  className = '' 
}) => {
  const { data: activities, isLoading, error } = useUserActivityTimeline(userId, limit);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando atividades...</span>
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
              Erro ao carregar atividades: {(error as Error).message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Timeline de Atividades
          {userName && <span className="text-base font-normal">- {userName}</span>}
        </CardTitle>
        <CardDescription>
          Histórico das últimas {limit} atividades do usuário
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              Nenhuma atividade encontrada para este usuário
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {activities.length}
                </div>
                <div className="text-xs text-gray-600">Atividades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {activities.filter(a => a.action === 'INSERT').length}
                </div>
                <div className="text-xs text-gray-600">Criações</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {activities.filter(a => a.action === 'UPDATE').length}
                </div>
                <div className="text-xs text-gray-600">Atualizações</div>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Linha vertical da timeline */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              <div className="space-y-6">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="relative flex items-start gap-4">
                    {/* Ponto da timeline */}
                    <div className={`
                      relative z-10 w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center
                      ${activity.action === 'INSERT' ? 'bg-green-500' :
                        activity.action === 'UPDATE' ? 'bg-blue-500' :
                        activity.action === 'DELETE' ? 'bg-red-500' : 'bg-gray-500'}
                    `}>
                      <Activity className="h-4 w-4 text-white" />
                    </div>

                    {/* Conteúdo da atividade */}
                    <div className="flex-1 min-w-0 pb-6">
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        {/* Header da atividade */}
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getActionColor(activity.action)}>
                            {formatAction(activity.action)}
                          </Badge>
                          <Badge variant="outline">
                            {formatTableName(activity.table_name)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {getRelativeTime(activity.created_at)}
                          </span>
                        </div>

                        {/* Detalhes */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Database className="h-3 w-3" />
                              <span>ID: {activity.record_id?.slice(0, 8)}...</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(activity.created_at).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Informações técnicas */}
                          {(activity.ip_address || activity.user_agent) && (
                            <div className="text-xs text-gray-500 space-y-1">
                              {activity.ip_address && (
                                <div>IP: {activity.ip_address}</div>
                              )}
                              {activity.user_agent && (
                                <div className="truncate">
                                  User Agent: {activity.user_agent}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Preview dos dados alterados */}
                          {(activity.old_values || activity.new_values) && (
                            <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                              {activity.action === 'INSERT' && activity.new_values && (
                                <div>
                                  <span className="font-medium text-green-700">Dados criados:</span>
                                  <div className="mt-1 text-green-600">
                                    {Object.keys(activity.new_values).length} campos
                                  </div>
                                </div>
                              )}
                              
                              {activity.action === 'UPDATE' && (activity.old_values || activity.new_values) && (
                                <div>
                                  <span className="font-medium text-blue-700">Dados alterados:</span>
                                  <div className="mt-1 text-blue-600">
                                    {activity.old_values && activity.new_values ? 
                                      `${Object.keys(activity.new_values).length} campos modificados` :
                                      'Alteração registrada'
                                    }
                                  </div>
                                </div>
                              )}
                              
                              {activity.action === 'DELETE' && activity.old_values && (
                                <div>
                                  <span className="font-medium text-red-700">Dados removidos:</span>
                                  <div className="mt-1 text-red-600">
                                    {Object.keys(activity.old_values).length} campos
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Indicador se há mais atividades */}
            {activities.length === limit && (
              <div className="text-center py-4 text-sm text-gray-500">
                Mostrando as últimas {limit} atividades. 
                Pode haver mais atividades anteriores.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserActivityTimeline;