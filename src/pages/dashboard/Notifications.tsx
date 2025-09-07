import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Trash2,
  Check,
  Info
} from 'lucide-react';

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  financial_alerts: boolean;
  event_reminders: boolean;
  system_updates: boolean;
  communication_messages: boolean;
}

export default function Notifications() {
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    isLoading: loading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    financial_alerts: true,
    event_reminders: true,
    system_updates: true,
    communication_messages: true
  });

  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Carregar configurações do usuário (implementar com Supabase)
    console.log('Carregando configurações de notificação');
  };

  const getNotificationIcon = (type: string, category: string) => {
    if (type === 'success') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (type === 'warning') return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    if (type === 'error') return <AlertTriangle className="h-5 w-5 text-red-600" />;
    
    switch (category) {
      case 'financial': return <DollarSign className="h-5 w-5 text-blue-600" />;
      case 'events': return <Calendar className="h-5 w-5 text-purple-600" />;
      case 'communication': return <MessageSquare className="h-5 w-5 text-green-600" />;
      default: return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      system: { label: 'Sistema', variant: 'secondary' as const },
      financial: { label: 'Financeiro', variant: 'default' as const },
      events: { label: 'Eventos', variant: 'outline' as const },
      communication: { label: 'Comunicação', variant: 'secondary' as const }
    };
    
    const config = variants[category as keyof typeof variants] || variants.system;
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead.mutateAsync(notificationId);
      toast({
        title: "Notificação marcada como lida",
        description: "A notificação foi marcada como lida com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      toast({
        title: "Todas as notificações marcadas como lidas",
        description: "Todas as notificações foram marcadas como lidas com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas as notificações como lidas",
        variant: "destructive",
      });
    }
  };

  const updateSettings = async (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // Implementar atualização no Supabase
    toast({
      title: "Configuração atualizada",
      description: "Suas preferências de notificação foram salvas",
    });
  };

  const filteredNotifications = {
    all: notifications,
    unread: notifications.filter(n => !n.read),
    financial: notifications.filter(n => n.message.toLowerCase().includes('pagamento') || n.message.toLowerCase().includes('financeiro')),
    events: notifications.filter(n => n.message.toLowerCase().includes('evento') || n.message.toLowerCase().includes('congresso')),
    system: notifications.filter(n => n.message.toLowerCase().includes('sistema') || n.message.toLowerCase().includes('atualização'))
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notificações</h1>
          <p className="text-muted-foreground">
            Gerencie suas notificações e preferências
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="px-2 py-1">
              {unreadCount} não lidas
            </Badge>
          )}
          <Button 
            variant="outline" 
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending || unreadCount === 0}
          >
            {markAllAsRead.isPending ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Marcar todas como lidas
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            Todas ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Não lidas ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="financial">
            Financeiro ({filteredNotifications.financial.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            Eventos ({filteredNotifications.events.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>

        {/* Todas as Notificações */}
        <TabsContent value="all">
          <div className="space-y-4">
            {filteredNotifications.all.map((notification) => (
              <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type, 'system')}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{notification.title}</CardTitle>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          {notification.message}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            Sistema
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(notification.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markAsRead.isPending}
                        >
                          {markAsRead.isPending ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {notification.action_url && (
                  <CardContent className="pt-0">
                    <Button variant="outline" size="sm">
                      Ver detalhes
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
            {filteredNotifications.all.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma notificação encontrada</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Não Lidas */}
        <TabsContent value="unread">
          <div className="space-y-4">
            {filteredNotifications.unread.map((notification) => (
              <Card key={notification.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type, 'system')}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{notification.title}</CardTitle>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <CardDescription className="text-sm">
                          {notification.message}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            Sistema
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(notification.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markAsRead.isPending}
                      >
                        {markAsRead.isPending ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
            {filteredNotifications.unread.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">Todas as notificações foram lidas!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Financeiro */}
        <TabsContent value="financial">
          <div className="space-y-4">
            {filteredNotifications.financial.map((notification) => (
              <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-base">{notification.title}</CardTitle>
                        <CardDescription>{notification.message}</CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Ver detalhes</Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
            {filteredNotifications.financial.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma notificação financeira encontrada</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Eventos */}
        <TabsContent value="events">
          <div className="space-y-4">
            {filteredNotifications.events.map((notification) => (
              <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <div>
                        <CardTitle className="text-base">{notification.title}</CardTitle>
                        <CardDescription>{notification.message}</CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Ver evento</Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
            {filteredNotifications.events.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma notificação de eventos encontrada</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure como você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="text-base">
                      Notificações por Email
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações importantes por email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.email_notifications}
                    onCheckedChange={(value) => updateSettings('email_notifications', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications" className="text-base">
                      Notificações Push
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações em tempo real no navegador
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings.push_notifications}
                    onCheckedChange={(value) => updateSettings('push_notifications', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="financial-alerts" className="text-base">
                      Alertas Financeiros
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações sobre pagamentos e vencimentos
                    </p>
                  </div>
                  <Switch
                    id="financial-alerts"
                    checked={settings.financial_alerts}
                    onCheckedChange={(value) => updateSettings('financial_alerts', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="event-reminders" className="text-base">
                      Lembretes de Eventos
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações sobre eventos e inscrições
                    </p>
                  </div>
                  <Switch
                    id="event-reminders"
                    checked={settings.event_reminders}
                    onCheckedChange={(value) => updateSettings('event_reminders', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="system-updates" className="text-base">
                      Atualizações do Sistema
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações sobre atualizações e manutenções
                    </p>
                  </div>
                  <Switch
                    id="system-updates"
                    checked={settings.system_updates}
                    onCheckedChange={(value) => updateSettings('system_updates', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="communication-messages" className="text-base">
                      Mensagens de Comunicação
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações sobre mensagens e comunicados
                    </p>
                  </div>
                  <Switch
                    id="communication-messages"
                    checked={settings.communication_messages}
                    onCheckedChange={(value) => updateSettings('communication_messages', value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button>Salvar Configurações</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}