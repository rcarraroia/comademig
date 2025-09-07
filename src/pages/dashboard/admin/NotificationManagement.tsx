import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  Send, 
  Users, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Calendar,
  DollarSign,
  MessageSquare,
  Settings,
  Eye,
  Trash2,
  Plus
} from 'lucide-react';

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'financial' | 'events' | 'communication';
  created_at: string;
}

interface User {
  id: string;
  email: string;
  nome_completo: string;
  status: string;
}

export default function NotificationManagement() {
  const [activeTab, setActiveTab] = useState('send');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const { toast } = useToast();

  // Estados para envio de notificação
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    category: 'system' as const,
    sendToAll: false,
    selectedUsers: [] as string[],
    actionUrl: ''
  });

  // Estados para template
  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    message: '',
    type: 'info' as const,
    category: 'system' as const
  });

  useEffect(() => {
    loadUsers();
    loadTemplates();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome_completo, status, users!inner(email)')
        .order('nome_completo');

      if (error) throw error;

      const formattedUsers = data?.map(profile => ({
        id: profile.id,
        email: profile.users?.email || '',
        nome_completo: profile.nome_completo || '',
        status: profile.status || 'pendente'
      })) || [];

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários",
        variant: "destructive",
      });
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') { // Ignora erro se tabela não existe
        throw error;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const sendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e mensagem são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (!notificationForm.sendToAll && notificationForm.selectedUsers.length === 0) {
      toast({
        title: "Destinatários obrigatórios",
        description: "Selecione pelo menos um usuário ou marque 'Enviar para todos'",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const targetUsers = notificationForm.sendToAll 
        ? users.map(u => u.id)
        : notificationForm.selectedUsers;

      const notifications = targetUsers.map(userId => ({
        user_id: userId,
        title: notificationForm.title,
        message: notificationForm.message,
        type: notificationForm.type,
        category: notificationForm.category,
        action_url: notificationForm.actionUrl || null,
        read: false
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      toast({
        title: "Notificação enviada!",
        description: `Enviada para ${targetUsers.length} usuário(s)`,
      });

      // Limpar formulário
      setNotificationForm({
        title: '',
        message: '',
        type: 'info',
        category: 'system',
        sendToAll: false,
        selectedUsers: [],
        actionUrl: ''
      });

    } catch (error: any) {
      console.error('Erro ao enviar notificação:', error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!templateForm.name || !templateForm.title || !templateForm.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome, título e mensagem são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('notification_templates')
        .insert({
          name: templateForm.name,
          title: templateForm.title,
          message: templateForm.message,
          type: templateForm.type,
          category: templateForm.category
        });

      if (error) throw error;

      toast({
        title: "Template salvo!",
        description: "Template criado com sucesso",
      });

      // Limpar formulário e recarregar templates
      setTemplateForm({
        name: '',
        title: '',
        message: '',
        type: 'info',
        category: 'system'
      });
      
      loadTemplates();

    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const useTemplate = (template: NotificationTemplate) => {
    setNotificationForm(prev => ({
      ...prev,
      title: template.title,
      message: template.message,
      type: template.type,
      category: template.category
    }));
    setActiveTab('send');
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Template excluído",
        description: "Template removido com sucesso",
      });

      loadTemplates();
    } catch (error: any) {
      console.error('Erro ao excluir template:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'events': return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'communication': return <MessageSquare className="h-4 w-4 text-blue-600" />;
      default: return <Settings className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Notificações</h1>
          <p className="text-muted-foreground">
            Envie notificações para usuários e gerencie templates
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {users.length} usuários
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send">
            <Send className="w-4 h-4 mr-2" />
            Enviar Notificação
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Bell className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history">
            <Eye className="w-4 h-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Enviar Notificação */}
        <TabsContent value="send">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Nova Notificação</CardTitle>
                  <CardDescription>
                    Crie e envie uma notificação para os usuários
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Tipo</Label>
                      <Select 
                        value={notificationForm.type} 
                        onValueChange={(value: any) => 
                          setNotificationForm(prev => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">
                            <div className="flex items-center gap-2">
                              <Info className="h-4 w-4 text-blue-600" />
                              Informação
                            </div>
                          </SelectItem>
                          <SelectItem value="success">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Sucesso
                            </div>
                          </SelectItem>
                          <SelectItem value="warning">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              Aviso
                            </div>
                          </SelectItem>
                          <SelectItem value="error">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              Erro
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Select 
                        value={notificationForm.category} 
                        onValueChange={(value: any) => 
                          setNotificationForm(prev => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4 text-gray-600" />
                              Sistema
                            </div>
                          </SelectItem>
                          <SelectItem value="financial">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              Financeiro
                            </div>
                          </SelectItem>
                          <SelectItem value="events">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-purple-600" />
                              Eventos
                            </div>
                          </SelectItem>
                          <SelectItem value="communication">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                              Comunicação
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={notificationForm.title}
                      onChange={(e) => 
                        setNotificationForm(prev => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="Digite o título da notificação"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Mensagem *</Label>
                    <Textarea
                      id="message"
                      value={notificationForm.message}
                      onChange={(e) => 
                        setNotificationForm(prev => ({ ...prev, message: e.target.value }))
                      }
                      placeholder="Digite a mensagem da notificação"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="actionUrl">URL de Ação (opcional)</Label>
                    <Input
                      id="actionUrl"
                      value={notificationForm.actionUrl}
                      onChange={(e) => 
                        setNotificationForm(prev => ({ ...prev, actionUrl: e.target.value }))
                      }
                      placeholder="/dashboard/pagina-destino"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sendToAll"
                      checked={notificationForm.sendToAll}
                      onCheckedChange={(checked) => 
                        setNotificationForm(prev => ({ 
                          ...prev, 
                          sendToAll: checked,
                          selectedUsers: checked ? [] : prev.selectedUsers
                        }))
                      }
                    />
                    <Label htmlFor="sendToAll">Enviar para todos os usuários</Label>
                  </div>

                  <Button 
                    onClick={sendNotification} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Notificação
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Seleção de Usuários */}
            {!notificationForm.sendToAll && (
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Selecionar Usuários</CardTitle>
                    <CardDescription>
                      Escolha os usuários que receberão a notificação
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={user.id}
                            checked={notificationForm.selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNotificationForm(prev => ({
                                  ...prev,
                                  selectedUsers: [...prev.selectedUsers, user.id]
                                }));
                              } else {
                                setNotificationForm(prev => ({
                                  ...prev,
                                  selectedUsers: prev.selectedUsers.filter(id => id !== user.id)
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <Label htmlFor={user.id} className="flex-1 cursor-pointer">
                            <div>
                              <p className="text-sm font-medium">{user.nome_completo}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </Label>
                          <Badge variant={user.status === 'ativo' ? 'default' : 'secondary'}>
                            {user.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Criar Template */}
            <Card>
              <CardHeader>
                <CardTitle>Criar Template</CardTitle>
                <CardDescription>
                  Crie templates reutilizáveis para notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="templateName">Nome do Template *</Label>
                  <Input
                    id="templateName"
                    value={templateForm.name}
                    onChange={(e) => 
                      setTemplateForm(prev => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Ex: Lembrete de Pagamento"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select 
                      value={templateForm.type} 
                      onValueChange={(value: any) => 
                        setTemplateForm(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Informação</SelectItem>
                        <SelectItem value="success">Sucesso</SelectItem>
                        <SelectItem value="warning">Aviso</SelectItem>
                        <SelectItem value="error">Erro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Categoria</Label>
                    <Select 
                      value={templateForm.category} 
                      onValueChange={(value: any) => 
                        setTemplateForm(prev => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">Sistema</SelectItem>
                        <SelectItem value="financial">Financeiro</SelectItem>
                        <SelectItem value="events">Eventos</SelectItem>
                        <SelectItem value="communication">Comunicação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="templateTitle">Título *</Label>
                  <Input
                    id="templateTitle"
                    value={templateForm.title}
                    onChange={(e) => 
                      setTemplateForm(prev => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Título da notificação"
                  />
                </div>

                <div>
                  <Label htmlFor="templateMessage">Mensagem *</Label>
                  <Textarea
                    id="templateMessage"
                    value={templateForm.message}
                    onChange={(e) => 
                      setTemplateForm(prev => ({ ...prev, message: e.target.value }))
                    }
                    placeholder="Mensagem da notificação"
                    rows={4}
                  />
                </div>

                <Button onClick={saveTemplate} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Salvar Template
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Lista de Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Templates Salvos</CardTitle>
                <CardDescription>
                  Gerencie seus templates de notificação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(template.type)}
                          {getCategoryIcon(template.category)}
                          <h4 className="font-medium">{template.name}</h4>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => useTemplate(template)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {template.title}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {template.message}
                      </p>
                    </div>
                  ))}
                  
                  {templates.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum template criado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Notificações</CardTitle>
              <CardDescription>
                Visualize as notificações enviadas recentemente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Funcionalidade em desenvolvimento. Em breve você poderá visualizar 
                  o histórico completo de notificações enviadas.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}