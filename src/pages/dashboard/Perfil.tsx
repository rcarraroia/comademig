
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Eye, 
  Mail,
  Smartphone,
  Settings,
  LogOut,
  Download,
  Trash2
} from "lucide-react";

const Perfil = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    events: true,
    financial: true,
    documents: false
  });

  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showContact: false,
    showMinistry: true
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
  };

  const handleDownloadData = async () => {
    try {
      // Buscar todos os dados do usuário
      const { data: userData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      // Criar objeto com todos os dados
      const allData = {
        usuario: {
          id: user?.id,
          email: user?.email,
          created_at: user?.created_at
        },
        perfil: userData,
        data_exportacao: new Date().toISOString(),
        observacoes: "Dados exportados conforme LGPD - Lei Geral de Proteção de Dados"
      };

      // Converter para JSON e criar arquivo
      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Criar link de download
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meus-dados-comademig-${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download concluído",
        description: "Seus dados foram baixados com sucesso",
      });

    } catch (error: any) {
      console.error('Erro ao baixar dados:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar seus dados",
        variant: "destructive",
      });
    }
  };

  const activities = [
    {
      action: "Login realizado",
      date: "2024-01-20 14:30",
      device: "Chrome - Windows",
      location: "Belo Horizonte, MG"
    },
    {
      action: "Dados atualizados",
      date: "2024-01-18 09:15",
      device: "Mobile App - Android",
      location: "Belo Horizonte, MG"
    },
    {
      action: "Carteira baixada",
      date: "2024-01-15 16:45",
      device: "Chrome - Windows",
      location: "Belo Horizonte, MG"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-comademig-blue">Configurações do Perfil</h1>
        <p className="text-gray-600">Gerencie suas preferências e configurações de conta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Meu Perfil</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="bg-comademig-blue text-white text-xl">JS</AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold">João Silva Santos</h3>
              <p className="text-gray-600">Pastor Presidente</p>
              <Badge className="mt-2">Membro Ativo</Badge>
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Membro desde:</span>
                <span>Janeiro 2005</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Último acesso:</span>
                <span>Hoje, 14:30</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Situação:</span>
                <Badge className="bg-green-100 text-green-800">Regular</Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open(`/dashboard/perfil-publico/${user?.id}`, '_blank')}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Perfil Público
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleDownloadData}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar Meus Dados
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Segurança da Conta</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current-password">Senha Atual</Label>
                  <Input id="current-password" type="password" placeholder="••••••••" />
                </div>
                <div>
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input id="new-password" type="password" placeholder="••••••••" />
                </div>
              </div>
              <Button className="bg-comademig-blue hover:bg-comademig-blue/90">
                <Lock className="mr-2 h-4 w-4" />
                Alterar Senha
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notificações</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="font-medium">E-mail</p>
                      <p className="text-sm text-gray-600">Receber notificações por e-mail</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.email} 
                    onCheckedChange={(value) => handleNotificationChange('email', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="font-medium">SMS</p>
                      <p className="text-sm text-gray-600">Receber alertas por SMS</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.sms} 
                    onCheckedChange={(value) => handleNotificationChange('sms', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="font-medium">Push</p>
                      <p className="text-sm text-gray-600">Notificações do navegador</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.push} 
                    onCheckedChange={(value) => handleNotificationChange('push', value)}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Tipos de Notificação</h4>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Eventos e congressos</span>
                    <Switch 
                      checked={notifications.events} 
                      onCheckedChange={(value) => handleNotificationChange('events', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Financeiro e pagamentos</span>
                    <Switch 
                      checked={notifications.financial} 
                      onCheckedChange={(value) => handleNotificationChange('financial', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Documentos e certidões</span>
                    <Switch 
                      checked={notifications.documents} 
                      onCheckedChange={(value) => handleNotificationChange('documents', value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Privacidade</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mostrar perfil no diretório</p>
                    <p className="text-sm text-gray-600">Outros membros podem ver seu perfil</p>
                  </div>
                  <Switch 
                    checked={privacy.showProfile} 
                    onCheckedChange={(value) => handlePrivacyChange('showProfile', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Compartilhar contato</p>
                    <p className="text-sm text-gray-600">Permitir que outros vejam seu contato</p>
                  </div>
                  <Switch 
                    checked={privacy.showContact} 
                    onCheckedChange={(value) => handlePrivacyChange('showContact', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Informações ministeriais</p>
                    <p className="text-sm text-gray-600">Mostrar igreja e campo no perfil</p>
                  </div>
                  <Switch 
                    checked={privacy.showMinistry} 
                    onCheckedChange={(value) => handlePrivacyChange('showMinistry', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Settings className="h-4 w-4 text-gray-600 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.device}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{activity.date}</span>
                        <span>{activity.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Desativar Conta</h4>
                <p className="text-sm text-red-700 mb-3">
                  Ao desativar sua conta, você perderá acesso ao sistema, mas seus dados serão mantidos.
                </p>
                <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  Desativar Conta
                </Button>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Excluir Conta</h4>
                <p className="text-sm text-red-700 mb-3">
                  Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
                </p>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Conta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
