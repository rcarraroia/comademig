import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMemberTypes } from '@/hooks/useMemberTypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  Send, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Info,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  active: boolean;
  created_at: string;
}

interface NotificationRecipient {
  id: string;
  nome_completo: string;
  status: string;
  tipo_membro: string;
}

export default function NotificationManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [memberTypeOptions, setMemberTypeOptions] = useState<string[]>([]);
  
  // Form states
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    recipients: 'all' as 'all' | 'specific' | 'type',
    specificUsers: [] as string[],
    memberType: '',
    actionUrl: ''
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    message: '',
    type: 'info' as const
  });

  useEffect(() => {
    loadRecipients();
    loadMemberTypes();
    loadTemplates();
  }, []);

  const loadRecipients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome_completo, status, tipo_membro')
        .eq('status', 'ativo')
        .order('nome_completo');

      if (error) throw error;
      
      const formattedRecipients = data?.map(profile => ({
        id: profile.id,
        nome_completo: profile.nome_completo || 'Nome não informado',
        status: profile.status || 'ativo',
        tipo_membro: profile.tipo_membro || 'membro'
      })) || [];

      setRecipients(formattedRecipients);
      console.log('Destinatários carregados:', formattedRecipients.length);
    } catch (error) {
      console.error('Erro ao carregar destinatários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários",
        variant: "destructive",
      });
    }
  };

  const loadMemberTypes = async () => {
    try {
      // Buscar tipos únicos da tabela profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('tipo_membro')
        .not('tipo_membro', 'is', null)
        .eq('status', 'ativo');

      if (error) throw error;

      const uniqueTypes = [...new Set(data?.map(p => p.tipo_membro).filter(Boolean))];
      setMemberTypeOptions(uniqueTypes);
      console.log('Tipos de membro encontrados:', uniqueTypes);
    } catch (error) {
      console.error('Erro ao carregar tipos de membro:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setTemplates(data || []);
      console.log('Templates carregados:', data?.length || 0);
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

    setLoading(true);
    try {
      let targetUsers: string[] = [];

      // Determinar destinatários
      if (notificationForm.recipients === 'all') {
        targetUsers = recipients.map(r => r.id);
      } else if (notificationForm.recipients === 'specific') {
        targetUsers = notificationForm.specificUsers;
      } else if (notificationForm.recipients === 'type') {
        if (!notificationForm.memberType) {
          toast({
            title: "Tipo de membro obrigatório",
            description: "Selecione um tipo de membro",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        targetUsers = recipients
          .filter(r => r.tipo_membro === notificationForm.memberType)
          .map(r => r.id);
      }

      if (targetUsers.length === 0) {
        toast({
          title: "Nenhum destinatário",
          description: "Nenhum usuário foi selecionado para receber a notificação",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log(`Enviando notificação para ${targetUsers.length} usuários`);

      // Criar notificações para cada usuário
      const notifications = targetUsers.map(userId => ({
        user_id: userId,
        title: notificationForm.title,
        message: notificationForm.message,
        type: notificationForm.type,
        action_url: notificationForm.actionUrl || null,
        read: false
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('Erro ao inserir notificações:', error);
        throw error;
      }

      toast({
        title: "Notificações enviadas!",
        description: `${targetUsers.length} notificação(ões) enviada(s) com sucesso`,
      });

      // Reset form
      setNotificationForm({
        title: '',
        message: '',
        type: 'info',
        recipients: 'all',
        specificUsers: [],
        memberType: '',
        actionUrl: ''
      });

    } catch (error: any) {
      console.error('Erro ao enviar notificações:', error);
      toast({
        title: "Erro ao enviar notificações",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    if (!templateForm.name || !templateForm.title || !templateForm.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome, título e mensagem são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('notification_templates')
        .insert({
          name: templateForm.name,
          title: templateForm.title,
          message: templateForm.message,
          type: templateForm.type,
          active: true
        });

      if (error) throw error;

      toast({
        title: "Template criado!",
        description: "O template foi criado com sucesso",
      });

      setTemplateForm({
        name: '',
        title: '',
        message: '',
        type: 'info'
      });

      loadTemplates();

    } catch (error: any) {
      console.error('Erro ao criar template:', error);
      toast({
        title: "Erro ao criar template",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  };

  const useTemplate = (template: NotificationTemplate) => {
    setNotificationForm(prev => ({
      ...prev,
      title: template.title,
      message: template.message,
      type: template.type
    }));
    
    toast({
      title: "Template aplicado",
      description: `Template "${template.name}" foi aplicado ao formulário`,
    });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Notificações</h1>
          <p className="text-muted-foreground">
            Envie notificações para usuários e gerencie templates
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Users className="w-4 h-4 mr-1" />
          {recipients.length} usuários ativos
        </Badge>
      </div>

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">
            <Send className="w-4 h-4 mr-2" />
            Enviar Notificação
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Bell className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Enviar Notificação */}
        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Nova Notificação</CardTitle>
              <CardDescription>
                Crie e envie uma notificação para os usuários
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Digite o título da notificação"
                  />
                </div>
                
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
              </div>

              <div>
                <Label htmlFor="message">Mensagem *</Label>
                <Textarea
                  id="message"
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Digite a mensagem da notificação"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="actionUrl">URL de Ação (opcional)</Label>
                <Input
                  id="actionUrl"
                  value={notificationForm.actionUrl}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, actionUrl: e.target.value }))}
                  placeholder="/dashboard/pagina-destino"
                />
              </div>

              <div>
                <Label>Destinatários</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="all-users"
                      name="recipients"
                      checked={notificationForm.recipients === 'all'}
                      onChange={() => setNotificationForm(prev => ({ ...prev, recipients: 'all' }))}
                    />
                    <Label htmlFor="all-users">Todos os usuários ativos ({recipients.length})</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="by-type"
                      name="recipients"
                      checked={notificationForm.recipients === 'type'}
                      onChange={() => setNotificationForm(prev => ({ ...prev, recipients: 'type' }))}
                    />
                    <Label htmlFor="by-type">Por tipo de membro</Label>
                  </div>

                  {notificationForm.recipients === 'type' && (
                    <Select 
                      value={notificationForm.memberType} 
                      onValueChange={(value) => setNotificationForm(prev => ({ ...prev, memberType: value }))}
                    >
                      <SelectTrigger className="ml-6">
                        <SelectValue placeholder="Selecione o tipo de membro" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberTypeOptions.map(type => (
                          <SelectItem key={type} value={type}>
                            {type} ({recipients.filter(r => r.tipo_membro === type).length} usuários)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <Button 
                onClick={sendNotification} 
                disabled={loading || !notificationForm.title || !notificationForm.message}
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
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Lembrete de Pagamento"
                  />
                </div>

                <div>
                  <Label htmlFor="templateTitle">Título *</Label>
                  <Input
                    id="templateTitle"
                    value={templateForm.title}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Título da notificação"
                  />
                </div>

                <div>
                  <Label htmlFor="templateMessage">Mensagem *</Label>
                  <Textarea
                    id="templateMessage"
                    value={templateForm.message}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Mensagem da notificação"
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Tipo</Label>
                  <Select 
                    value={templateForm.type} 
                    onValueChange={(value: any) => setTemplateForm(prev => ({ ...prev, type: value }))}
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

                <Button 
                  onClick={createTemplate}
                  disabled={!templateForm.name || !templateForm.title || !templateForm.message}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Template
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
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div key={template.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getTypeIcon(template.type)}
                            <h4 className="font-medium">{template.name}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{template.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{template.message}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => useTemplate(template)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {templates.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum template criado ainda</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}