import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Users, Settings, DollarSign, Calendar } from "lucide-react";
import { useMemberTypeWithPlan } from "@/hooks/useMemberTypeWithPlan";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { UnifiedMemberTypeForm } from "@/components/admin/UnifiedMemberTypeForm";
import { MemberTypeForm } from "./MemberTypeForm";
import { MemberTypeDeleteModal } from "./MemberTypeDeleteModal";
import { MemberTypeStats } from "./MemberTypeStats";
import type { MemberType } from "@/hooks/useMemberTypes";

const MemberTypesManagement = () => {
  const { memberTypes, isLoading, refetch } = useMemberTypeWithPlan();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<MemberType | null>(null);
  const [isUnifiedFormOpen, setIsUnifiedFormOpen] = useState(false);
  const [isLegacyFormOpen, setIsLegacyFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const filteredTypes = memberTypes.filter((type) =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNewUnified = () => {
    setSelectedType(null);
    setFormMode('create');
    setIsUnifiedFormOpen(true);
  };

  const handleCreateLegacy = () => {
    setSelectedType(null);
    setFormMode('create');
    setIsLegacyFormOpen(true);
  };

  const handleEdit = (type: MemberType) => {
    setSelectedType(type);
    setFormMode('edit');
    setIsLegacyFormOpen(true);
  };

  const handleDelete = (type: MemberType) => {
    setSelectedType(type);
    setIsDeleteModalOpen(true);
  };

  const handleUnifiedSuccess = () => {
    setIsUnifiedFormOpen(false);
    setSelectedType(null);
    refetch();
  };

  const handleLegacySuccess = () => {
    setIsLegacyFormOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedType(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tipos de Membro</h1>
          <p className="text-gray-600">Gerencie os tipos de membro e seus planos financeiros</p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleCreateNewUnified}
          >
            <Plus className="h-4 w-4 mr-2" />
            🆕 NOVO: Tipo + Plano Unificado
          </Button>
          <Button 
            variant="outline"
            onClick={handleCreateLegacy}
          >
            <Settings className="h-4 w-4 mr-2" />
            Tipo Simples (Legacy)
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Tipos</p>
                <p className="text-2xl font-bold text-gray-900">{memberTypes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {memberTypes.filter(t => t.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Com Planos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {memberTypes.filter(t => t.plan_title).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sem Planos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {memberTypes.filter(t => !t.plan_title).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card> 
     {/* Lista de Tipos */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Membro ({filteredTypes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{type.name}</h3>
                    <Badge variant={type.is_active ? "default" : "secondary"}>
                      {type.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    {type.plan_title && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Com Plano
                      </Badge>
                    )}
                  </div>
                  {type.description && (
                    <p className="text-gray-600 mt-1">{type.description}</p>
                  )}
                  
                  {/* Informações do Plano Financeiro */}
                  {type.plan_title && (
                    <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                        <DollarSign className="h-4 w-4" />
                        {type.plan_title}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-green-700">
                        <span>R$ {type.plan_value?.toFixed(2)}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {type.plan_recurrence}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {type._count?.users || 0} usuários
                    </span>
                    <span>Criado em {new Date(type.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(type)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(type)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredTypes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Nenhum tipo encontrado' : 'Nenhum tipo de membro cadastrado'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modais */}
      
      {/* Formulário Unificado */}
      <Dialog open={isUnifiedFormOpen} onOpenChange={setIsUnifiedFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Tipo de Membro com Plano</DialogTitle>
          </DialogHeader>
          <UnifiedMemberTypeForm
            onSuccess={handleUnifiedSuccess}
            onCancel={() => setIsUnifiedFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Formulário Legacy */}
      <MemberTypeForm
        isOpen={isLegacyFormOpen}
        onClose={() => setIsLegacyFormOpen(false)}
        onSuccess={handleLegacySuccess}
        memberType={selectedType}
        mode={formMode}
      />

      <MemberTypeDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleLegacySuccess}
        memberType={selectedType}
      />
    </div>
  );
};

export default MemberTypesManagement;