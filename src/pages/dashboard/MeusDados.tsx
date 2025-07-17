
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Save, Edit } from "lucide-react";

const MeusDados = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nome: "João Silva Santos",
    cpf: "123.456.789-00",
    rg: "MG-12.345.678",
    dataNascimento: "1975-03-15",
    telefone: "(31) 99999-9999",
    email: "joao.silva@email.com",
    endereco: "Rua das Flores, 123",
    bairro: "Centro",
    cidade: "Belo Horizonte",
    cep: "30000-000",
    igreja: "Assembleia de Deus - Central",
    campo: "Campo Regional de Belo Horizonte",
    ministerio: "Pastor Presidente",
    dataOrdenacao: "2005-08-20"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Simulação de salvamento
    setIsEditing(false);
    console.log("Dados salvos:", formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-comademig-blue">Meus Dados</h1>
          <p className="text-gray-600">Mantenha suas informações sempre atualizadas</p>
        </div>
        <Button 
          onClick={() => setIsEditing(!isEditing)}
          className="bg-comademig-blue hover:bg-comademig-blue/90"
        >
          <Edit size={16} className="mr-2" />
          {isEditing ? 'Cancelar' : 'Editar'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Photo Section */}
        <Card>
          <CardHeader>
            <CardTitle>Foto do Perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="w-32 h-32">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback className="bg-comademig-blue text-white text-2xl">JS</AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button variant="outline" className="w-full">
                <Upload size={16} className="mr-2" />
                Alterar Foto
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Personal Data */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  disabled={!isEditing}
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
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => handleInputChange('cep', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ministry Data */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Dados Ministeriais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="igreja">Igreja Local</Label>
                <Input
                  id="igreja"
                  value={formData.igreja}
                  onChange={(e) => handleInputChange('igreja', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="campo">Campo Regional</Label>
                <Input
                  id="campo"
                  value={formData.campo}
                  onChange={(e) => handleInputChange('campo', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="ministerio">Ministério</Label>
                <Input
                  id="ministerio"
                  value={formData.ministerio}
                  onChange={(e) => handleInputChange('ministerio', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="dataOrdenacao">Data de Ordenação</Label>
                <Input
                  id="dataOrdenacao"
                  type="date"
                  value={formData.dataOrdenacao}
                  onChange={(e) => handleInputChange('dataOrdenacao', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      {isEditing && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            className="bg-comademig-gold hover:bg-comademig-gold/90"
          >
            <Save size={16} className="mr-2" />
            Salvar Alterações
          </Button>
        </div>
      )}
    </div>
  );
};

export default MeusDados;
