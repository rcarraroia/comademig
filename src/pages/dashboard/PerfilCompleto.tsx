import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Edit, User, MapPin, Church, Settings, Eye, Download, Bell, Shield, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/hooks/useResponsive";
import { useLoadingState } from "@/hooks/useLoadingState";
import { useAccessibility } from "@/hooks/useAccessibility";
import { useProfileValidation } from "@/hooks/useProfileValidation";
import { PhotoUpload } from "@/components/forms/PhotoUpload";
import { UserAvatar } from "@/components/common/UserAvatar";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ProgressBar } from "@/components/feedback/ProgressBar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PerfilCompleto = () => {
  const { user, profile, updateProfile, loading: authLoading } = useAuth();
  const { isMobile } = useResponsive();
  const { setLoading, isLoading } = useLoadingState();
  const { announceToScreenReader } = useAccessibility();
  const { getProfileCompletionPercentage } = useProfileValidation();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("dados");
  
  const [formData, setFormData] = useState({
    nome_completo: profile?.nome_completo || "",
    cpf: profile?.cpf || "",
    rg: profile?.rg || "",
    data_nascimento: profile?.data_nascimento || "",
    telefone: profile?.telefone || "",
    endereco: profile?.endereco || "",
    cidade: profile?.cidade || "",
    estado: profile?.estado || "",
    cep: profile?.cep || "",
    igreja: profile?.igreja || "",
    cargo: profile?.cargo || "",
    data_ordenacao: profile?.data_ordenacao || "",
    bio: profile?.bio || "",
  });

  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true,
      events: true,
      financial: true,
      documents: false
    },
    privacy: {
      showProfile: true,
      showContact: false,
      showMinistry: true
    }
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        nome_completo: profile.nome_completo || "",
        cpf: profile.cpf || "",
        rg: profile.rg || "",
        data_nascimento: profile.data_nascimento || "",
        telefone: profile.telefone || "",
        endereco: profile.endereco || "",
        cidade: profile.cidade || "",
        estado: profile.estado || "",
        cep: profile.cep || "",
        igreja: profile.igreja || "",
        cargo: profile.cargo || "",
        data_ordenacao: profile.data_ordenacao || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  const completionPercentage = getProfileCompletionPercentage();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading('save', true);
    
    try {
      const { error } = await updateProfile(formData);
      
      if (error) {
        throw new Error(error.message);
      }
      
      setIsEditing(false);
      announceToScreenReader("Dados salvos com sucesso");
      
      toast({
        title: "Dados atualizados",
        description: "Suas informações foram salvas com sucesso",
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading('save', false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        nome_completo: profile.nome_completo || "",
        cpf: profile.cpf || "",
        rg: profile.rg || "",
        data_nascimento: profile.data_nascimento || "",
        telefone: profile.telefone || "",
        endereco: profile.endereco || "",
        cidade: profile.cidade || "",
        estado: profile.estado || "",
        cep: profile.cep || "",
        igreja: profile.igreja || "",
        cargo: profile.cargo || "",
        data_ordenacao: profile.data_ordenacao || "",
        bio: profile.bio || "",
      });
    }
    setIsEditing(false);
    announceToScreenReader("Edição cancelada");
  };

  const handleDownloadData = async () => {
    try {
      const { data: userData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

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

      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meus-dados-comademig-${new Date().toISOString().split('T')[0]}.json`;
      
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

  if (authLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-comademig-blue">Meu Perfil</h1>
          <p className="text-gray-600">Gerencie suas informações e configurações</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading('save')}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isLoading('save')}
                className="bg-comademig-gold hover:bg-comademig-gold/90"
              >
                {isLoading('save') ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-comademig-blue hover:bg-comademig-blue/90"
            >
              <Edit size={16} className="mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <ProgressBar
            value={completionPercentage}
            showLabel
            label="Completude do Perfil"
            variant={completionPercentage >= 80 ? 'success' : completionPercentage >= 50 ? 'warning' : 'error'}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          <TabsTrigger value="privacidade">Privacidade</TabsTrigger>
          <TabsTrigger value="acoes">Ações</TabsTrigger>
        </TabsList>

        {/* Dados Pessoais */}
        <TabsContent value="dados" className="space-y-6">
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
            {/* Photo Section */}
            <Card className={isMobile ? '' : 'lg:col-span-1'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={20} />
                  Foto do Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <UserAvatar size="xl" />
                
                {isEditing && <PhotoUpload />}
                
                <div className="text-center">
                  <h3 className="font-semibold">{profile?.nome_completo}</h3>
                  <p className="text-sm text-gray-600">{profile?.cargo}</p>
                  <Badge className="mt-2">
                    {profile?.status === 'ativo' ? 'Membro Ativo' : 'Pendente'}
                  </Badge>
                </div>
                
                <p className="text-xs text-center text-muted-foreground">
                  Esta foto será usada em seu perfil, avatar e carteira digital
                </p>
              </CardContent>
            </Card>

            {/* Personal Data */}
            <Card className={isMobile ? '' : 'lg:col-span-2'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={20} />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome_completo">Nome Completo *</Label>
                    <Input
                      id="nome_completo"
                      value={formData.nome_completo}
                      onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      disabled={!isEditing}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rg">RG</Label>
                    <Input
                      id="rg"
                      value={formData.rg}
                      onChange={(e) => handleInputChange('rg', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      disabled={!isEditing}
                      required
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Para alterar o email, entre em contato com o suporte
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Biografia (opcional)</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Conte um pouco sobre você, seu ministério e experiência..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin size={20} />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="endereco">Endereço *</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => handleInputChange('endereco', e.target.value)}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => handleInputChange('cidade', e.target.value)}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cep">CEP *</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => handleInputChange('cep', e.target.value)}
                      disabled={!isEditing}
                      required
                      placeholder="00000-000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado *</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => handleInputChange('estado', e.target.value)}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ministry Data */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Church size={20} />
                  Dados Ministeriais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="igreja">Igreja Local *</Label>
                    <Input
                      id="igreja"
                      value={formData.igreja}
                      onChange={(e) => handleInputChange('igreja', e.target.value)}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cargo">Cargo/Ministério</Label>
                    <Input
                      id="cargo"
                      value={formData.cargo}
                      onChange={(e) => handleInputChange('cargo', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="data_ordenacao">Data de Ordenação</Label>
                    <Input
                      id="data_ordenacao"
                      type="date"
                      value={formData.data_ordenacao}
                      onChange={(e) => handleInputChange('data_ordenacao', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="configuracoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={20} />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">E-mail</p>
                    <p className="text-sm text-gray-600">Receber notificações por e-mail</p>
                  </div>
                  <Switch 
                    checked={preferences.notifications.email} 
                    onCheckedChange={(value) => 
                      setPreferences(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, email: value }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS</p>
                    <p className="text-sm text-gray-600">Receber alertas por SMS</p>
                  </div>
                  <Switch 
                    checked={preferences.notifications.sms} 
                    onCheckedChange={(value) => 
                      setPreferences(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, sms: value }
                      }))
                    }
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Tipos de Notificação</h4>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Eventos e congressos</span>
                    <Switch 
                      checked={preferences.notifications.events} 
                      onCheckedChange={(value) => 
                        setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, events: value }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Financeiro e pagamentos</span>
                    <Switch 
                      checked={preferences.notifications.financial} 
                      onCheckedChange={(value) => 
                        setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, financial: value }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacidade */}
        <TabsContent value="privacidade" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={20} />
                Configurações de Privacidade
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
                    checked={preferences.privacy.showProfile} 
                    onCheckedChange={(value) => 
                      setPreferences(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, showProfile: value }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Compartilhar contato</p>
                    <p className="text-sm text-gray-600">Permitir que outros vejam seu contato</p>
                  </div>
                  <Switch 
                    checked={preferences.privacy.showContact} 
                    onCheckedChange={(value) => 
                      setPreferences(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, showContact: value }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Informações ministeriais</p>
                    <p className="text-sm text-gray-600">Mostrar igreja e campo no perfil</p>
                  </div>
                  <Switch 
                    checked={preferences.privacy.showMinistry} 
                    onCheckedChange={(value) => 
                      setPreferences(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, showMinistry: value }
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock size={20} />
                Segurança da Conta
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
        </TabsContent>

        {/* Ações */}
        <TabsContent value="acoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ações do Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => window.open(`/dashboard/perfil-publico/${user?.id}`, '_blank')}
                >
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 mt-1" />
                    <div className="text-left">
                      <p className="font-medium">Ver Perfil Público</p>
                      <p className="text-sm text-gray-600">Visualize como outros veem seu perfil</p>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={handleDownloadData}
                >
                  <div className="flex items-start gap-3">
                    <Download className="h-5 w-5 mt-1" />
                    <div className="text-left">
                      <p className="font-medium">Baixar Meus Dados</p>
                      <p className="text-sm text-gray-600">Exportar todos os seus dados (LGPD)</p>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Helper Text */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-700">
            <strong>Dica:</strong> Campos marcados com * são obrigatórios. 
            Mantenha seus dados atualizados para aproveitar melhor os recursos da plataforma.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerfilCompleto;