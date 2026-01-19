import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  X, 
  Clock, 
  AlertTriangle, 
  Calendar,
  Settings,
  CheckCircle
} from 'lucide-react';
import { useSubscriptionNotifications } from '@/hooks/useSubscriptionNotifications';
import { useSubscriptionActions } from '@/hooks/useSubscriptionActions';

export default function SubscriptionNotifications() {
  const { 
    notifications, 
    hasActiveNotifications, 
    dismissNotification, 
    settings, 
    updateSettings 
  } = useSubscriptionNotifications();
  
  const { redirectToRenewal } = useSubscriptionActions();

  if (!hasActiveNotifications) {
    return null;
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

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') {
      return 'border-red-200 bg-red-50';
    }
    if (priority === 'medium') {
      return 'border-orange-200 bg-orange-50';
    }
    return 'border-blue-200 bg-blue-50';
  };

  const getPriorityBadge = (priority: string) => {
    const configs = {
      high: { label: 'Urgente', variant: 'destructive' as const },
      medium: { label: 'Importante', variant: 'secondary' as const },
      low: { label: 'Informativo', variant: 'outline' as const }
    };

    const config = configs[priority as keyof typeof configs] || configs.low;
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5" />
          Notificações de Assinatura
          <Badge variant="secondary" className="ml-auto">
            {notifications.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map((notification) => (
          <Alert 
            key={notification.id} 
            className={`${getNotificationColor(notification.type, notification.priority)} border-l-4`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    {getPriorityBadge(notification.priority)}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissNotification(notification.id)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    title="Dispensar por 1 dia"
                  >
                    <X className="h-3 w-3" />
                  </Button>
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
                      className="h-8"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Renovar Agora
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => dismissNotification(notification.id, 'week')}
                      className="h-8 text-xs"
                    >
                      Lembrar em 1 semana
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        ))}
        
        {/* Configurações rápidas */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Notificações ativas</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateSettings({ enabled: !settings.enabled })}
              className="h-6 px-2 text-xs"
            >
              <Settings className="h-3 w-3 mr-1" />
              {settings.enabled ? 'Desativar' : 'Ativar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}