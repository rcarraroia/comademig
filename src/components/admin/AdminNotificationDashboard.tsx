import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  FileText,
  Eye,
  CheckCheck
} from 'lucide-react';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminNotificationDashboard() {
  const [selectedTab, setSelectedTab] = useState('notifications');
  
  const {
    adminNotifications,
    unreadCount,
    pendingRequests,
    loadingNotifications,
    loadingPendingRequests,
    markAsRead,
    markAllAsRead,
    getNotificationStats,
    hasUnreadNotifications,
    hasPendingRequests
  } = useAdminNotifications();

  const stats = getNotificationStats();

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      'info': Info,
      'success': CheckCircle,
      'warning': AlertTriangle,
      'error': AlertCircle
    };
    return iconMap[type as keyof typeof iconMap] || Info;
  };

  const getNotificationColor = (type: string) => {
    const colorMap = {
      'info': 'text-blue-600',
      'success': 'text-green-600',
      'warning': 'text-yellow-600',
      'error': 'text-red-600'
    };
    return colorMap[type as keyof typeof colorMap] || 'text-gray-600';
  };

  const getBadgeVariant = (type: string) => {
    const variantMap = {
      'info': 'default' as const,
      'success': 'default' as const,
      'warning': 'secondary' as const,
      'error': 'destructive' as const
    };
    return variantMap[type as keyof typeof variantMap] || 'default';
  };

  const getServiceTypeLabel = (serviceType: string) => {
    const labelMap = {
      'filiacao': 'Filiação',
      'certidao': 'Certidão',
      'regularizacao': 'Regularização'
    };
    return labelMap[serviceType as keyof typeof labelMap] || serviceType;
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead.mutateAsync(notificationId);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  if (loadingNotifications) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando notificações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Central de Notificações Administrativas</h2>
        {hasUnreadNotifications && (
          <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
            <CheckCheck className="w-4 h-4 mr-2" />
            Marcar Todas como Lidas
          </Button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium">Não Lidas</p>
                <p className="text-2xl font-bold">{stats.unread}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Pendentes</p>
                <p className="text-2xl font-bold">{stats.pendingRequestsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Pagamentos</p>
                <p className="text-2xl font-bold">{stats.byCategory.payment || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications">
            Notificações ({adminNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Solicitações Pendentes ({pendingRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {adminNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma notificação encontrada</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {adminNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const iconColor = getNotificationColor(notification.type);
                  
                  return (
                    <Card 
                      key={notification.id} 
                      className={`transition-all hover:shadow-md ${
                        !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">{notification.title}</h4>
                                <Badge variant={getBadgeVariant(notification.type)}>
                                  {notification.type}
                                </Badge>
                                {notification.service_type && (
                                  <Badge variant="outline">
                                    {getServiceTypeLabel(notification.service_type)}
                                  </Badge>
                                )}
                                {!notification.read && (
                                  <Badge variant="secondary" className="text-xs">
                                    Nova
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {formatDistanceToNow(new Date(notification.created_at), {
                                    addSuffix: true,
                                    locale: ptBR
                                  })}
                                </span>
                                
                                {notification.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {notification.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="ml-2"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {loadingPendingRequests ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Carregando solicitações pendentes...</p>
              </CardContent>
            </Card>
          ) : pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-500" />
                <p>Nenhuma solicitação pendente</p>
                <p className="text-sm mt-2">Todas as solicitações foram processadas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-yellow-600" />
                          <h4 className="font-medium">
                            {getServiceTypeLabel(request.service_type)}
                          </h4>
                          <Badge variant="secondary">
                            {request.status}
                          </Badge>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Pago
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Usuário:</strong> {request.user_name}</p>
                          <p><strong>Email:</strong> {request.user_email}</p>
                          <p><strong>Valor:</strong> R$ {request.value.toFixed(2)}</p>
                          <p><strong>Pagamento em:</strong> {
                            request.data_pagamento 
                              ? new Date(request.data_pagamento).toLocaleString('pt-BR')
                              : 'Data não informada'
                          }</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Solicitado {formatDistanceToNow(new Date(request.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Alertas importantes */}
      {hasPendingRequests && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Atenção:</strong> Existem {pendingRequests.length} solicitação(ões) paga(s) 
            aguardando processamento administrativo. Acesse os painéis específicos de cada serviço 
            para processar as solicitações.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}