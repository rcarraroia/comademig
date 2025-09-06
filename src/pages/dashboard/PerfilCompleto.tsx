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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Edit, User, MapPin, Church, Settings, Eye, Download, Bell, Shield, Lock, Activity, AlertTriangle, LogOut, Trash2, Link as LinkIcon, Camera, Globe, CreditCard, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/hooks/useResponsive";
import { useLoadingState } from "@/hooks/useLoadingState";
import { useAccessibility } from "@/hooks/useAccessibility";
import { useProfileValidation } from "@/hooks/useProfileValidation";
import { useActiveSubscription } from "@/hooks/useUserSubscriptions";
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
  const { subscription, isLoading: loadingSubscription, hasSubscription } = useActiveSubscription();
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

  const [publicProfile, setPublicProfile] = useState({
    enabled: false,
    bio: "",
    photo_url: "",
    social_links: {
      facebook: "",
      instagram: "",
      linkedin: "",
      website: ""
    }
  });

  // Atividades recentes simuladas
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
    },
    {
      action: "Perfil visualizado",
      date: "2024-01-12 11:20",
      device: "Safari - iPhone",
      location: "Belo Horizonte, MG"
    }
  ];

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
      // Formatar datas corretamente antes de salvar
      const dataToSave = {
        ...formData,
        data_nascimento: formData.data_nascimento || null,
        data_ordenacao: formData.data_ordenacao || null,
      };
      
      const { error } = await updateProfile(dataToSave);
      
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

  const handleChangePassword = async () => {
    try {
      // Implementar mudança de senha via Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '', {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      
      toast({
        title: "Email enviado",
        description: "Verifique seu email para redefinir a senha",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewPublicProfile = () => {
    // Abrir perfil público em nova aba
    window.open(`/dashboard/perfil-publico/${user?.id}`, '_blank');
  };

  const handleDownloadData = async () => {
    try {
      setLoading('download', true);
      
      // Buscar dados do perfil
      const { data: userData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Buscar dados da carteira digital se existir
      const { data: carteiraData } = await supabase
        .from('carteira_digital')
        .select('*')
        .eq('user_id', user?.id);

      // Organizar todos os dados
      const allData = {
        informacoes_gerais: {
          data_exportacao: new Date().toLocaleString('pt-BR'),
          usuario_id: user?.id,
          email: user?.email,
          data_cadastro: user?.created_at ? new Date(user.created_at).toLocaleString('pt-BR') : null,
          observacoes: "Dados exportados conforme LGPD - Lei Geral de Proteção de Dados Pessoais"
        },
        dados_pessoais: {
          nome_completo: userData?.nome_completo || null,
          cpf: userData?.cpf || null,
          rg: userData?.rg || null,
          data_nascimento: userData?.data_nascimento || null,
          telefone: userData?.telefone || null,
          endereco: userData?.endereco || null,
          cidade: userData?.cidade || null,
          estado: userData?.estado || null,
          cep: userData?.cep || null,
          biografia: userData?.bio || null
        },
        dados_ministeriais: {
          igreja: userData?.igreja || null,
          cargo: userData?.cargo || null,
          data_ordenacao: userData?.data_ordenacao || null,
          tipo_membro: userData?.tipo_membro || null,
          status: userData?.status || null
        },
        carteira_digital: carteiraData?.map(carteira => ({
          numero_carteira: carteira.numero_carteira,
          data_emissao: carteira.data_emissao ? new Date(carteira.data_emissao).toLocaleString('pt-BR') : null,
          data_validade: carteira.data_validade ? new Date(carteira.data_validade).toLocaleString('pt-BR') : null,
          status: carteira.status,
          qr_code_url: carteira.qr_code
        })) || [],
        configuracoes_sistema: {
          foto_perfil_url: userData?.foto_url || null,
          data_ultima_atualizacao: userData?.updated_at ? new Date(userData.updated_at).toLocaleString('pt-BR') : null
        },
        direitos_lgpd: {
          direito_acesso: "Você tem direito de acessar seus dados pessoais",
          direito_retificacao: "Você pode solicitar correção de dados incorretos",
          direito_exclusao: "Você pode solicitar a exclusão de seus dados",
          direito_portabilidade: "Você pode solicitar a portabilidade de seus dados",
          contato_dpo: "Para exercer seus direitos, entre em contato através do suporte"
        }
      };

      // Criar arquivo JSON
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
        description: "Seus dados foram baixados com sucesso em formato JSON",
      });

    } catch (error: any) {
      console.error('Erro ao baixar dados:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar seus dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading('download', false);
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="perfil-publico">Perfil Público</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          <TabsTrigger value="privacidade">Privacidade</TabsTrigger>
          <TabsTrigger value="atividade">Atividade Recente</TabsTrigger>
          <TabsTrigger value="zona-perigo">Zona de Perigo</TabsTrigger>
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

            {/* Subscription Info */}
            {hasSubscription && subscription && (
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard size={20} />
                    Assinatura Ativa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="border-green-200 bg-green-50">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <div className="space-y-2">
                        <div>
                          <strong>Plano:</strong> {subscription.subscription_plans?.name}
                        </div>
                        <div>
                          <strong>Cargo Ministerial:</strong> {subscription.member_types?.name}
                        </div>
                        <div>
                          <strong>Status:</strong> <Badge className="ml-1">{subscription.status === 'active' ? 'Ativo' : subscription.status}</Badge>
                        </div>
                        <div>
                          <strong>Início:</strong> {new Date(subscription.start_date).toLocaleDateString('pt-BR')}
                        </div>
                        {subscription.end_date && (
                          <div>
                            <strong>Término:</strong> {new Date(subscription.end_date).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

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
                      disabled={!isEditing || (hasSubscription && subscription?.member_types?.name)}
                      className={hasSubscription && subscription?.member_types?.name ? 'bg-gray-100' : ''}
                    />
                    {hasSubscription && subscription?.member_types?.name && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Cargo definido pela assinatura ativa: {subscription.member_types.name}
                      </p>
                    )}
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

        {/* Perfil Público */}
        <TabsContent value="perfil-publico" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe size={20} />
                Perfil Público
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configure como outras pessoas podem ver seu perfil publicamente
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Habilitar perfil público */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Ativar Perfil Público</h4>
                  <p className="text-sm text-gray-600">
                    Permite que outras pessoas vejam seu perfil através de um link público
                  </p>
                </div>
                <Switch 
                  checked={publicProfile.enabled} 
                  onCheckedChange={(value) => 
                    setPublicProfile(prev => ({ ...prev, enabled: value }))
                  }
                />
              </div>

              {publicProfile.enabled && (
                <>
                  {/* Foto do perfil público */}
                  <div>
                    <Label htmlFor="public-photo">Foto do Perfil Público</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <UserAvatar size="lg" />
                      <div className="flex-1">
                        <PhotoUpload 
                          onUploadSuccess={(url) => {
                            setFormData(prev => ({ ...prev, foto_url: url }));
                            toast({
                              title: "Foto atualizada",
                              description: "Sua foto de perfil foi atualizada com sucesso",
                            });
                          }}
                        >
                          <Button variant="outline" size="sm">
                            <Camera className="mr-2 h-4 w-4" />
                            Alterar Foto
                          </Button>
                        </PhotoUpload>
                        <p className="text-xs text-gray-500 mt-1">
                          Use uma foto diferente da sua carteira digital, se desejar
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Biografia pública */}
                  <div>
                    <Label htmlFor="public-bio">Biografia Pública</Label>
                    <Textarea
                      id="public-bio"
                      value={publicProfile.bio}
                      onChange={(e) => 
                        setPublicProfile(prev => ({ ...prev, bio: e.target.value }))
                      }
                      placeholder="Escreva uma breve biografia sobre você, seu ministério e experiência..."
                      rows={4}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Esta biografia será visível no seu perfil público
                    </p>
                  </div>

                  {/* Links sociais */}
                  <div>
                    <Label>Links e Redes Sociais</Label>
                    <div className="mt-2 space-y-3">
                      <div>
                        <Label htmlFor="facebook" className="text-sm">Facebook</Label>
                        <Input
                          id="facebook"
                          value={publicProfile.social_links.facebook}
                          onChange={(e) => 
                            setPublicProfile(prev => ({
                              ...prev,
                              social_links: { ...prev.social_links, facebook: e.target.value }
                            }))
                          }
                          placeholder="https://facebook.com/seu-perfil"
                        />
                      </div>
                      <div>
                        <Label htmlFor="instagram" className="text-sm">Instagram</Label>
                        <Input
                          id="instagram"
                          value={publicProfile.social_links.instagram}
                          onChange={(e) => 
                            setPublicProfile(prev => ({
                              ...prev,
                              social_links: { ...prev.social_links, instagram: e.target.value }
                            }))
                          }
                          placeholder="https://instagram.com/seu-perfil"
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedin" className="text-sm">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={publicProfile.social_links.linkedin}
                          onChange={(e) => 
                            setPublicProfile(prev => ({
                              ...prev,
                              social_links: { ...prev.social_links, linkedin: e.target.value }
                            }))
                          }
                          placeholder="https://linkedin.com/in/seu-perfil"
                        />
                      </div>
                      <div>
                        <Label htmlFor="website" className="text-sm">Website Pessoal</Label>
                        <Input
                          id="website"
                          value={publicProfile.social_links.website}
                          onChange={(e) => 
                            setPublicProfile(prev => ({
                              ...prev,
                              social_links: { ...prev.social_links, website: e.target.value }
                            }))
                          }
                          placeholder="https://seu-site.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* URL do perfil público */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">URL do Seu Perfil Público</h4>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={`${window.location.origin}/dashboard/perfil-publico/${user?.id}`}
                        readOnly
                        className="bg-white text-sm font-mono"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/dashboard/perfil-publico/${user?.id}`);
                          toast({
                            title: "URL copiada",
                            description: "Link do perfil copiado para a área de transferência",
                          });
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>

                  {/* Ações do perfil público */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleViewPublicProfile}
                      className="bg-comademig-blue hover:bg-comademig-blue/90"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar Perfil Público
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleSave}
                      disabled={isLoading('save')}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
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
              <Button 
                className="bg-comademig-blue hover:bg-comademig-blue/90"
                onClick={handleChangePassword}
              >
                <Lock className="mr-2 h-4 w-4" />
                Alterar Senha
              </Button>
            </CardContent>
          </Card>

          {/* LGPD - Direitos dos Dados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download size={20} />
                Seus Dados Pessoais (LGPD)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito de acessar, 
                corrigir, excluir ou portar seus dados pessoais.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={handleDownloadData}
                  disabled={isLoading('download')}
                >
                  <div className="flex items-start gap-3">
                    <Download className="h-5 w-5 mt-1" />
                    <div className="text-left">
                      <p className="font-medium">
                        {isLoading('download') ? 'Preparando download...' : 'Baixar Meus Dados'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Exportar todos os seus dados em formato JSON
                      </p>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onClick={() => window.open('/suporte', '_blank')}
                >
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 mt-1" />
                    <div className="text-left">
                      <p className="font-medium">Exercer Direitos LGPD</p>
                      <p className="text-sm text-gray-600">
                        Solicitar correção, exclusão ou portabilidade
                      </p>
                    </div>
                  </div>
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Seus direitos:</strong> Acesso, retificação, exclusão, portabilidade, 
                  oposição ao tratamento e revisão de decisões automatizadas. 
                  Entre em contato conosco para exercer qualquer um desses direitos.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Atividade Recente */}
        <TabsContent value="atividade" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity size={20} />
                Atividade Recente
              </CardTitle>
              <p className="text-sm text-gray-600">
                Acompanhe suas últimas ações e acessos no sistema
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-2 h-2 bg-comademig-blue rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600 mt-1">{activity.device}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                        <span>{activity.date}</span>
                        <span>•</span>
                        <span>{activity.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {activities.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma atividade recente
                  </h3>
                  <p className="text-gray-600">
                    Suas atividades no sistema aparecerão aqui
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zona de Perigo */}
        <TabsContent value="zona-perigo" className="space-y-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={20} />
                Zona de Perigo
              </CardTitle>
              <p className="text-sm text-red-600">
                Ações irreversíveis que afetam permanentemente sua conta
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Desativar conta */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <LogOut className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-800 mb-2">Desativar Conta</h4>
                    <p className="text-sm text-yellow-700 mb-4">
                      Ao desativar sua conta, você perderá acesso ao sistema, mas seus dados serão mantidos. 
                      Você pode reativar sua conta entrando em contato com o suporte.
                    </p>
                    <Button 
                      variant="outline" 
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Desativar Conta
                    </Button>
                  </div>
                </div>
              </div>

              {/* Excluir conta */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800 mb-2">Excluir Conta Permanentemente</h4>
                    <p className="text-sm text-red-700 mb-4">
                      <strong>Esta ação é irreversível.</strong> Todos os seus dados, incluindo perfil, 
                      carteira digital, histórico de pagamentos e documentos serão permanentemente excluídos. 
                      Esta ação não pode ser desfeita.
                    </p>
                    <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
                      <p className="text-xs text-red-800">
                        <strong>Antes de excluir:</strong> Certifique-se de baixar todos os seus dados 
                        e documentos importantes. Após a exclusão, não será possível recuperar nenhuma informação.
                      </p>
                    </div>
                    <Button 
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => {
                        const confirmDelete = window.confirm(
                          "ATENÇÃO: Esta ação é irreversível!\n\n" +
                          "Todos os seus dados serão permanentemente excluídos.\n" +
                          "Digite 'EXCLUIR' para confirmar:"
                        );
                        
                        if (confirmDelete) {
                          const confirmation = window.prompt("Digite 'EXCLUIR' para confirmar:");
                          if (confirmation === 'EXCLUIR') {
                            toast({
                              title: "Solicitação de exclusão enviada",
                              description: "Entraremos em contato para confirmar a exclusão da conta",
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Conta Permanentemente
                    </Button>
                  </div>
                </div>
              </div>

              {/* Informações importantes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Informações Importantes</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Para alterar dados pessoais, use a aba "Dados Pessoais"</li>
                  <li>• Para questões de suporte, acesse a seção "Suporte" no menu</li>
                  <li>• Em caso de dúvidas sobre exclusão, entre em contato conosco</li>
                  <li>• Lembre-se de baixar seus dados antes de qualquer ação irreversível</li>
                </ul>
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