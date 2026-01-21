import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Settings,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSubscriptionNotifications } from '@/hooks/useSubscriptionNotifications';
import { useSubscriptionActions } from '@/hooks/useSubscriptionActions';
import ReminderSettings from './ReminderSettings';

interface DashboardRemindersProps {
  compact?: boolean; // Versão compacta para sidebar ou header
  showSettings?: boolean; // Mostrar botão de configurações
}

export default function DashboardReminders({ 
  compact = false, 
  showSettings = true 
}: DashboardRemindersProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const { 
    notifications, 
    hasActiveNotifications, 
    dismissNotification, 
    settings,
    getNotificationCounts 
  } = useSubscriptionNotifications();
  
  const { redirectToRenewal } = useSubscriptionActions();
  const counts = getNotificationCounts();

  // Se não há notificações e está em modo compacto, não mostrar nada
  if (!hasActiveNotifications && compact) {
    return null;
  }

  // Se notificações estão desabilitadas, mostrar apenas indicador
  if (!settings.enabled) {
    return compact ? null : (
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <EyeOff className="h-4 w-4" />
              <span className="text-sm">Lembretes desativados</span>
            </div>
            {showSettings && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSettingsModal(true)}
              >
                <Settings className="h-3 w-3 mr-1" />
                Ativar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'expiring_soon':
        return <Calendar className="h-4 w-4 text-orange-600" />;
      case 'expired':
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'pending_payment':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  // Versão compacta (para sidebar ou header)
  if (compact) {
    const urgentNotifications = notifications.filter(n => n.priority === 'high');
    const hasUrgent = urgentNotifications.length > 0;

    return (
      <div className="space-y-2">
        {/* Indicador compacto */}
        <div 
          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
            hasUrgent ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className={`h-4 w-4 ${hasUrgent ? 'text-red-600' : 'text-orange-600'}`} />
              <span className="text-sm font-medium">
                {counts.total} lembrete{counts.total !== 1 ? 's' : ''}
              </span>
              {hasUrgent && (
                <Badge variant="destructive" className="text-xs">
                  {counts.high} urgente{counts.high !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {/* Lista expandida */}
        {isExpanded && (
          <div className="space-y-2 pl-2">
            {notifications.slice(0, 3).map((notification) => (
              <Alert 
                key={notification.id} 
                className={`${getPriorityColor(notification.priority)} border-l-4 p-3`}
              >
                <div className="flex items-start gap-2">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{notification.title}</div>
                    <AlertDescription className="text-xs mt-1">
                      {notification.message}
                    </AlertDescription>
                    {notification.actionRequired && (
                      <Button
                        onClick={redirectToRenewal}
                        size="sm"
                        className="h-6 text-xs mt-2"
                      >
                        Renovar
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(notification.id);
                    }}
                    className="h-5 w-5 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </Alert>
            ))}
            
            {notifications.length > 3 && (
              <div className="text-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSettingsModal(true)}
                  className="text-xs"
                >
                  Ver todos ({notifications.length - 3} mais)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Versão completa (para dashboard principal)
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Lembretes Ativos
              {hasActiveNotifications && (
                <Badge variant="secondary">
                  {counts.total}
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              {showSettings && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSettingsModal(true)}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Configurar
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        {isExpanded && (
          <CardContent>
            {hasActiveNotifications ? (
              <div className="space-y-3">
                {/* Resumo por prioridade */}
                <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{counts.high}</div>
                    <div className="text-xs text-gray-600">Urgentes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{counts.medium}</div>
                    <div className="text-xs text-gray-600">Importantes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{counts.actionRequired}</div>
                    <div className="text-xs text-gray-600">Ação Necessária</div>
                  </div>
                </div>

                {/* Lista de notificações */}
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <Alert 
                      key={notification.id} 
                      className={`${getPriorityColor(notification.priority)} border-l-4`}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={notification.priority === 'high' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {notification.priority === 'high' ? 'Urgente' : 
                                 notification.priority === 'medium' ? 'Importante' : 'Info'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => dismissNotification(notification.id)}
                                className="h-5 w-5 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <AlertDescription className="text-sm mb-3">
                            {notification.message}
                            {notification.daysUntilExpiration !== null && (
                              <span className="block mt-1 text-xs text-gray-600">
                                {notification.daysUntilExpiration === 0 
                                  ? 'Vence hoje!' 
                                  : `${notification.daysUntilExpiration} dia${notification.daysUntilExpiration > 1 ? 's' : ''} restante${notification.daysUntilExpiration > 1 ? 's' : ''}`
                                }
                              </span>
                            )}
                          </AlertDescription>
                          
                          {notification.actionRequired && (
                            <div className="flex gap-2">
                              <Button
                                onClick={redirectToRenewal}
                                size="sm"
                                className="h-7"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Renovar Agora
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => dismissNotification(notification.id, 'week')}
                                className="h-7 text-xs"
                              >
                                Lembrar em 1 semana
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-3" />
                <p className="text-sm text-gray-600 mb-2">
                  Nenhum lembrete ativo no momento
                </p>
                <p className="text-xs text-gray-500">
                  Você será notificado quando sua assinatura estiver próxima do vencimento
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Modal de Configurações */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <ReminderSettings onClose={() => setShowSettingsModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}