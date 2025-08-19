import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Save, Edit, User, MapPin, Church } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/hooks/useResponsive";
import { useLoadingState } from "@/hooks/useLoadingState";
import { useAccessibility } from "@/hooks/useAccessibility";
import { FileUpload } from "@/components/forms/FileUpload";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ProgressBar } from "@/components/feedback/ProgressBar";
import { useToast } from "@/hooks/use-toast";

const MeusDados = () => {
  const { user, profile, updateProfile, loading: authLoading } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const { setLoading, isLoading } = useLoadingState();
  const { announceToScreenReader } = useAccessibility();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
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
  });

  // Calculate completion percentage
  const calculateCompletionPercentage = () => {
    const requiredFields = [
      'nome_completo', 'cpf', 'telefone', 'endereco', 
      'cidade', 'estado', 'cep', 'igreja'
    ];
    const completedFields = requiredFields.filter(field => formData[field as keyof typeof formData]);
    return (completedFields.length / requiredFields.length) * 100;
  };

  const completionPercentage = calculateCompletionPercentage();

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
    // Reset form data to original profile data
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
      });
    }
    setIsEditing(false);
    announceToScreenReader("Edição cancelada");
  };

  if (authLoading) {
    return <LoadingSpinner />;
  }

  const gridCols = isMobile ? 1 : isTablet ? 2 : 3;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-comademig-blue">Meus Dados</h1>
          <p className="text-gray-600">Mantenha suas informações sempre atualizadas</p>
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
            <Avatar className="w-32 h-32">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback className="bg-comademig-blue text-white text-2xl">
                {profile?.nome_completo?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U'}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <FileUpload
                bucket="avatars"
                path={`${user?.id}/avatar`}
                onUpload={(url) => {
                  console.log('Avatar uploaded:', url);
                  toast({
                    title: "Foto atualizada",
                    description: "Sua foto de perfil foi atualizada com sucesso",
                  });
                }}
                accept="image/*"
                className="w-full"
              >
                <Button variant="outline" className="w-full">
                  <Upload size={16} className="mr-2" />
                  Alterar Foto
                </Button>
              </FileUpload>
            )}
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
                  aria-describedby="nome_completo-help"
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

      {/* Helper Text */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-700">
            <strong>Dica:</strong> Campos marcados com * são obrigatórios. 
            Mantenha seus dados atualizados para aproveitarmos melhor os recursos da plataforma.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeusDados;
